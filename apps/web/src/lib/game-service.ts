import "server-only";

import { createHash, randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { getDatabasePool } from "./database";
import {
  gridCriterionCatalog,
  gridColumns,
  gridRows,
  isGridCellKey,
  type GridCriterion,
  type GridCellKey,
} from "./grid-config";

const SESSION_COOKIE_NAME = "plus9_session";
const DEVICE_COOKIE_NAME = "plus9_device";
const MINIMUM_ANSWERS_PER_CELL = 8;
const RULE_ENGINE_VERSION = "mvp-6-african-nationality-group";
const DIFFICULTY_FORMULA_VERSION = "count-1";
const ARCHIVE_GRID_DATES = [
  "2026-08-01",
  "2026-08-02",
  "2026-08-03",
  "2026-08-04",
  "2026-08-05",
  "2026-08-06",
  "2026-08-07",
  "2026-08-08",
  "2026-08-09",
  "2026-08-10",
  "2026-08-11",
  "2026-08-14",
  "2026-08-15",
  "2026-08-16",
] as const;

type GridRecord = {
  id: number;
  play_date: string | Date;
  slug: string;
  row_rules: unknown;
  column_rules: unknown;
};

type SessionRecord = {
  device_id: string;
  id: string;
  status: "active" | "completed" | "expired";
  started_at: Date;
  completed_at: Date | null;
};

export type GamePlayer = { id: number; jokerUsed?: boolean; name: string };
export type FilledCells = Partial<Record<GridCellKey, GamePlayer>>;
type PublicCriterion = Pick<GridCriterion, "id" | "label" | "mark">;
export type GameJokerState = {
  available: boolean;
  cellKey: GridCellKey | null;
  players: GamePlayer[];
};

export type DailyGame = {
  answerCounts: Partial<Record<GridCellKey, number>>;
  availableGrids: AvailableGrid[];
  columns: PublicCriterion[];
  completedAt: string | null;
  filledCells: FilledCells;
  grid: {
    date: string;
    dateLabel: string;
    number: number;
    slug: string;
  };
  joker: GameJokerState;
  progress: number;
  rows: PublicCriterion[];
  sessionStatus: "active" | "completed";
  startedAt: string;
  statistics: GameStatistics;
};

export type AvailableGrid = {
  completed: boolean;
  date: string;
  dateLabel: string;
  number: number;
  slug: string;
};

export type GameStatistics = {
  bestStreak: number;
  completedGrids: number;
  currentStreak: number;
  recentDays: Array<{
    completed: boolean;
    date: string;
    dateLabel: string;
  }>;
};

export class GameError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
  ) {
    super(code);
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export function getDeviceCookieName() {
  return DEVICE_COOKIE_NAME;
}

function normalizeUuid(value?: string | null) {
  return value &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function getIstanbulDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function formatDateLabel(playDate: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(playDate);
  if (!match) throw new GameError("INVALID_GRID_DATE", 500);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
    year: "numeric",
  })
    .format(new Date(Date.UTC(year, month - 1, day, 12)))
    .toLocaleUpperCase("tr-TR");
}

