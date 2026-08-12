export const gridColumns = [
  { id: "galatasaray", label: "Galatasaray", mark: "GS", sourceClubId: 141 },
  { id: "fenerbahce", label: "Fenerbahçe", mark: "FB", sourceClubId: 36 },
  { id: "trabzonspor", label: "Trabzonspor", mark: "TS", sourceClubId: 449 },
] as const;

export const gridRows = [
  { id: "champion", label: "Şampiyon takım kadrosu", mark: "Ş" },
  { id: "midfielder", label: "Orta saha", mark: "OS" },
  { id: "foreign", label: "Yabancı oyuncu", mark: "Y" },
] as const;

export type GridColumnId = (typeof gridColumns)[number]["id"];
export type GridRowId = (typeof gridRows)[number]["id"];
export type GridCellKey = `${GridRowId}-${GridColumnId}`;

export const gridCellKeys = gridRows.flatMap((row) =>
  gridColumns.map((column) => `${row.id}-${column.id}` as GridCellKey),
);

const gridCellKeySet = new Set<string>(gridCellKeys);

export function isGridCellKey(value: unknown): value is GridCellKey {
  return typeof value === "string" && gridCellKeySet.has(value);
}

export function getGridCellDefinition(cellKey: GridCellKey) {
  const [rowId, columnId] = cellKey.split("-") as [GridRowId, GridColumnId];
  const row = gridRows.find((item) => item.id === rowId);
  const column = gridColumns.find((item) => item.id === columnId);

  if (!row || !column) {
    throw new Error(`Bilinmeyen grid hücresi: ${cellKey}`);
  }

  return { column, row };
}
