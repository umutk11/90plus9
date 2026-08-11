import { spawnSync } from "node:child_process";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function printUsage() {
  console.log(`Kullanım:
  pnpm data:references -- --version 677
  pnpm data:references -- --version 677 --staging-dir /path/to/staging`);
}

function parseArguments(argv) {
  let stagingDirectory;
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--") {
      continue;
    } else if (argument === "--help") {
      printUsage();
      process.exit(0);
    } else if (argument === "--staging-dir") {
      stagingDirectory = argv[index + 1];
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

  return { stagingDirectory, version };
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function runDuckDbJson(databasePath, query) {
  const result = spawnSync("duckdb", ["-json", databasePath, "-c", query], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error?.code === "ENOENT") {
    throw new Error("DuckDB bulunamadı. macOS için `brew install duckdb` çalıştırın.");
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const details = result.stderr.trim().split("\n").slice(0, 20).join("\n");
    throw new Error(details || `DuckDB ${result.status} koduyla başarısız oldu.`);
  }

  return result.stdout.trim() ? JSON.parse(result.stdout) : [];
}

function normalizeName(value) {
  return value
    .normalize("NFD")
    .replaceAll(/\p{M}/gu, "")
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll(/[^a-z0-9]+/g, " ")
    .trim();
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }

  return [...duplicates];
}

function validateCommonMetadata(reference, version, label, errors) {
  if (reference.schemaVersion !== 1) {
    errors.push(`${label}: schemaVersion 1 olmalıdır.`);
  }
  if (reference.datasetVersion !== Number(version)) {
    errors.push(`${label}: datasetVersion v${version} ile uyuşmuyor.`);
  }
  if (!["pending", "approved"].includes(reference.reviewStatus)) {
    errors.push(`${label}: reviewStatus pending veya approved olmalıdır.`);
  }
  if (
    reference.reviewStatus === "approved" &&
    (!reference.reviewedAt || !reference.reviewedBy?.trim())
  ) {
    errors.push(`${label}: approved kayıt reviewedAt ve reviewedBy içermelidir.`);
  }
}

function validateClubs(reference, stagingClubs, version) {
  const errors = [];
  const warnings = [];
  validateCommonMetadata(reference, version, "Kulüp referansı", errors);

  if (!Array.isArray(reference.clubs)) {
    return { errors: [...errors, "Kulüp referansı: clubs listesi bulunamadı."], warnings };
  }

  const sourceById = new Map(stagingClubs.map((club) => [club.sourceClubId, club.sourceName]));
  const referenceById = new Map(reference.clubs.map((club) => [club.sourceClubId, club]));
  const duplicateIds = duplicateValues(reference.clubs.map((club) => club.sourceClubId));
  const duplicateNames = duplicateValues(
    reference.clubs.map((club) => normalizeName(club.proposedName ?? "")),
  );

  if (duplicateIds.length > 0) {
    errors.push(`Kulüp referansı: tekrar eden sourceClubId: ${duplicateIds.join(", ")}`);
  }
  if (duplicateNames.length > 0) {
    errors.push(`Kulüp referansı: çakışan canonical ad: ${duplicateNames.join(", ")}`);
  }

  for (const [sourceClubId, sourceName] of sourceById) {
    const club = referenceById.get(sourceClubId);
    if (!club) {
      errors.push(`Kulüp referansı: kaynak kulüp eksik: ${sourceClubId} ${sourceName}`);
      continue;
    }
    if (club.sourceName !== sourceName) {
      errors.push(
        `Kulüp referansı: ${sourceClubId} kaynak adı uyuşmuyor; beklenen ${sourceName}, bulunan ${club.sourceName}`,
      );
    }
  }

  for (const club of reference.clubs) {
    if (!sourceById.has(club.sourceClubId)) {
      errors.push(`Kulüp referansı: kapsam dışı sourceClubId: ${club.sourceClubId}`);
    }
    if (!club.proposedName?.trim() || !club.city?.trim()) {
      errors.push(`Kulüp referansı: ${club.sourceClubId} için ad veya şehir eksik.`);
    }
    if (club.isIstanbul !== (club.city === "İstanbul")) {
      errors.push(`Kulüp referansı: ${club.sourceClubId} İstanbul bayrağı şehirle uyuşmuyor.`);
    }
    if (!["pending", "approved"].includes(club.reviewStatus)) {
      errors.push(`Kulüp referansı: ${club.sourceClubId} reviewStatus geçersiz.`);
    }
  }

  const expectedBigFour = new Set([36, 114, 141, 449]);
  const actualBigFour = new Set(
    reference.clubs.filter((club) => club.isBigFour).map((club) => club.sourceClubId),
  );
  if (
    expectedBigFour.size !== actualBigFour.size ||
    [...expectedBigFour].some((sourceClubId) => !actualBigFour.has(sourceClubId))
  ) {
    errors.push(
      "Kulüp referansı: dört büyük bayrakları Beşiktaş, Fenerbahçe, Galatasaray ve Trabzonspor olmalıdır.",
    );
  }

  const pending = reference.clubs.filter((club) => club.reviewStatus === "pending");
  if (pending.length > 0) {
    warnings.push(`${pending.length} kulüp adı kullanıcı onayı bekliyor.`);
  }
  if (reference.reviewStatus === "approved" && pending.length > 0) {
    errors.push("Kulüp referansı approved olamaz; onay bekleyen kulüpler var.");
  }

  return { errors, pending, warnings };
}