function parseGridConfig<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function sqlText(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function criterionCondition(criterion: GridCriterion) {
  const acceptedRelation = `
    pcs.dataset_version_id = dataset.id
    AND pcs.is_accepted_for_game = true
    AND pcs.review_status = 'approved'`;

  switch (criterion.kind) {
    case "club":
      if (!criterion.sourceClubId) throw new GameError("INVALID_GRID_CRITERION", 500);
      return `EXISTS (
        SELECT 1
        FROM player_club_seasons pcs
        JOIN clubs c ON c.id = pcs.club_id
        WHERE pcs.player_id = p.id
          AND ${acceptedRelation}
          AND c.source_club_id = ${criterion.sourceClubId}
      )`;
    case "position":
      if (criterion.positionGroup) {
        return `p.position_group = ${sqlText(criterion.positionGroup)}`;
      }
      if (criterion.rawSubPosition) {
        return `p.raw_sub_position = ${sqlText(criterion.rawSubPosition)}`;
      }
      throw new GameError("INVALID_GRID_CRITERION", 500);
    case "nationality":
      if (!criterion.isoAlpha2) throw new GameError("INVALID_GRID_CRITERION", 500);
      return `EXISTS (
        SELECT 1 FROM countries country
        WHERE country.id = p.citizenship_country_id
          AND country.iso_alpha_2 = ${sqlText(criterion.isoAlpha2)}
      )`;
    case "region": {
      const conditions = ["country.id = p.citizenship_country_id"];
      if (criterion.confederation) {
        conditions.push(`country.confederation = ${sqlText(criterion.confederation)}`);
      }
      if (criterion.excludeTurkey) conditions.push("country.iso_alpha_2 IS DISTINCT FROM 'TR'");
      return `EXISTS (
        SELECT 1 FROM countries country
        WHERE ${conditions.join(" AND ")}
      )`;
    }
    case "club_group": {
      if (!criterion.clubGroupMode) throw new GameError("INVALID_GRID_CRITERION", 500);
      const groupCondition = {
        big_four: "c.is_big_four = true",
        champion_appearance: "cs.is_champion = true AND pcs.has_appearance = true",
        champion_squad: "cs.is_champion = true",
        istanbul: "c.is_istanbul = true",
        non_istanbul: "c.is_non_istanbul = true",
        two_big_four: "c.is_big_four = true",
      }[criterion.clubGroupMode];

      if (criterion.clubGroupMode === "two_big_four") {
        return `(SELECT COUNT(DISTINCT pcs.club_id)
          FROM player_club_seasons pcs
          JOIN clubs c ON c.id = pcs.club_id
          WHERE pcs.player_id = p.id
            AND ${acceptedRelation}
            AND ${groupCondition}) >= 2`;
      }

      const championJoin = criterion.clubGroupMode?.startsWith("champion")
        ? "JOIN club_seasons cs ON cs.club_id = pcs.club_id AND cs.season_id = pcs.season_id"
        : "";
      return `EXISTS (
        SELECT 1
        FROM player_club_seasons pcs
        JOIN clubs c ON c.id = pcs.club_id
        ${championJoin}
        WHERE pcs.player_id = p.id
          AND ${acceptedRelation}
          AND ${groupCondition}
      )`;
    }
    case "career":
      if (!criterion.careerMode || !criterion.threshold) {
        throw new GameError("INVALID_GRID_CRITERION", 500);
      }
      if (criterion.careerMode === "clubs") {
        return `(SELECT COUNT(DISTINCT pcs.club_id)
          FROM player_club_seasons pcs
          WHERE pcs.player_id = p.id
            AND ${acceptedRelation}) >= ${criterion.threshold}`;
      }
      return `(SELECT COALESCE(SUM(pcs.appearance_count), 0)
        FROM player_club_seasons pcs
        WHERE pcs.player_id = p.id
          AND ${acceptedRelation}) >= ${criterion.threshold}`;
    case "teammate":
      if (!criterion.sourcePlayerId) throw new GameError("INVALID_GRID_CRITERION", 500);
      return `EXISTS (
        SELECT 1
        FROM players star
        JOIN player_club_seasons star_pcs ON star_pcs.player_id = star.id
        JOIN player_club_seasons mate_pcs
          ON mate_pcs.club_id = star_pcs.club_id
          AND mate_pcs.season_id = star_pcs.season_id
          AND mate_pcs.dataset_version_id = star_pcs.dataset_version_id
        WHERE star.source_player_id = ${criterion.sourcePlayerId}
          AND mate_pcs.player_id = p.id
          AND p.id <> star.id
          AND star_pcs.dataset_version_id = dataset.id
          AND star_pcs.is_accepted_for_game = true
          AND star_pcs.review_status = 'approved'
          AND mate_pcs.is_accepted_for_game = true
          AND mate_pcs.review_status = 'approved'
      )`;
  }
}

async function snapshotCriterionPlayerIds(client: PoolClient, criterion: GridCriterion) {
  const result = await client.query<{ player_id: number }>(
    `WITH active_dataset AS (
      SELECT id
      FROM dataset_versions
      WHERE status = 'active'
      ORDER BY source_version DESC
      LIMIT 1
    )
    SELECT p.id AS player_id
    FROM players p
    CROSS JOIN active_dataset dataset
    WHERE
      p.is_active_for_game = true
      AND p.review_status = 'approved'
      AND EXISTS (
        SELECT 1 FROM player_club_seasons scope_pcs
        WHERE scope_pcs.player_id = p.id
          AND scope_pcs.dataset_version_id = dataset.id
          AND scope_pcs.is_accepted_for_game = true
          AND scope_pcs.review_status = 'approved'
      )
      AND ${criterionCondition(criterion)}
    ORDER BY p.id`,
  );

  return result.rows.map((row) => row.player_id);
}

function intersectPlayerIds(first: number[], second: number[]) {
  const secondIds = new Set(second);
  return first.filter((playerId) => secondIds.has(playerId));
}

function hasDistinctPlayerSolution(answers: Map<GridCellKey, number[]>) {
  const cells = [...answers.entries()].sort((left, right) => left[1].length - right[1].length);
  const playerToCell = new Map<number, GridCellKey>();

  function assignPlayer(cellKey: GridCellKey, playerIds: number[], visited: Set<number>): boolean {
    for (const playerId of playerIds) {
      if (visited.has(playerId)) continue;
      visited.add(playerId);
      const occupiedCell = playerToCell.get(playerId);
      if (!occupiedCell) {
        playerToCell.set(playerId, cellKey);
        return true;
      }

      const occupiedAnswers = answers.get(occupiedCell) ?? [];
      if (assignPlayer(occupiedCell, occupiedAnswers, visited)) {
        playerToCell.set(playerId, cellKey);
        return true;
      }
    }
    return false;
  }

  return cells.every(([cellKey, playerIds]) => assignPlayer(cellKey, playerIds, new Set()));
}

async function getRecentCriterionUsage(client: PoolClient, playDate: string) {
  const result = await client.query<{ column_rules: unknown; row_rules: unknown }>(
    `SELECT row_rules, column_rules
     FROM grids
     WHERE status IN ('published', 'archived') AND play_date < $1
     ORDER BY play_date DESC
     LIMIT 7`,
    [playDate],
  );
  const usage = new Map<string, number>();
  result.rows.forEach((grid, index) => {
    const weight = 7 - index;
    const criteria = [
      ...parseGridConfig<PublicCriterion[]>(grid.row_rules, []),
      ...parseGridConfig<PublicCriterion[]>(grid.column_rules, []),
    ];
    for (const criterion of criteria) {
      usage.set(criterion.id, (usage.get(criterion.id) ?? 0) + weight);
    }
  });
  return usage;
}

async function selectDailyGrid(client: PoolClient, playDate: string) {
  const memberships = new Map<string, number[]>();
  for (const criterion of gridCriterionCatalog) {
    memberships.set(criterion.id, await snapshotCriterionPlayerIds(client, criterion));
  }

  const intersectionCache = new Map<string, number[]>();
  const recentUsage = await getRecentCriterionUsage(client, playDate);
  let bestGrid: {
    answers: Map<GridCellKey, number[]>;
    columns: GridCriterion[];
    rows: GridCriterion[];
  } | null = null;
  let bestUsageScore = Number.POSITIVE_INFINITY;
  function answersFor(first: GridCriterion, second: GridCriterion) {
    const cacheKey = [first.id, second.id].sort().join(":");
    const cached = intersectionCache.get(cacheKey);
    if (cached) return cached;
    const answerIds = intersectPlayerIds(
      memberships.get(first.id) ?? [],
      memberships.get(second.id) ?? [],
    );
    intersectionCache.set(cacheKey, answerIds);
    return answerIds;
  }

  function isPlayablePair(first: GridCriterion, second: GridCriterion) {
    const answerCount = answersFor(first, second).length;
    const firstCount = memberships.get(first.id)?.length ?? 0;
    const secondCount = memberships.get(second.id)?.length ?? 0;
    return (
      answerCount >= MINIMUM_ANSWERS_PER_CELL &&
      answerCount < firstCount &&
      answerCount < secondCount
    );
  }

  function selectionWeight(criterion: GridCriterion) {
    if (criterion.kind !== "club") return 1;
    if (criterion.clubTier === 1) return 3.5;
    if (criterion.clubTier === 3) return 0.18;
    return 1;
  }

  function deterministicSelectionScore(criterion: GridCriterion, attempt: number) {
    const hash = createHash("sha256")
      .update(`${playDate}:${attempt}:${criterion.id}`)
      .digest("hex");
    const unitInterval = (Number.parseInt(hash.slice(0, 13), 16) + 1) / 0x10000000000000;
    return -Math.log(unitInterval) / selectionWeight(criterion);
  }

  for (let attempt = 0; attempt < 2_048; attempt += 1) {
    const shuffled = [...gridCriterionCatalog].sort(
      (left, right) =>
        deterministicSelectionScore(left, attempt) - deterministicSelectionScore(right, attempt),
    );
    const columns = shuffled.slice(0, 3);
    const rows = shuffled
      .slice(3)
      .filter((row) => columns.every((column) => isPlayablePair(row, column)))
      .slice(0, 3);
    if (rows.length !== 3) continue;

    const answers = new Map<GridCellKey, number[]>();

    for (const row of rows) {
      for (const column of columns) {
        const cellKey = `${row.id}-${column.id}` as GridCellKey;
        answers.set(cellKey, answersFor(row, column));
      }
    }

    if (!hasDistinctPlayerSolution(answers)) continue;

    const usageScore = [...columns, ...rows].reduce((total, criterion) => {
      return total + (recentUsage.get(criterion.id) ?? 0) / selectionWeight(criterion);
    }, 0);
    if (usageScore < bestUsageScore) {
      bestGrid = { answers, columns, rows };
      bestUsageScore = usageScore;
      if (usageScore === 0) return bestGrid;
    }
  }

  if (bestGrid) return bestGrid;
  throw new GameError("GRID_QUALITY_FAILED", 503);
}

async function findGridForDate(client: PoolClient, playDate: string) {
  const result = await client.query<GridRecord>(
    `SELECT id, play_date::text, slug, row_rules, column_rules
     FROM grids
     WHERE play_date = $1 AND status = 'published'
     LIMIT 1`,
    [playDate],
  );
  return result.rows[0] ?? null;
}

async function ensureDailyGrid(client: PoolClient, playDate: string) {
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`90plus9-grid-${playDate}`]);

  const existing = await findGridForDate(client, playDate);
  if (existing) return existing;

  const dataset = await client.query<{ id: number }>(
    `SELECT id FROM dataset_versions WHERE status = 'active' ORDER BY source_version DESC LIMIT 1`,
  );
  const datasetVersionId = dataset.rows[0]?.id;
  if (!datasetVersionId) throw new GameError("GRID_UNAVAILABLE", 503);

  const slug = `gunun-gridi-${playDate}`;
  const dailyGrid = await selectDailyGrid(client, playDate);
  const gridResult = await client.query<GridRecord>(
    `INSERT INTO grids (
       play_date, slug, dataset_version_id, rule_engine_version,
       difficulty_formula_version, seed, status, row_rules, column_rules,
       created_by, approved_by, approved_at
     ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7::jsonb, $8::jsonb,
       'system', 'system', CURRENT_TIMESTAMP)
     RETURNING id, play_date::text, slug, row_rules, column_rules`,
    [
      playDate,
      slug,
      datasetVersionId,
      RULE_ENGINE_VERSION,
      DIFFICULTY_FORMULA_VERSION,
      playDate,
      JSON.stringify(dailyGrid.rows),
      JSON.stringify(dailyGrid.columns),
    ],
  );
  const grid = gridResult.rows[0];
  if (!grid) throw new GameError("GRID_UNAVAILABLE", 503);

  for (const row of dailyGrid.rows) {
    for (const column of dailyGrid.columns) {
      const cellKey = `${row.id}-${column.id}` as GridCellKey;
      const answerIds = dailyGrid.answers.get(cellKey) ?? [];
      if (answerIds.length < MINIMUM_ANSWERS_PER_CELL) {
        throw new GameError("GRID_QUALITY_FAILED", 503);
      }

      const answerHash = createHash("sha256").update(answerIds.join(",")).digest("hex");
      const cellResult = await client.query<{ id: number }>(
        `INSERT INTO grid_cells (grid_id, cell_key, row_id, column_id, answer_count, answer_hash)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [grid.id, cellKey, row.id, column.id, answerIds.length, answerHash],
      );
      const gridCellId = cellResult.rows[0]?.id;
      if (!gridCellId) throw new GameError("GRID_UNAVAILABLE", 503);
      await client.query(
        `INSERT INTO grid_cell_answers (grid_cell_id, player_id)
         SELECT $1, answer_id FROM unnest($2::integer[]) AS answer_id`,
        [gridCellId, answerIds],
      );
    }
  }

  await client.query(
    `UPDATE grids
     SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [grid.id],
  );
  return grid;
}

async function getOrCreateSession(
  client: PoolClient,
  gridId: number,
  candidateId?: string | null,
  candidateDeviceId?: string | null,
): Promise<{ deviceId: string; session: SessionRecord }> {
  const safeSessionId = normalizeUuid(candidateId);
  const deviceId = normalizeUuid(candidateDeviceId) ?? safeSessionId ?? randomUUID();

  if (safeSessionId) {
    const existing = await client.query<SessionRecord>(
      `UPDATE game_sessions
       SET last_seen_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND grid_id = $2 AND device_id = $3
         AND status IN ('active', 'completed')
       RETURNING id, device_id, status, started_at, completed_at`,
      [safeSessionId, gridId, deviceId],
    );
    if (existing.rows[0]) return { deviceId, session: existing.rows[0] };
  }

  const sessionId = randomUUID();
  const created = await client.query<SessionRecord>(
    `INSERT INTO game_sessions (id, device_id, grid_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (device_id, grid_id) DO UPDATE
     SET last_seen_at = CURRENT_TIMESTAMP
     RETURNING id, device_id, status, started_at, completed_at`,
    [sessionId, deviceId, gridId],
  );
  const session = created.rows[0];
  if (!session) throw new GameError("SESSION_UNAVAILABLE", 503);
  return { deviceId, session };
}

function dateToDayNumber(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return Math.floor(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1) / 86_400_000);
}

