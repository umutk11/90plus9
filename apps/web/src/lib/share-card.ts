type ShareColumn = { label: string; mark: string };
type ShareRow = { label: string; mark: string };

type ShareCardInput = {
  columns: ShareColumn[];
  dateLabel: string;
  gridNumber: number;
  jokerCells: boolean[][];
  playerNames: string[][];
  rows: ShareRow[];
};

const CARD_SIZE = 1080;
const PAPER = "#f4f0e6";
const INK = "#111512";
const ORANGE = "#ff6a1a";

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function drawCenteredLines(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const visibleLines = lines.slice(0, 2);
  const firstLineY = y - ((visibleLines.length - 1) * lineHeight) / 2;
  visibleLines.forEach((line, index) => context.fillText(line, x, firstLineY + index * lineHeight));
}

export function buildShareText(gridNumber: number, jokerCells: boolean[][]) {
  const number = String(gridNumber).padStart(3, "0");
  const squares = Array.from({ length: 3 }, (_, rowIndex) =>
    Array.from({ length: 3 }, (_, columnIndex) =>
      jokerCells[rowIndex]?.[columnIndex] ? "⬛" : "🟧",
    ).join(""),
  ).join("\n");
  return `90+9 · Günün Gridi #${number}\n9/9\n${squares}`;
}

export function getShareFileName(gridNumber: number) {
  return `90plus9-grid-${String(gridNumber).padStart(3, "0")}.png`;
}

export async function createGridShareCard({
  columns,
  dateLabel,
  gridNumber,
  jokerCells,
  playerNames,
  rows,
}: ShareCardInput): Promise<Blob> {
  if (
    columns.length !== 3 ||
    rows.length !== 3 ||
    jokerCells.length !== 3 ||
    jokerCells.some((row) => row.length !== 3) ||
    playerNames.length !== 3 ||
    playerNames.some((row) => row.length !== 3)
  ) {
    throw new Error("Paylaşım kartı için 3×3 grid gerekli.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = CARD_SIZE;
  canvas.height = CARD_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Paylaşım görseli oluşturulamadı.");

  context.fillStyle = PAPER;
  context.fillRect(0, 0, CARD_SIZE, CARD_SIZE);

  context.fillStyle = INK;
  context.font = '900 88px "Arial Black", Arial, sans-serif';
  context.textAlign = "left";
  context.textBaseline = "middle";
  context.fillText("90", 92, 104);
  const firstWidth = context.measureText("90").width;
  context.fillStyle = ORANGE;
  context.fillText("+", 92 + firstWidth + 4, 104);
  const plusWidth = context.measureText("+").width;
  context.fillStyle = INK;
  context.fillText("9", 92 + firstWidth + plusWidth + 8, 104);

  context.textAlign = "right";
  context.font = '900 70px "Arial Black", Arial, sans-serif';
  context.fillText("9", 922, 100);
  context.fillStyle = "#777d76";
  context.font = "800 28px Arial, sans-serif";
  context.fillText("/9", 984, 112);

  context.fillStyle = "#626861";
  context.font = "800 22px Arial, sans-serif";
  context.textAlign = "left";
  context.fillText(`${dateLabel} · GRID #${String(gridNumber).padStart(3, "0")}`, 95, 182);

  const gridX = 170;
  const gridY = 236;
  const gridSize = 740;
  const gap = 12;
  const cellSize = (gridSize - gap * 3) / 4;

  for (let rowIndex = 0; rowIndex < 4; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < 4; columnIndex += 1) {
      const x = gridX + columnIndex * (cellSize + gap);
      const y = gridY + rowIndex * (cellSize + gap);
      const isCorner = rowIndex === 0 && columnIndex === 0;
      const isHeader = rowIndex === 0 || columnIndex === 0;
      const isJokerCell =
        rowIndex > 0 && columnIndex > 0
          ? (jokerCells[rowIndex - 1]?.[columnIndex - 1] ?? false)
          : false;

      roundedRect(context, x, y, cellSize, cellSize, isCorner ? 28 : 18);
      context.fillStyle = isHeader || isJokerCell ? INK : ORANGE;
      context.fill();

      context.textAlign = "center";
      context.textBaseline = "middle";
      if (isCorner) {
        context.fillStyle = ORANGE;
        context.font = '900 34px "Arial Black", Arial, sans-serif';
        context.fillText("90+9", x + cellSize / 2, y + cellSize / 2);
      } else if (rowIndex === 0) {
        const column = columns[columnIndex - 1];
        if (!column) continue;
        context.fillStyle = ORANGE;
        context.font = '900 33px "Arial Black", Arial, sans-serif';
        context.fillText(column.mark, x + cellSize / 2, y + 66);
        context.fillStyle = "#ffffff";
        context.font = "800 20px Arial, sans-serif";
        drawCenteredLines(context, column.label, x + cellSize / 2, y + 126, cellSize - 24, 23);
      } else if (columnIndex === 0) {
        const row = rows[rowIndex - 1];
        if (!row) continue;
        context.fillStyle = ORANGE;
        context.font = '900 33px "Arial Black", Arial, sans-serif';
        context.fillText(row.mark, x + cellSize / 2, y + 66);
        context.fillStyle = "#ffffff";
        context.font = "800 19px Arial, sans-serif";
        drawCenteredLines(context, row.label, x + cellSize / 2, y + 127, cellSize - 22, 22);
      } else {
        roundedRect(context, x + 20, y + 20, cellSize - 40, cellSize - 40, 14);
        context.strokeStyle = isJokerCell ? "rgba(255, 106, 26, 0.75)" : "rgba(17, 21, 18, 0.2)";
        context.lineWidth = 3;
        context.stroke();

        const playerName = playerNames[rowIndex - 1]?.[columnIndex - 1] ?? "";
        context.fillStyle = isJokerCell ? ORANGE : INK;
        context.font = '900 22px "Arial Black", Arial, sans-serif';
        drawCenteredLines(
          context,
          playerName,
          x + cellSize / 2,
          y + cellSize / 2,
          cellSize - 34,
          27,
        );
      }
    }
  }

  context.fillStyle = INK;
  context.font = '900 28px "Arial Black", Arial, sans-serif';
  context.textAlign = "center";
  context.fillText("TÜRKİYE SÜPER LİG GÜNLÜK FUTBOL GRİDİ", CARD_SIZE / 2, 1034);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Paylaşım görseli oluşturulamadı."));
    }, "image/png");
  });
}