function validateCountries(reference, sourceCountries, rawCountryValues, version) {
  const errors = [];
  const warnings = [];
  validateCommonMetadata(reference, version, "Ülke referansı", errors);

  if (reference.mapExactSourceNames !== true) {
    errors.push("Ülke referansı: mapExactSourceNames true olmalıdır.");
  }
  if (!Array.isArray(reference.overrides)) {
    return { errors: [...errors, "Ülke referansı: overrides listesi bulunamadı."], warnings };
  }

  const sourceNames = new Set(sourceCountries.map((country) => country.sourceName));
  const rawByName = new Map(rawCountryValues.map((country) => [country.sourceName, country]));
  const missingRawNames = new Set(
    rawCountryValues
      .map((country) => country.sourceName)
      .filter((sourceName) => !sourceNames.has(sourceName)),
  );
  const overrideByName = new Map(
    reference.overrides.map((override) => [override.sourceName, override]),
  );
  const duplicateSourceNames = duplicateValues(
    reference.overrides.map((override) => override.sourceName),
  );

  if (duplicateSourceNames.length > 0) {
    errors.push(`Ülke referansı: tekrar eden override: ${duplicateSourceNames.join(", ")}`);
  }

  for (const sourceName of missingRawNames) {
    if (!overrideByName.has(sourceName)) {
      errors.push(`Ülke referansı: eşleştirme eksik: ${sourceName}`);
    }
  }
  for (const override of reference.overrides) {
    if (!missingRawNames.has(override.sourceName)) {
      errors.push(
        `Ülke referansı: gereksiz veya kaynakta olmayan override: ${override.sourceName}`,
      );
    }
  }

  const allowedResolutions = new Set([
    "additional_canonical",
    "alternative_alias",
    "historical_alias",
    "unresolved_historical",
  ]);
  const additionalTargets = new Set(
    reference.overrides
      .filter((override) => override.resolution === "additional_canonical")
      .map((override) => override.targetCanonicalName),
  );
  const knownTargets = new Set([...sourceNames, ...additionalTargets]);
  const targetCodes = new Map();

  for (const override of reference.overrides) {
    const raw = rawByName.get(override.sourceName);
    if (!allowedResolutions.has(override.resolution)) {
      errors.push(`Ülke referansı: ${override.sourceName} resolution geçersiz.`);
    }
    if (!["pending", "approved"].includes(override.reviewStatus)) {
      errors.push(`Ülke referansı: ${override.sourceName} reviewStatus geçersiz.`);
    }

    if (override.resolution === "unresolved_historical") {
      if (
        override.targetCanonicalName !== null ||
        override.proposedDisplayName !== null ||
        override.isoAlpha2 !== null ||
        override.isoAlpha3 !== null
      ) {
        errors.push(`Ülke referansı: ${override.sourceName} unresolved alanları null olmalıdır.`);
      }
      if ((raw?.citizenshipCount ?? 0) > 0) {
        errors.push(
          `Ülke referansı: vatandaşlık değeri çözümsüz bırakılamaz: ${override.sourceName}`,
        );
      }
      continue;
    }

    if (!knownTargets.has(override.targetCanonicalName)) {
      errors.push(
        `Ülke referansı: ${override.sourceName} bilinmeyen hedefe bağlı: ${override.targetCanonicalName}`,
      );
    }
    if (!override.proposedDisplayName?.trim()) {
      errors.push(`Ülke referansı: ${override.sourceName} için görünen ad eksik.`);
    }
    if (!/^[A-Z]{2}$/.test(override.isoAlpha2 ?? "")) {
      errors.push(`Ülke referansı: ${override.sourceName} ISO alpha-2 geçersiz.`);
    }
    if (!/^[A-Z]{3}$/.test(override.isoAlpha3 ?? "")) {
      errors.push(`Ülke referansı: ${override.sourceName} ISO alpha-3 geçersiz.`);
    }

    const existingCodes = targetCodes.get(override.targetCanonicalName);
    const currentCodes = `${override.isoAlpha2}/${override.isoAlpha3}`;
    if (existingCodes && existingCodes !== currentCodes) {
      errors.push(`Ülke referansı: ${override.targetCanonicalName} için ISO kodları çelişiyor.`);
    }
    targetCodes.set(override.targetCanonicalName, currentCodes);
  }

  const pending = reference.overrides.filter((override) => override.reviewStatus === "pending");
  const unresolved = reference.overrides.filter(
    (override) => override.resolution === "unresolved_historical",
  );
  if (pending.length > 0) {
    warnings.push(`${pending.length} ülke override kaydı kullanıcı onayı bekliyor.`);
  }
  if (unresolved.length > 0) {
    warnings.push(`${unresolved.length} tarihsel doğum ülkesi oyuncu bazında çözülmeli.`);
  }
  if (reference.reviewStatus === "approved" && pending.length > 0) {
    errors.push("Ülke referansı approved olamaz; onay bekleyen kayıtlar var.");
  }

  return { errors, pending, unresolved, warnings };
}