function formatRecentDate(playDate: string) {
  const [year, month, day] = playDate.split("-").map(Number);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Istanbul",
  }).format(new Date(Date.UTC(year ?? 0, (month ?? 1) - 1, day ?? 1, 12)));
}

async function buildGameStatistics(client: PoolClient, deviceId: string): Promise<GameStatistics> {
  const result = await client.query<{
    play_date: string;
    status: "active" | "completed" | "expired";
  }>(
    `SELECT g.play_date::text, gs.status
     FROM game_sessions gs
     JOIN grids g ON g.id = gs.grid_id
     WHERE gs.device_id = $1
     ORDER BY g.play_date DESC`,
    [deviceId],
  );

  const completedDates = result.rows
    .filter((row) => row.status === "completed")
    .map((row) => row.play_date.slice(0, 10))
    .sort();

  let bestStreak = 0;
  let runningStreak = 0;
  let previousDay: number | null = null;
  for (const date of completedDates) {
    const day = dateToDayNumber(date);
    runningStreak = previousDay !== null && day === previousDay + 1 ? runningStreak + 1 : 1;
    bestStreak = Math.max(bestStreak, runningStreak);
    previousDay = day;
  }

  let currentStreak = 0;
  if (completedDates.length > 0) {
    const today = dateToDayNumber(getIstanbulDate());
    let expectedDay = dateToDayNumber(completedDates.at(-1) ?? "");
    if (expectedDay === today || expectedDay === today - 1) {
      for (let index = completedDates.length - 1; index >= 0; index -= 1) {
        const day = dateToDayNumber(completedDates[index] ?? "");
        if (day !== expectedDay) break;
        currentStreak += 1;
        expectedDay -= 1;
      }
    }
  }

  return {
    bestStreak,
    completedGrids: completedDates.length,
    currentStreak,
    recentDays: result.rows.slice(0, 7).map((row) => {
      const date = row.play_date.slice(0, 10);
      return {
        completed: row.status === "completed",
        date,
        dateLabel: formatRecentDate(date),
      };
    }),
  };
}

