import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { loadChampionReference } from "../../../scripts/data/champion-reference.mjs";
import { loadPlayerRegressionReference } from "../../../scripts/data/player-regression-reference.mjs";
import { assertCanonicalQuality, collectCanonicalQuality } from "./canonical-quality.mjs";

const { Client } = pg;

function parseArguments(argv) {
  let target = "app";
  let version;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") {
      continue;
    } else if (argument === "--target") {
      target = argv[index + 1];
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
  if (!new Set(["app", "test"]).has(target)) {
    throw new Error("--target yalnızca app veya test olabilir.");
  }

  return { target, version };
}

function parseEnvFile(contents) {
  const values = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const separator = trimmed.indexOf("=");
    if (separator <= 0) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function buildMarkdown(report) {
  const previousDiff = report.previousVersionDiff
    ? `v${report.previousVersionDiff.sourceVersion}: oyuncu ${report.previousVersionDiff.players >= 0 ? "+" : ""}${report.previousVersionDiff.players}, kulüp ${report.previousVersionDiff.clubs >= 0 ? "+" : ""}${report.previousVersionDiff.clubs}, maç ${report.previousVersionDiff.matches >= 0 ? "+" : ""}${report.previousVersionDiff.matches}, ilişki ${report.previousVersionDiff.playerClubSeasons >= 0 ? "+" : ""}${report.previousVersionDiff.playerClubSeasons}`
    : "Karşılaştırılabilir önceki sürüm yok.";
  const criticalRows = report.criticalErrors.length
    ? report.criticalErrors.map((error) => `- ${error}`).join("\n")
    : "- Yok";
  const warningRows = report.warnings.length
    ? report.warnings.map((warning) => `- ${warning}`).join("\n")
    : "- Yok";

  return `# Canonical veri kalite raporu — v${report.dataset.source_version}

Durum: **${report.status === "passed" ? "başarılı" : "başarısız"}**

## Kapsam

| Ölçüm | Değer |
| --- | ---: |
| Sezon | ${report.counts.seasons} |
| Ülke | ${report.counts.countries} |
| Kulüp | ${report.counts.clubs} |
| Oyuncu | ${report.counts.players} |
| Maç | ${report.counts.matches} |
| Kanıt | ${report.counts.evidence} |
| Oyuncu–kulüp–sezon | ${report.counts.player_club_seasons} |
| Şampiyon sezon | ${report.counts.champions} |
| Bilinen oyuncu regresyonu | ${report.counts.known_player_regressions} |

## Doluluk

- Vatandaşlık: %${report.playerQuality.citizenshipFillPercent}
- Genel mevki: %${report.playerQuality.positionFillPercent}
- Vatandaşlığı eksik oyuncu: ${report.playerQuality.missing_citizenships}
- Genel mevkisi eksik oyuncu: ${report.playerQuality.missing_positions}
- Açık inceleme kaydı: ${report.issueSummary.open_issues}
- Açık kritik sorun: ${report.issueSummary.open_critical_issues}

## İlişki kontrolleri

- Kanıtsız ilişki: ${report.relationQuality.relations_without_evidence}
- Kanıt sayısı uyuşmazlığı: ${report.relationQuality.relation_count_mismatches}
- Kanıt bayrağı uyuşmazlığı: ${report.relationQuality.relation_flag_mismatches}
- Tarih uyuşmazlığı: ${report.relationQuality.relation_date_mismatches}
- Maç kulübü uyuşmazlığı: ${report.relationQuality.evidence_club_match_mismatches}
- Sezon tarihi dışında kanıt: ${report.relationQuality.evidence_outside_season}
- Aynı maçta iki kulüp adına görünen oyuncu: ${report.relationQuality.players_for_two_clubs_in_match}
- Tek kanıtlı ilişki: ${report.relationQuality.single_evidence_relations}

## Kritik sorunlar

${criticalRows}

## Uyarılar

${warningRows}

## Önceki sürüm farkı

${previousDiff}
`;
}

async function main() {
  const { target, version } = parseArguments(process.argv.slice(2));
  const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const envValues = parseEnvFile(await readFile(path.join(repositoryRoot, ".env"), "utf8"));
  for (const [key, value] of Object.entries(envValues)) {
    process.env[key] ??= value;
  }
  const connectionString =
    target === "test" ? process.env.TEST_DATABASE_URL : process.env.APP_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      `${target === "test" ? "TEST_DATABASE_URL" : "APP_DATABASE_URL"} tanımlı değil.`,
    );
  }

  const snapshotMetadata = JSON.parse(
    await readFile(
      path.join(repositoryRoot, `data/reference/source-snapshots/dcaribou-kaggle-v${version}.json`),
      "utf8",
    ),
  );
  const { championReference } = await loadChampionReference(repositoryRoot, version);
  const { playerRegressionReference } = await loadPlayerRegressionReference(
    repositoryRoot,
    version,
  );
  const client = new Client({
    application_name: `90plus9-quality-v${version}`,
    connectionString,
  });

  try {
    await client.connect();
    const datasetResult = await client.query(
      `SELECT id FROM dataset_versions
        WHERE source_name = $1 AND source_version = $2 AND status IN ('ready', 'active')`,
      [snapshotMetadata.source.name, Number(version)],
    );
    if (datasetResult.rowCount !== 1) {
      throw new Error(`v${version} ready/active canonical dataset bulunamadı.`);
    }

    const report = await collectCanonicalQuality(client, {
      championReference,
      datasetVersionId: datasetResult.rows[0].id,
      expected: snapshotMetadata.applicationImportScope,
      playerRegressionReference,
    });
    const reportDirectory = path.join(repositoryRoot, "reports/data-quality");
    const reportBaseName = `dcaribou-kaggle-v${version}-canonical-quality-${target}`;
    const jsonReportPath = path.join(reportDirectory, `${reportBaseName}.json`);
    const markdownReportPath = path.join(reportDirectory, `${reportBaseName}.md`);
    await mkdir(reportDirectory, { recursive: true });
    await writeFile(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(markdownReportPath, buildMarkdown(report));

    console.log(`Canonical kalite: ${report.status}`);
    console.log(`Kritik sorun: ${report.criticalErrors.length}`);
    console.log(`Uyarı: ${report.warnings.length}`);
    console.log(`Vatandaşlık doluluğu: %${report.playerQuality.citizenshipFillPercent}`);
    console.log(`Mevki doluluğu: %${report.playerQuality.positionFillPercent}`);
    console.log(`Rapor: ${markdownReportPath}`);
    assertCanonicalQuality(report);
  } finally {
    await client.end().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