function buildReviewMarkdown(clubReference, countryReference, countryResult, report) {
  const clubRows = clubReference.clubs
    .map(
      (club) =>
        `| ${club.sourceClubId} | ${club.sourceName} | ${club.proposedName} | ${club.city} | ${club.reviewStatus} | ${club.reviewNote ?? ""} |`,
    )
    .join("\n");
  const unresolvedRows = countryResult.unresolved
    .map((entry) => {
      const usage = report.countryUsage.find((item) => item.sourceName === entry.sourceName);
      return `| ${entry.sourceName} | ${usage?.birthCount ?? 0} | ${entry.reviewNote ?? ""} |`;
    })
    .join("\n");

  return `# Referans eşleştirme incelemesi — v${report.snapshotVersion}

Durum: **${report.status}**

Canonical importa hazır: **${report.readyForCanonicalImport ? "evet" : "hayır"}**

## Kulüp adları

| Kaynak ID | Kaynak adı | Önerilen ad | Şehir | Durum | Not |
| ---: | --- | --- | --- | --- | --- |
${clubRows}

## Ülke eşleştirme özeti

- Kaynak ülke adı: ${report.summary.sourceCountries}
- Oyuncularda kullanılan farklı ülke metni: ${report.summary.rawCountryValues}
- Otomatik birebir eşleşen: ${report.summary.exactCountryMappings}
- Override ile kapsanan: ${countryReference.overrides.length}
- Oyuncu bazında çözülmesi gereken tarihsel değer: ${countryResult.unresolved.length}

| Çözümsüz tarihsel değer | Oyuncu | Not |
| --- | ---: | --- |
${unresolvedRows}
`;
}