async function listAvailableGrids(client: PoolClient, deviceId: string): Promise<AvailableGrid[]> {
  const result = await client.query<{
    completed: boolean;
    grid_number: number;
    play_date: string;
    slug: string;
  }>(
    `SELECT ranked.play_date::text,
            ranked.slug,
            ranked.grid_number::integer,
            COALESCE(gs.status = 'completed', false) AS completed
     FROM (
       SELECT id, play_date, slug,
              ROW_NUMBER() OVER (ORDER BY play_date)::integer AS grid_number
       FROM grids
       WHERE status IN ('published', 'archived')
     ) ranked
     LEFT JOIN game_sessions gs
       ON gs.grid_id = ranked.id AND gs.device_id = $1
     ORDER BY ranked.play_date DESC`,
    [deviceId],
  );

  return result.rows.map((row) => {
    const date = row.play_date.slice(0, 10);
    return {
      completed: row.completed,
      date,
      dateLabel: formatDateLabel(date),
      number: row.grid_number,
      slug: row.slug,
    };
  });
}

async function buildDailyGame(client: PoolClient, grid: GridRecord, session: SessionRecord) {
  const [cellsResult, filledResult, jokerResult, numberResult, statistics, availableGrids] =
    await Promise.all([
      client.query<{ answer_count: number; cell_key: GridCellKey }>(
        `SELECT cell_key, answer_count FROM grid_cells WHERE grid_id = $1`,
        [grid.id],
      ),
      client.query<{ cell_key: GridCellKey; id: number; joker_used: boolean; name: string }>(
        `SELECT gc.cell_key,
                p.source_player_id AS id,
                p.display_name AS name,
                EXISTS (
                  SELECT 1
                  FROM game_jokers gj
                  WHERE gj.session_id = gsc.session_id
                    AND gj.grid_cell_id = gsc.grid_cell_id
                    AND gsc.player_id = ANY(gj.player_ids)
                ) AS joker_used
       FROM game_session_cells gsc
       JOIN grid_cells gc ON gc.id = gsc.grid_cell_id
       JOIN players p ON p.id = gsc.player_id
       WHERE gsc.session_id = $1 AND gc.grid_id = $2`,
        [session.id, grid.id],
      ),
      client.query<{ cell_key: GridCellKey; id: number; name: string; sort_order: string }>(
        `SELECT gc.cell_key,
              p.source_player_id AS id,
              p.display_name AS name,
              choice.sort_order
       FROM game_jokers gj
       JOIN grid_cells gc ON gc.id = gj.grid_cell_id
       JOIN LATERAL unnest(gj.player_ids) WITH ORDINALITY
         AS choice(player_id, sort_order) ON true
       JOIN players p ON p.id = choice.player_id
       WHERE gj.session_id = $1 AND gc.grid_id = $2
       ORDER BY choice.sort_order`,
        [session.id, grid.id],
      ),
      client.query<{ grid_number: number }>(
        `SELECT COUNT(*)::integer AS grid_number
       FROM grids
       WHERE status IN ('published', 'archived') AND play_date <= $1`,
        [grid.play_date],
      ),
      buildGameStatistics(client, session.device_id),
      listAvailableGrids(client, session.device_id),
    ]);

  const answerCounts: Partial<Record<GridCellKey, number>> = {};
  for (const cell of cellsResult.rows) answerCounts[cell.cell_key] = cell.answer_count;

  const filledCells: FilledCells = {};
  for (const cell of filledResult.rows)
    filledCells[cell.cell_key] = {
      id: cell.id,
      jokerUsed: cell.joker_used,
      name: cell.name,
    };

  const jokerCellKey = jokerResult.rows[0]?.cell_key ?? null;
  const joker: GameJokerState = {
    available: jokerCellKey === null,
    cellKey: jokerCellKey,
    players: jokerResult.rows.map((player) => ({ id: player.id, name: player.name })),
  };

  const playDate =
    typeof grid.play_date === "string"
      ? grid.play_date.slice(0, 10)
      : grid.play_date.toISOString().slice(0, 10);
  const progress = filledResult.rows.length;

  return {
    answerCounts,
    availableGrids,
    columns: parseGridConfig(grid.column_rules, gridColumns).map(({ id, label, mark }) => ({
      id,
      label,
      mark,
    })),
    completedAt: session.completed_at?.toISOString() ?? null,
    filledCells,
    grid: {
      date: playDate,
      dateLabel: formatDateLabel(playDate),
      number: numberResult.rows[0]?.grid_number ?? 1,
      slug: grid.slug,
    },
    joker,
    progress,
    rows: [...parseGridConfig(grid.row_rules, gridRows)],
    sessionStatus: progress === 9 ? "completed" : "active",
    startedAt: session.started_at.toISOString(),
    statistics,
  } satisfies DailyGame;
}

