import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const KAGGLE_DATASET = "davidcariboo/player-scores";
const KAGGLE_METADATA_URL = `https://www.kaggle.com/api/v1/datasets/view/${KAGGLE_DATASET}`;

function printUsage() {
  console.log(`Kullanım:
  pnpm data:download -- --version 677
  pnpm data:download -- --latest

Production kullanımı açık sürüm ve checksum gerektirir:
  PLUS9_ENVIRONMENT=production pnpm data:download -- --version 677 --expected-sha256 <sha256>`);
}

function parseArguments(argv) {
  let expectedSha256;
  let latest = false;
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    } else if (argument === "--expected-sha256") {
      expectedSha256 = argv[index + 1];
      index += 1;
    } else if (argument === "--help") {
      printUsage();
      process.exit(0);
    } else if (argument === "--latest") {
      latest = true;
    } else if (argument === "--version") {
      version = argv[index + 1];
      index += 1;
    } else {
      throw new Error(`Bilinmeyen parametre: ${argument}`);
    }
  }

  if (latest && version) {
    throw new Error("--latest ve --version birlikte kullanılamaz.");
  }

  if (!latest && !version) {
    throw new Error("--version zorunludur. Yerel inceleme için --latest kullanılabilir.");
  }

  if (version && !/^\d+$/.test(version)) {
    throw new Error("Sürüm pozitif bir Kaggle sürüm numarası olmalıdır.");
  }

  if (expectedSha256 && !/^[a-f\d]{64}$/i.test(expectedSha256)) {
    throw new Error("--expected-sha256 geçerli bir SHA-256 değeri olmalıdır.");
  }

  return { expectedSha256: expectedSha256?.toLowerCase(), latest, version };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function calculateSha256(filePath) {
  const hash = createHash("sha256");

  await pipeline(createReadStream(filePath), hash);

  return hash.digest("hex");
}

function runUnzip(arguments_) {
  const result = spawnSync("unzip", arguments_, { stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`unzip işlemi ${result.status} koduyla başarısız oldu.`);
  }
}

async function getMetadata() {
  const response = await fetch(KAGGLE_METADATA_URL);

  if (!response.ok) {
    throw new Error(`Kaggle metadata isteği başarısız: HTTP ${response.status}`);
  }

  return response.json();
}

async function downloadArchive(downloadUrl, archivePath, partialPath) {
  if (await fileExists(partialPath)) {
    throw new Error(
      `Yarım kalmış dosya bulundu: ${partialPath}. İncelemeden yeni indirme başlatılmadı.`,
    );
  }

  console.log(`Snapshot indiriliyor: ${downloadUrl}`);
  const response = await fetch(downloadUrl, { redirect: "follow" });

  if (!response.ok || !response.body) {
    throw new Error(`Snapshot indirilemedi: HTTP ${response.status}`);
  }

  await pipeline(response.body, createWriteStream(partialPath, { flags: "wx" }));
  await rename(partialPath, archivePath);
}

async function readExistingManifest(manifestPath) {
  if (!(await fileExists(manifestPath))) {
    return undefined;
  }

  return JSON.parse(await readFile(manifestPath, "utf8"));
}

async function main() {
  const {
    expectedSha256,
    latest,
    version: requestedVersion,
  } = parseArguments(process.argv.slice(2));
  const environment = process.env.PLUS9_ENVIRONMENT ?? "local";

  if (latest && environment !== "local") {
    throw new Error("--latest yalnızca local inceleme ortamında kullanılabilir.");
  }

  if (environment === "production" && !expectedSha256) {
    throw new Error("Production indirmesinde --expected-sha256 zorunludur.");
  }

  const metadata = await getMetadata();
  const version = latest ? String(metadata.currentVersionNumber) : requestedVersion;
  const sourceVersion = metadata.versions?.find(
    (candidate) => String(candidate.versionNumber) === version,
  );
  const sourceUpdatedAt = sourceVersion?.creationDate ?? null;
  const downloadUrl = `https://www.kaggle.com/api/v1/datasets/download/${KAGGLE_DATASET}?datasetVersionNumber=${version}`;
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const rawDirectory = path.join(repositoryRoot, "data/raw");
  const snapshotName = `dcaribou-kaggle-v${version}`;
  const archivePath = path.join(rawDirectory, `${snapshotName}.zip`);
  const partialPath = `${archivePath}.part`;
  const snapshotDirectory = path.join(rawDirectory, snapshotName);
  const extractingDirectory = `${snapshotDirectory}.extracting`;
  const manifestPath = path.join(rawDirectory, `${snapshotName}.manifest.json`);

  await mkdir(rawDirectory, { recursive: true });

  if (!(await fileExists(archivePath))) {
    await downloadArchive(downloadUrl, archivePath, partialPath);
  } else {
    console.log(`Mevcut arşiv doğrulanacak: ${archivePath}`);
  }

  runUnzip(["-tq", archivePath]);

  const sha256 = await calculateSha256(archivePath);
  const archiveStats = await stat(archivePath);
  const existingManifest = await readExistingManifest(manifestPath);
  const checksumToVerify = expectedSha256 ?? existingManifest?.sha256;

  if (checksumToVerify && sha256 !== checksumToVerify) {
    throw new Error(`Checksum eşleşmedi. Beklenen ${checksumToVerify}, bulunan ${sha256}.`);
  }

  if (!(await fileExists(snapshotDirectory))) {
    if (await fileExists(extractingDirectory)) {
      throw new Error(
        `Yarım kalmış çıkarma klasörü bulundu: ${extractingDirectory}. İncelemeden devam edilmedi.`,
      );
    }

    await mkdir(extractingDirectory);
    runUnzip(["-q", archivePath, "-d", extractingDirectory]);
    await rename(extractingDirectory, snapshotDirectory);
  }

  const manifest = {
    source: "dcaribou/transfermarkt-datasets",
    distribution: "Kaggle",
    distributionDataset: KAGGLE_DATASET,
    version: Number(version),
    sourceUpdatedAt,
    downloadedAt: existingManifest?.downloadedAt ?? new Date().toISOString(),
    downloadUrl,
    archive: path.basename(archivePath),
    sizeBytes: archiveStats.size,
    sha256,
  };

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    flag: "w",
  });

  console.log(`Snapshot hazır: ${snapshotDirectory}`);
  console.log(`Boyut: ${archiveStats.size} bayt`);
  console.log(`SHA-256: ${sha256}`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
