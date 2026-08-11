import { spawnSync } from "node:child_process";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function printUsage() {
  console.log(`Kullanım:
  pnpm data:validate -- --version 677
  pnpm data:validate -- --version 677 --snapshot-dir /path/to/snapshot`);
}

function parseArguments(argv) {
  let snapshotDirectory;
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    } else if (argument === "--help") {
      printUsage();
      process.exit(0);
    } else if (argument === "--snapshot-dir") {
      snapshotDirectory = argv[index + 1];
      index += 1;
    } else if (argument === "--version") {
      version = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Bilinmeyen parametre: ${argument}`);
    }
  }

  if (!version || !/^\d+$/.test(version)) {
    throw new Error("--version ile pozitif bir snapshot sürümü verilmelidir.");
  }

  return { snapshotDirectory, version };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function csvRelation(filePath, csvOptions) {
  return `read_csv_auto(
    ${sqlLiteral(filePath)},
    header = true,
    delim = ${sqlLiteral(csvOptions.delimiter)},
    quote = ${sqlLiteral(csvOptions.quote)},
    escape = ${sqlLiteral(csvOptions.escape)},
    encoding = ${sqlLiteral(csvOptions.encoding)},
    sample_size = -1,
    strict_mode = true,
    ignore_errors = false,
    null_padding = false
  )`;
}

function runDuckDb(arguments_) {
  const result = spawnSync("duckdb", arguments_, {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });

  if (result.error?.code === "ENOENT") {
    throw new Error("DuckDB bulunamadı. macOS için `brew install duckdb` çalıştırın.");
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = result.stderr.trim().split("\n").slice(0, 12).join("\n");
    throw new Error(details || `DuckDB ${result.status} koduyla başarısız oldu.`);
  }

  return result.stdout.trim();
}

function runDuckDbJson(query) {
  const output = runDuckDb(["-json", ":memory:", "-c", query]);

  return output ? JSON.parse(output) : [];
}

function getDuckDbVersion() {
  return runDuckDb(["--version"]);
}

function compareColumns(fileName, expectedColumns, actualColumns) {
  const errors = [];
  const warnings = [];
  const actualByName = new Map(
    actualColumns.map((column) => [column.column_name, column.column_type]),
  );
  const expectedNames = Object.keys(expectedColumns);
  const actualNames = actualColumns.map((column) => column.column_name);

  for (const [columnName, expectedType] of Object.entries(expectedColumns)) {
    const actualType = actualByName.get(columnName);

    if (!actualType) {
      errors.push(`${fileName}: beklenen sütun eksik: ${columnName}`);
    } else if (actualType !== expectedType) {
      errors.push(`${fileName}.${columnName}: beklenen tip ${expectedType}, bulunan ${actualType}`);
    }
  }

  for (const columnName of actualNames) {
    if (!(columnName in expectedColumns)) {
      warnings.push(`${fileName}: yeni/bilinmeyen sütun: ${columnName}`);
    }
  }

  const knownActualNames = actualNames.filter((name) => name in expectedColumns);

  if (knownActualNames.join("\0") !== expectedNames.join("\0")) {
    warnings.push(`${fileName}: bilinen sütunların sırası değişti.`);
  }

  return { errors, warnings };
}

async function validateFile(fileName, fileSchema, snapshotDirectory, csvOptions) {
  const filePath = path.join(snapshotDirectory, fileName);
  const errors = [];
  const warnings = [];

  if (!(await fileExists(filePath))) {
    errors.push(`Beklenen kaynak dosya eksik: ${fileName}`);
    return { errors, fileName, status: "failed", warnings };
  }

  try {
    const relation = csvRelation(filePath, csvOptions);
    const actualColumns = runDuckDbJson(`DESCRIBE SELECT * FROM ${relation};`);
    const comparison = compareColumns(fileName, fileSchema.columns, actualColumns);
    const [countResult] = runDuckDbJson(`SELECT COUNT(*) AS row_count FROM ${relation};`);

    errors.push(...comparison.errors);
    warnings.push(...comparison.warnings);

    return {
      actualColumns: actualColumns.map((column) => ({
        name: column.column_name,
        type: column.column_type,
      })),
      errors,
      fileName,
      rowCount: countResult.row_count,
      status: errors.length === 0 ? "passed" : "failed",
      warnings,
    };
  } catch (error) {
    errors.push(
      `${fileName}: CSV ayrıştırma/encoding kontrolü başarısız: ${
        error instanceof Error ? error.message : error
      }`,
    );

    return { errors, fileName, status: "failed", warnings };
  }
}

async function main() {
  const { snapshotDirectory: requestedDirectory, version } = parseArguments(process.argv.slice(2));
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const snapshotDirectory = path.resolve(
    requestedDirectory ?? path.join(repositoryRoot, `data/raw/dcaribou-kaggle-v${version}`),
  );
  const schemaPath = path.join(repositoryRoot, "scripts/data/source-schema.json");
  const reportDirectory = path.join(repositoryRoot, "reports/data-quality");
  const reportPath = path.join(reportDirectory, `dcaribou-kaggle-v${version}-schema.json`);
  const schema = JSON.parse(await readFile(schemaPath, "utf8"));
  const expectedFileNames = Object.keys(schema.files);
  const directoryEntries = await readdir(snapshotDirectory, { withFileTypes: true });
  const actualCsvFiles = directoryEntries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".csv"))
    .map((entry) => entry.name)
    .sort();
  const warnings = actualCsvFiles
    .filter((fileName) => !expectedFileNames.includes(fileName))
    .map((fileName) => `Yeni/bilinmeyen CSV dosyası: ${fileName}`);
  const duckdbVersion = getDuckDbVersion();
  const files = [];

  console.log(`Snapshot doğrulanıyor: ${snapshotDirectory}`);

  for (const [fileName, fileSchema] of Object.entries(schema.files)) {
    const result = await validateFile(fileName, fileSchema, snapshotDirectory, schema.csv);

    files.push(result);
    warnings.push(...result.warnings);

    if (result.status === "passed") {
      console.log(`✓ ${fileName}: ${result.rowCount} satır`);
    } else {
      console.log(`✗ ${fileName}`);
    }
  }

  const errors = files.flatMap((file) => file.errors);
  const report = {
    schemaVersion: schema.schemaVersion,
    snapshotVersion: Number(version),
    snapshotDirectory: path.relative(repositoryRoot, snapshotDirectory),
    checkedAt: new Date().toISOString(),
    duckdbVersion,
    csv: schema.csv,
    status: errors.length === 0 ? "passed" : "failed",
    files,
    warnings,
    errors,
  };

  await mkdir(reportDirectory, { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

  for (const warning of warnings) {
    console.warn(`UYARI: ${warning}`);
  }

  for (const error of errors) {
    console.error(`HATA: ${error}`);
  }

  console.log(`Rapor: ${reportPath}`);

  if (errors.length > 0) {
    process.exitCode = 1;
  } else {
    console.log("Kaynak şema doğrulaması başarılı.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