export async function claimDailyJoker(input: { cellKey: unknown; sessionId?: string | null }) {
  if (!isGridCellKey(input.cellKey) || typeof input.sessionId !== "string") {
    throw new GameError("INVALID_REQUEST", 400);
  }

  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sessionResult = await client.query<SessionRecord>(
      `SELECT gs.id, gs.device_id, gs.status, gs.started_at, gs.completed_at
       FROM game_sessions gs
       JOIN grids g ON g.id = gs.grid_id
       WHERE gs.id = $1
         AND gs.status IN ('active', 'completed')
         AND g.status IN ('published', 'archived')
         AND g.play_date <= $2
       FOR UPDATE`,
      [input.sessionId, getIstanbulDate()],
    );
    const session = sessionResult.rows[0];
    if (!session) throw new GameError("SESSION_NOT_FOUND", 401);
    if (session.status === "completed") throw new GameError("GAME_COMPLETED", 409);

    const gridResult = await client.query<GridRecord>(
      `SELECT g.id, g.play_date::text, g.slug, g.row_rules, g.column_rules
       FROM grids g
       JOIN game_sessions gs ON gs.grid_id = g.id
       WHERE gs.id = $1`,
      [session.id],
    );
    const grid = gridResult.rows[0];
    if (!grid) throw new GameError("GRID_UNAVAILABLE", 503);

    const existingJoker = await client.query<{ cell_key: GridCellKey }>(
      `SELECT gc.cell_key
       FROM game_jokers gj
       JOIN grid_cells gc ON gc.id = gj.grid_cell_id
       WHERE gj.session_id = $1`,
      [session.id],
    );
    if (existingJoker.rows[0]) {
      if (existingJoker.rows[0].cell_key !== input.cellKey) {
        throw new GameError("JOKER_ALREADY_USED", 409);
      }
      const game = await buildDailyGame(client, grid, session);
      await client.query("COMMIT");
      return { game };
    }

    const cellResult = await client.query<{ id: number }>(
      `SELECT id FROM grid_cells WHERE grid_id = $1 AND cell_key = $2`,
      [grid.id, input.cellKey],
    );
    const gridCellId = cellResult.rows[0]?.id;
    if (!gridCellId) throw new GameError("INVALID_CELL", 400);

    const candidates = await client.query<{ id: number }>(
      `WITH correct_choice AS (
         SELECT gca.player_id AS id
         FROM grid_cell_answers gca
         WHERE gca.grid_cell_id = $1
           AND NOT EXISTS (
             SELECT 1
             FROM game_session_cells gsc
             WHERE gsc.session_id = $2
               AND gsc.player_id = gca.player_id
               AND gsc.grid_cell_id <> $1
           )
         ORDER BY md5(gca.player_id::text || $2::text || $1::text || 'correct')
         LIMIT 1
       ), familiar_wrong_pool AS (
         SELECT p.id, SUM(pcs.evidence_count)::integer AS career_evidence
         FROM players p
         JOIN player_club_seasons pcs ON pcs.player_id = p.id
         WHERE p.is_active_for_game = true
           AND p.review_status = 'approved'
           AND pcs.is_accepted_for_game = true
           AND pcs.review_status = 'approved'
           AND NOT EXISTS (
             SELECT 1
             FROM grid_cell_answers gca
             WHERE gca.grid_cell_id = $1 AND gca.player_id = p.id
           )
           AND NOT EXISTS (
             SELECT 1
             FROM game_session_cells gsc
             WHERE gsc.session_id = $2 AND gsc.player_id = p.id
           )
         GROUP BY p.id
         ORDER BY career_evidence DESC, p.id
         LIMIT 120
       ), wrong_choices AS (
         SELECT id
         FROM familiar_wrong_pool
         ORDER BY md5(id::text || $2::text || $1::text || 'wrong')
         LIMIT 5
       ), all_choices AS (
         SELECT id FROM correct_choice
         UNION ALL
         SELECT id FROM wrong_choices
       )
       SELECT id
       FROM all_choices
       ORDER BY md5(id::text || $2::text || $1::text || 'shuffle')`,
      [gridCellId, session.id],
    );
    if (candidates.rows.length !== 6) throw new GameError("JOKER_UNAVAILABLE", 409);

    await client.query(
      `INSERT INTO game_jokers (session_id, grid_cell_id, player_ids)
       VALUES ($1, $2, $3::integer[])`,
      [session.id, gridCellId, candidates.rows.map((candidate) => candidate.id)],
    );

    const game = await buildDailyGame(client, grid, session);
    await client.query("COMMIT");
    return { game };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function loadDailyGame(
  candidateSessionId?: string | null,
  candidateDeviceId?: string | null,
  requestedDate?: string | null,
) {
  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const today = getIstanbulDate();
    for (const archiveDate of ARCHIVE_GRID_DATES) {
      if (archiveDate <= today) await ensureDailyGrid(client, archiveDate);
    }
    const playDate =
      requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) ? requestedDate : today;
    if (playDate > today) throw new GameError("GRID_NOT_FOUND", 404);
    const grid =
      playDate === today
        ? await ensureDailyGrid(client, playDate)
        : await findGridForDate(client, playDate);
    if (!grid) throw new GameError("GRID_NOT_FOUND", 404);
    const { deviceId, session } = await getOrCreateSession(
      client,
      grid.id,
      candidateSessionId,
      candidateDeviceId,
    );
    const game = await buildDailyGame(client, grid, session);
    await client.query("COMMIT");
    return { deviceId, game, sessionId: session.id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function submitGuess(input: {
  cellKey: unknown;
  playerId: unknown;
  requestId: unknown;
  sessionId?: string | null;
}) {
  if (
    !isGridCellKey(input.cellKey) ||
    !Number.isSafeInteger(input.playerId) ||
    Number(input.playerId) <= 0 ||
    typeof input.requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.requestId,
    ) ||
    typeof input.sessionId !== "string"
  ) {
    throw new GameError("INVALID_REQUEST", 400);
  }

  const pool = getDatabasePool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sessionResult = await client.query<SessionRecord>(
      `SELECT gs.id, gs.device_id, gs.status, gs.started_at, gs.completed_at
       FROM game_sessions gs
       JOIN grids g ON g.id = gs.grid_id
       WHERE gs.id = $1
         AND gs.status IN ('active', 'completed')
         AND g.status IN ('published', 'archived')
         AND g.play_date <= $2
       FOR UPDATE`,
      [input.sessionId, getIstanbulDate()],
    );
    const session = sessionResult.rows[0];
    if (!session) throw new GameError("SESSION_NOT_FOUND", 401);

    const gridResult = await client.query<GridRecord>(
      `SELECT g.id, g.play_date::text, g.slug, g.row_rules, g.column_rules
       FROM grids g
       JOIN game_sessions gs ON gs.grid_id = g.id
       WHERE gs.id = $1`,
      [session.id],
    );
    const grid = gridResult.rows[0];
    if (!grid) throw new GameError("GRID_UNAVAILABLE", 503);

    const previousGuess = await client.query<{
      id: number;
      is_correct: boolean;
      name: string;
    }>(
      `SELECT gg.is_correct, p.source_player_id AS id, p.display_name AS name
       FROM game_guesses gg
       JOIN players p ON p.id = gg.player_id
       WHERE gg.session_id = $1 AND gg.request_id = $2`,
      [session.id, input.requestId],
    );
    const existingGuess = previousGuess.rows[0];
    if (existingGuess) {
      const game = await buildDailyGame(client, grid, session);
      await client.query("COMMIT");
      return {
        correct: existingGuess.is_correct,
        game,
        player: existingGuess.is_correct
          ? { id: existingGuess.id, name: existingGuess.name }
          : null,
      };
    }

    if (session.status === "completed") {
      throw new GameError("GAME_COMPLETED", 409);
    }

    const cellResult = await client.query<{ id: number }>(
      `SELECT id FROM grid_cells WHERE grid_id = $1 AND cell_key = $2`,
      [grid.id, input.cellKey],
    );
    const gridCellId = cellResult.rows[0]?.id;
    if (!gridCellId) throw new GameError("INVALID_CELL", 400);

    const playerResult = await client.query<{ id: number; name: string }>(
      `SELECT id, display_name AS name FROM players WHERE source_player_id = $1 LIMIT 1`,
      [Number(input.playerId)],
    );
    const player = playerResult.rows[0];
    if (!player) throw new GameError("PLAYER_NOT_FOUND", 404);

    const accepted = await client.query<{ accepted: boolean }>(
      `SELECT EXISTS (
         SELECT 1 FROM grid_cell_answers WHERE grid_cell_id = $1 AND player_id = $2
       ) AS accepted`,
      [gridCellId, player.id],
    );
    const correct = accepted.rows[0]?.accepted === true;

    if (correct) {
      const duplicate = await client.query<{ cell_key: GridCellKey }>(
        `SELECT gc.cell_key
         FROM game_session_cells gsc
         JOIN grid_cells gc ON gc.id = gsc.grid_cell_id
         WHERE gsc.session_id = $1 AND gsc.player_id = $2 AND gsc.grid_cell_id <> $3
         LIMIT 1`,
        [session.id, player.id, gridCellId],
      );
      if (duplicate.rows[0]) throw new GameError("PLAYER_ALREADY_USED", 409);

      await client.query(
        `INSERT INTO game_session_cells (session_id, grid_cell_id, player_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (session_id, grid_cell_id) DO UPDATE
         SET player_id = EXCLUDED.player_id, updated_at = CURRENT_TIMESTAMP`,
        [session.id, gridCellId, player.id],
      );
    }

    await client.query(
      `INSERT INTO game_guesses (request_id, session_id, grid_cell_id, player_id, is_correct)
       VALUES ($1, $2, $3, $4, $5)`,
      [input.requestId, session.id, gridCellId, player.id, correct],
    );

    const progressResult = await client.query<{ progress: number }>(
      `SELECT COUNT(*)::integer AS progress FROM game_session_cells WHERE session_id = $1`,
      [session.id],
    );
    const complete = progressResult.rows[0]?.progress === 9;
    const updatedSession = await client.query<SessionRecord>(
      `UPDATE game_sessions
       SET status = $2::game_session_status,
           completed_at = CASE
             WHEN $2 = 'completed' THEN COALESCE(completed_at, CURRENT_TIMESTAMP)
             ELSE NULL
           END,
           last_seen_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, device_id, status, started_at, completed_at`,
      [session.id, complete ? "completed" : "active"],
    );

    const currentSession = updatedSession.rows[0];
    if (!currentSession) throw new GameError("SESSION_UNAVAILABLE", 503);
    const game = await buildDailyGame(client, grid, currentSession);
    await client.query("COMMIT");
    return {
      correct,
      game,
      player: correct ? { id: Number(input.playerId), name: player.name } : null,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