async function main() {
  const { stagingDirectory: requestedStagingDirectory, version } = parseArguments(
    process.argv.slice(2),
  );
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const stagingDirectory = path.resolve(
    requestedStagingDirectory ??
      path.join(repositoryRoot, `data/staging/dcaribou-kaggle-v${version}`),
  );
  const databasePath = path.join(stagingDirectory, "staging.duckdb");
  const clubReferencePath = path.join(
    repositoryRoot,
    `data/reference/club-identities/dcaribou-kaggle-v${version}.json`,
  );
  const countryReferencePath = path.join(
    repositoryRoot,
    `data/reference/country-mappings/dcaribou-kaggle-v${version}.json`,
  );

  for (const requiredPath of [databasePath, clubReferencePath, countryReferencePath]) {
    if (!(await fileExists(requiredPath))) {
      throw new Error(`Gerekli dosya bulunamadı: ${requiredPath}`);
    }
  }

  const clubReference = JSON.parse(await readFile(clubReferencePath, "utf8"));
  const countryReference = JSON.parse(await readFile(countryReferencePath, "utf8"));
  const stagingClubs = runDuckDbJson(
    databasePath,
    `SELECT source_club_id AS "sourceClubId", source_name AS "sourceName" FROM stg_clubs ORDER BY source_club_id;`,
  );
  const sourceCountries = runDuckDbJson(
    databasePath,
    `SELECT source_country_id AS "sourceCountryId", source_name AS "sourceName" FROM stg_countries ORDER BY source_country_id;`,
  );
  const rawCountryValues = runDuckDbJson(
    databasePath,
    `WITH country_usage AS (
      SELECT raw_citizenship AS source_name, 'citizenship' AS usage FROM stg_players
        WHERE raw_citizenship IS NOT NULL
      UNION ALL
      SELECT raw_country_of_birth AS source_name, 'birth' AS usage FROM stg_players
        WHERE raw_country_of_birth IS NOT NULL
    )
    SELECT
      source_name AS "sourceName",
      COUNT(*) FILTER (WHERE usage = 'citizenship') AS "citizenshipCount",
      COUNT(*) FILTER (WHERE usage = 'birth') AS "birthCount"
    FROM country_usage
    GROUP BY source_name
    ORDER BY source_name;`,
  );

  const clubResult = validateClubs(clubReference, stagingClubs, version);
  const countryResult = validateCountries(
    countryReference,
    sourceCountries,
    rawCountryValues,
    version,
  );
  const errors = [...clubResult.errors, ...countryResult.errors];
  const warnings = [...clubResult.warnings, ...countryResult.warnings];
  const sourceCountryNames = new Set(sourceCountries.map((country) => country.sourceName));
  const exactCountryMappings = rawCountryValues.filter((country) =>
    sourceCountryNames.has(country.sourceName),
  ).length;
  const report = {
    schemaVersion: 1,
    snapshotVersion: Number(version),
    checkedAt: new Date().toISOString(),
    status: errors.length === 0 ? "passed" : "failed",
    readyForCanonicalImport:
      errors.length === 0 &&
      clubReference.reviewStatus === "approved" &&
      countryReference.reviewStatus === "approved" &&
      countryResult.unresolved.length === 0,
    summary: {
      stagingClubs: stagingClubs.length,
      clubMappings: clubReference.clubs.length,
      pendingClubMappings: clubResult.pending?.length ?? 0,
      sourceCountries: sourceCountries.length,
      rawCountryValues: rawCountryValues.length,
      exactCountryMappings,
      countryOverrides: countryReference.overrides.length,
      pendingCountryOverrides: countryResult.pending?.length ?? 0,
      unresolvedHistoricalCountries: countryResult.unresolved?.length ?? 0,
    },
    errors,
    warnings,
    countryUsage: rawCountryValues,
  };

  const reportDirectory = path.join(repositoryRoot, "reports/data-quality");
  const reportBaseName = `dcaribou-kaggle-v${version}-reference-mappings`;
  const jsonReportPath = path.join(reportDirectory, `${reportBaseName}.json`);
  const markdownReportPath = path.join(reportDirectory, `${reportBaseName}.md`);
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(
    markdownReportPath,
    buildReviewMarkdown(clubReference, countryReference, countryResult, report),
  );

  console.log(`Kulüp eşleştirmesi: ${report.summary.clubMappings}/${report.summary.stagingClubs}`);
  console.log(`Onay bekleyen kulüp: ${report.summary.pendingClubMappings}`);
  console.log(`Ülke metni kapsamı: ${report.summary.rawCountryValues}`);
  console.log(`Birebir ülke eşleşmesi: ${report.summary.exactCountryMappings}`);
  console.log(`Ülke override: ${report.summary.countryOverrides}`);
  console.log(`Çözümsüz tarihsel değer: ${report.summary.unresolvedHistoricalCountries}`);
  console.log(`İnceleme raporu: ${markdownReportPath}`);

  for (const warning of warnings) {
    console.warn(`Uyarı: ${warning}`);
  }

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`Hata: ${error}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
