import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadChampionReference } from "./champion-reference.mjs";

function printUsage() {
  console.log(`Kullanım:
  pnpm data:champions -- --version 677`);
}

function parseArguments(argv) {
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") {
      continue;
    } else if (argument === "--help") {
      printUsage();
      process.exit(0);
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

  return { version };
}

function buildMarkdown(reference) {
  const rows = reference.champions
    .map(
      (champion) =>
        `| ${champion.seasonStartYear}/${String(champion.seasonStartYear + 1).slice(-2)} | ${champion.canonicalClubName} | ${champion.sourceClubId} | [TFF sezon arşivi](${champion.sourceUrl}) |`,
    )
    .join("\n");

  return `# Süper Lig şampiyonluk referansı — v${reference.datasetVersion}

Durum: **başarılı**

Kaynak: [TFF Süper Lig şampiyonluk arşivi](${reference.officialArchiveUrl})

Kaynakların son erişim kontrolü: ${reference.sourceCheckedAt}

| Sezon | Şampiyon | Kaynak kulüp ID | Resmî kaynak |
| --- | --- | ---: | --- |
${rows}
`;
}

async function main() {
  const { version } = parseArguments(process.argv.slice(2));
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
  const { championReference, championReferencePath, validation } = await loadChampionReference(
    repositoryRoot,
    version,
  );
  const report = {
    schemaVersion: 1,
    snapshotVersion: Number(version),
    checkedAt: new Date().toISOString(),
    status: "passed",
    readyForCanonicalImport: true,
    referencePath: path.relative(repositoryRoot, championReferencePath),
    officialArchiveUrl: championReference.officialArchiveUrl,
    sourceCheckedAt: championReference.sourceCheckedAt,
    summary: {
      seasons: championReference.champions.length,
      uniqueChampionClubs: new Set(
        championReference.champions.map((champion) => champion.sourceClubId),
      ).size,
      warnings: validation.warnings.length,
    },
    champions: championReference.champions,
    warnings: validation.warnings,
  };
  const reportDirectory = path.join(repositoryRoot, "reports/data-quality");
  const reportBaseName = `dcaribou-kaggle-v${version}-champions`;
  const jsonReportPath = path.join(reportDirectory, `${reportBaseName}.json`);
  const markdownReportPath = path.join(reportDirectory, `${reportBaseName}.md`);
  await mkdir(reportDirectory, { recursive: true });
  await writeFile(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);
  await writeFile(markdownReportPath, buildMarkdown(championReference));

  console.log(`Şampiyonluk referansı: ${championReference.champions.length}/14 sezon`);
  console.log(`Farklı şampiyon kulüp: ${report.summary.uniqueChampionClubs}`);
  console.log(`Resmî kaynak: ${championReference.officialArchiveUrl}`);
  console.log(`Kalite raporu: ${markdownReportPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
