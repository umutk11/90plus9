"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GridCellKey } from "@/lib/grid-config";
import { buildShareText, createGridShareCard, getShareFileName } from "@/lib/share-card";

type Player = { id: number; jokerUsed?: boolean; name: string };
type GridColumn = { id: string; label: string; mark: string };
type GridRow = { id: string; label: string; mark: string };
type FilledCells = Partial<Record<GridCellKey, Player>>;
type AnswerCounts = Partial<Record<GridCellKey, number>>;
type SearchStatus = "idle" | "loading" | "ready" | "error";
type ShareStatus = "idle" | "ready" | "error";
type GameStatistics = {
  bestStreak: number;
  completedGrids: number;
  currentStreak: number;
  recentDays: Array<{ completed: boolean; date: string; dateLabel: string }>;
};
type AvailableGrid = {
  completed: boolean;
  date: string;
  dateLabel: string;
  number: number;
  slug: string;
};
type JokerState = {
  available: boolean;
  cellKey: GridCellKey | null;
  players: Player[];
};
type GameState = {
  answerCounts: AnswerCounts;
  availableGrids: AvailableGrid[];
  columns: GridColumn[];
  completedAt: string | null;
  filledCells: FilledCells;
  grid: { date: string; dateLabel: string; number: number; slug: string };
  joker: JokerState;
  progress: number;
  rows: GridRow[];
  sessionStatus: "active" | "completed";
  startedAt: string;
  statistics: GameStatistics;
};

function buildSharePageUrl(slug: string) {
  const pageUrl = new URL(window.location.href);
  pageUrl.hash = "";
  pageUrl.search = "";
  pageUrl.searchParams.set("grid", slug);
  return pageUrl.toString();
}

export default function Home() {
  const [filledCells, setFilledCells] = useState<FilledCells>({});
  const [columns, setColumns] = useState<GridColumn[]>([]);
  const [rows, setRows] = useState<GridRow[]>([]);
  const [gridMeta, setGridMeta] = useState<GameState["grid"] | null>(null);
  const [isGameLoading, setIsGameLoading] = useState(true);
  const [gameLoadError, setGameLoadError] = useState(false);
  const [selectedCell, setSelectedCell] = useState<GridCellKey | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [answerCounts, setAnswerCounts] = useState<AnswerCounts>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "error" | "success"; text: string } | null>(
    null,
  );
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [statistics, setStatistics] = useState<GameStatistics>({
    bestStreak: 0,
    completedGrids: 0,
    currentStreak: 0,
    recentDays: [],
  });
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [sharePageUrl, setSharePageUrl] = useState("");
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const [shareFeedback, setShareFeedback] = useState("");
  const [availableGrids, setAvailableGrids] = useState<AvailableGrid[]>([]);
  const [joker, setJoker] = useState<JokerState>({
    available: true,
    cellKey: null,
    players: [],
  });
  const [isUsingJoker, setIsUsingJoker] = useState(false);
  const dateMenuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = Object.keys(filledCells).length;
  const isComplete = progress === 9;
  const jokerCells = useMemo(
    () =>
      rows.map((row) =>
        columns.map(
          (column) => filledCells[`${row.id}-${column.id}` as GridCellKey]?.jokerUsed === true,
        ),
      ),
    [columns, filledCells, rows],
  );
  const shareText = gridMeta ? buildShareText(gridMeta.number, jokerCells) : "";
  const usedPlayerIds = useMemo(
    () =>
      new Set(
        Object.values(filledCells)
          .filter((player): player is Player => Boolean(player))
          .map((player) => player.id),
      ),
    [filledCells],
  );
  const selectedCriteria = useMemo(() => {
    if (!selectedCell) return null;
    const [rowId, columnId] = selectedCell.split("-");
    return {
      column: columns.find((column) => column.id === columnId),
      row: rows.find((row) => row.id === rowId),
    };
  }, [columns, rows, selectedCell]);
  const selectedAnswerCount = selectedCell ? answerCounts[selectedCell] : undefined;
  const selectedJokerPlayers = selectedCell && joker.cellKey === selectedCell ? joker.players : [];

  const applyGame = useCallback((game: GameState) => {
    setAnswerCounts(game.answerCounts);
    setAvailableGrids(game.availableGrids);
    setColumns(game.columns);
    setFilledCells(game.filledCells);
    setGridMeta(game.grid);
    setJoker(game.joker);
    setRows(game.rows);
    setStatistics(game.statistics);
    setSharePageUrl(buildSharePageUrl(game.grid.slug));
    setShowResults(game.sessionStatus === "completed");
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestedSlug = new URLSearchParams(window.location.search).get("grid");
    const requestedDate = requestedSlug?.match(/^gunun-gridi-(\d{4}-\d{2}-\d{2})$/)?.[1];
    const gameUrl = requestedDate
      ? `/api/v1/game?date=${encodeURIComponent(requestedDate)}`
      : "/api/v1/game";

    fetch(gameUrl, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Grid yüklenemedi.");
        return response.json() as Promise<{ game: GameState }>;
      })
      .then(({ game }) => {
        applyGame(game);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setGameLoadError(true);
          setFeedback({ tone: "error", text: "Grid bilgileri şu anda yüklenemiyor." });
        }
      })
      .finally(() => setIsGameLoading(false));

    return () => controller.abort();
  }, [applyGame]);

  useEffect(() => {
    function closeDateMenu(event: MouseEvent) {
      if (!dateMenuRef.current?.contains(event.target as Node)) setShowDateMenu(false);
    }

    document.addEventListener("mousedown", closeDateMenu);
    return () => document.removeEventListener("mousedown", closeDateMenu);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setSearchStatus("loading");
      fetch(`/api/v1/players/search?q=${encodeURIComponent(trimmedQuery)}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Arama başarısız.");
          return response.json() as Promise<{ players: Player[] }>;
        })
        .then((data) => {
          setResults(data.players);
          setActiveResultIndex(0);
          setSearchStatus("ready");
        })
        .catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) {
            setResults([]);
            setSearchStatus("error");
          }
        });
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    if (!selectedCell) return;
    const cellKey = selectedCell;
    inputRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedCell(null);
        setFeedback(null);
        window.requestAnimationFrame(() => document.getElementById(`cell-${cellKey}`)?.focus());
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedCell]);

  useEffect(() => {
    if (!isComplete || !gridMeta || columns.length !== 3 || rows.length !== 3) return;

    let active = true;
    let objectUrl: string | null = null;

    void createGridShareCard({
      columns,
      dateLabel: gridMeta.dateLabel,
      gridNumber: gridMeta.number,
      jokerCells,
      playerNames: rows.map((row) =>
        columns.map((column) => filledCells[`${row.id}-${column.id}` as GridCellKey]?.name ?? ""),
      ),
      rows,
    })
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setShareImageBlob(blob);
        setShareImageUrl(objectUrl);
        setShareStatus("ready");
      })
      .catch(() => {
        if (active) setShareStatus("error");
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [columns, filledCells, gridMeta, isComplete, jokerCells, rows]);

  function openPlayerSearch(cellKey: GridCellKey) {
    if (isComplete) return;
    setSelectedCell(cellKey);
    setQuery("");
    setFeedback(null);
    setActiveResultIndex(0);
    setResults([]);
    setSearchStatus("idle");
  }

  async function selectGrid(grid: AvailableGrid) {
    if (grid.slug === gridMeta?.slug) {
      setShowDateMenu(false);
      return;
    }

    setShowDateMenu(false);
    setIsGameLoading(true);
    setGameLoadError(false);
    setShowResults(false);
    setSelectedCell(null);
    setFeedback(null);
    try {
      const response = await fetch(`/api/v1/game?date=${encodeURIComponent(grid.date)}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Grid yüklenemedi.");
      const data = (await response.json()) as { game: GameState };
      applyGame(data.game);
      const pageUrl = new URL(window.location.href);
      pageUrl.search = "";
      pageUrl.searchParams.set("grid", data.game.grid.slug);
      window.history.replaceState({}, "", pageUrl);
    } catch {
      setGameLoadError(true);
      setFeedback({ tone: "error", text: "Seçilen grid şu anda yüklenemiyor." });
    } finally {
      setIsGameLoading(false);
    }
  }

  function closePlayerSearch() {
    const cellKey = selectedCell;
    setSelectedCell(null);
    setFeedback(null);
    if (cellKey) {
      window.requestAnimationFrame(() => document.getElementById(`cell-${cellKey}`)?.focus());
    }
  }

  async function choosePlayer(player: Player) {
    if (!selectedCell) return;
    const currentPlayer = filledCells[selectedCell];
    if (usedPlayerIds.has(player.id) && currentPlayer?.id !== player.id) {
      setFeedback({ tone: "error", text: "Bu oyuncuyu gridde zaten kullandın." });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/guesses", {
        body: JSON.stringify({
          cellKey: selectedCell,
          playerId: player.id,
          requestId: window.crypto.randomUUID(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as {
        code?: string;
        correct?: boolean;
        game?: GameState;
        player?: Player | null;
      };
      if (!response.ok) {
        if (result.code === "PLAYER_ALREADY_USED") {
          setFeedback({ tone: "error", text: "Bu oyuncuyu gridde zaten kullandın." });
          return;
        }
        if (result.code === "GAME_COMPLETED") {
          closePlayerSearch();
          setShowResults(true);
          return;
        }
        throw new Error("Tahmin kontrol edilemedi.");
      }

      if (!result.correct || !result.player) {
        setFeedback({
          tone: "error",
          text: "Bu oyuncu iki kriteri birlikte karşılamıyor. Başka bir isim deneyebilirsin.",
        });
        return;
      }

      if (result.game) {
        applyGame(result.game);
      }
      setFeedback({ tone: "success", text: `${result.player.name} doğru cevap!` });
      window.setTimeout(() => closePlayerSearch(), 450);
    } catch {
      setFeedback({
        tone: "error",
        text: "Tahmin şu anda kontrol edilemiyor. Tekrar deneyebilirsin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function revealJokerPlayers() {
    if (!selectedCell || !joker.available || isUsingJoker) return;
    setIsUsingJoker(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/v1/joker", {
        body: JSON.stringify({ cellKey: selectedCell }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { code?: string; game?: GameState };
      if (!response.ok || !result.game) {
        if (result.code === "GAME_COMPLETED") {
          closePlayerSearch();
          setShowResults(true);
          return;
        }
        if (result.code === "JOKER_ALREADY_USED") {
          setFeedback({ tone: "error", text: "Bu griddeki joker hakkını zaten kullandın." });
          return;
        }
        if (result.code === "JOKER_UNAVAILABLE") {
          setFeedback({ tone: "error", text: "Bu hücre için joker şu anda kullanılamıyor." });
          return;
        }
        throw new Error("Joker kullanılamadı.");
      }

      applyGame(result.game);
      setFeedback({ tone: "success", text: "Joker kullanıldı. Altı oyuncudan birini seç." });
    } catch {
      setFeedback({ tone: "error", text: "Joker şu anda açılamıyor. Tekrar deneyebilirsin." });
    } finally {
      setIsUsingJoker(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const player = results[activeResultIndex];
    if (player) void choosePlayer(player);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveResultIndex((current) => Math.min(current + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveResultIndex((current) => Math.max(current - 1, 0));
    }
  }

  async function copyText(value: string) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.append(textArea);
    textArea.select();
    document.execCommand("copy");
    textArea.remove();
  }

  async function shareResult() {
    if (!gridMeta || !sharePageUrl) return;
    const text = `${shareText}\n${sharePageUrl}`;
    setShareFeedback("");

    try {
      if (navigator.share) {
        if (shareImageBlob) {
          const file = new File([shareImageBlob], getShareFileName(gridMeta.number), {
            type: "image/png",
          });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              files: [file],
              text: `${shareText}\n${sharePageUrl}`,
              title: "90+9 Günün Gridi",
            });
            setShareFeedback("Paylaşım hazırlandı.");
            return;
          }
        }

        await navigator.share({ text: shareText, title: "90+9 Günün Gridi", url: sharePageUrl });
        setShareFeedback("Paylaşım hazırlandı.");
        return;
      }

      await copyText(text);
      setShareFeedback("Sonuç ve bağlantı panoya kopyalandı.");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setShareFeedback("Paylaşım açılamadı. Bağlantıyı kopyalayabilirsin.");
      }
    }
  }

  function downloadShareImage() {
    if (!shareImageUrl || !gridMeta) return;
    const link = document.createElement("a");
    link.href = shareImageUrl;
    link.download = getShareFileName(gridMeta.number);
    link.click();
    setShareFeedback("PNG görseli indirildi.");
  }

  async function copyShareLink() {
    if (!sharePageUrl) return;
    try {
      await copyText(`${shareText}\n${sharePageUrl}`);
      setShareFeedback("Sonuç ve bağlantı panoya kopyalandı.");
    } catch {
      setShareFeedback("Bağlantı kopyalanamadı.");
    }
  }

  const xShareUrl = sharePageUrl
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(sharePageUrl)}`
    : "#";
  const whatsappShareUrl = sharePageUrl
    ? `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${sharePageUrl}`)}`
    : "#";

  return (
    <main className="site-shell">
      <div className="ambient-mark ambient-mark-one" aria-hidden="true" />
      <div className="ambient-mark ambient-mark-two" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#oyun" aria-label="90+9 ana sayfa">
          <span className="brand-90">90</span>
          <span className="brand-plus">+</span>
          <span>9</span>
        </a>
        <nav className="top-actions" aria-label="Ana menü">
          <button className="text-button" type="button" onClick={() => setShowHelp(true)}>
            Nasıl oynanır?
          </button>
          <div className="date-picker" ref={dateMenuRef}>
            <button
              className="date-picker-trigger"
              type="button"
              aria-expanded={showDateMenu}
              aria-haspopup="menu"
              onClick={() => setShowDateMenu((current) => !current)}
            >
              <span>{gridMeta?.dateLabel ?? "TARİH"}</span>
              <i aria-hidden="true">⌄</i>
            </button>
            {showDateMenu && (
              <div className="date-picker-menu" role="menu" aria-label="Günlük gridler">
                {availableGrids.map((grid, index) => (
                  <button
                    className={grid.slug === gridMeta?.slug ? "is-current" : ""}
                    key={grid.slug}
                    onClick={() => void selectGrid(grid)}
                    role="menuitem"
                    type="button"
                  >
                    <span>
                      {grid.dateLabel}
                      {index === 0 && <small>Güncel</small>}
                    </span>
                    <i aria-hidden="true">
                      {grid.completed ? "✓" : `#${String(grid.number).padStart(3, "0")}`}
                    </i>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            className="icon-button"
            type="button"
            aria-label="İstatistikleri aç"
            title="İstatistikler"
            onClick={() => setShowStatistics(true)}
          >
            <span aria-hidden="true">▥</span>
          </button>
        </nav>
      </header>

      <section className="game-stage">
        <div className="game-layout" id="oyun">
          <article className="game-card" aria-label="Günün 3 çarpı 3 futbol gridi">
            <div className="game-card-header">
              <div>
                <p className="game-kicker">
                  {gridMeta
                    ? `${gridMeta.dateLabel} · GRID #${String(gridMeta.number).padStart(3, "0")}`
                    : "GÜNÜN GRİDİ YÜKLENİYOR"}
                </p>
                <h2>Günün Gridi</h2>
              </div>
              <div className="progress-block" aria-label={`${progress} hücre tamamlandı, toplam 9`}>
                <span>
                  {progress}
                  <small>/9</small>
                </span>
                <div className="progress-track" aria-hidden="true">
                  <i style={{ width: `${(progress / 9) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="grid-wrap">
              {isGameLoading ? (
                <div className="grid-loading" role="status">
                  Günün gridi hazırlanıyor…
                </div>
              ) : gameLoadError ? (
                <div className="grid-loading is-error" role="alert">
                  Günün gridi şu anda kullanılamıyor. Biraz sonra tekrar deneyebilirsin.
                </div>
              ) : (
                <div className="football-grid">
                  <div className="grid-corner" aria-hidden="true">
                    <span>90+9</span>
                  </div>
                  {columns.map((column) => (
                    <div className="column-header" key={column.id}>
                      <span className={`criterion-mark mark-${column.id}`} aria-hidden="true">
                        {column.mark}
                      </span>
                      <strong>{column.label}</strong>
                    </div>
                  ))}

                  {rows.map((row) => (
                    <div className="grid-row" key={row.id}>
                      <div className="row-header">
                        <span className="row-mark" aria-hidden="true">
                          {row.mark}
                        </span>
                        <strong>{row.label}</strong>
                      </div>
                      {columns.map((column) => {
                        const cellKey = `${row.id}-${column.id}` as GridCellKey;
                        const player = filledCells[cellKey];
                        return (
                          <button
                            aria-label={`${row.label} ve ${column.label}${player ? `: ${player.name}${player.jokerUsed ? ", jokerle bulundu" : ""}` : ", boş hücre"}${isComplete ? ", oyun tamamlandı" : ""}`}
                            className={`grid-cell ${player ? "is-filled" : ""} ${player?.jokerUsed ? "is-joker" : ""}`}
                            disabled={isComplete}
                            id={`cell-${cellKey}`}
                            key={cellKey}
                            onClick={() => openPlayerSearch(cellKey)}
                            type="button"
                          >
                            {player ? (
                              <strong>{player.name}</strong>
                            ) : (
                              <>
                                <span className="cell-plus" aria-hidden="true">
                                  +
                                </span>
                                <small>Oyuncu seç</small>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </section>

      {selectedCell && selectedCriteria?.row && selectedCriteria.column && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && closePlayerSearch()}
        >
          <section
            className="search-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={closePlayerSearch}
              aria-label="Oyuncu aramayı kapat"
            >
              ×
            </button>
            <p className="modal-kicker">BU HÜCRE İÇİN</p>
            <h2 id="search-title">Oyuncu bul</h2>
            <div className="criteria-pair">
              <span>{selectedCriteria.row.mark}</span>
              <strong>{selectedCriteria.row.label}</strong>
              <i aria-hidden="true">+</i>
              <span>{selectedCriteria.column.mark}</span>
              <strong>{selectedCriteria.column.label}</strong>
            </div>
            {selectedJokerPlayers.length === 6 ? (
              <div className="joker-panel" aria-label="Joker oyuncu seçenekleri">
                <div className="joker-panel-title">
                  <strong>Joker seçenekleri</strong>
                  <span>1 doğru · 5 yanlış</span>
                </div>
                <div className="joker-players">
                  {selectedJokerPlayers.map((player) => (
                    <button
                      disabled={isSubmitting}
                      key={player.id}
                      onClick={() => void choosePlayer(player)}
                      type="button"
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : joker.available ? (
              <button
                className="joker-button"
                disabled={isUsingJoker}
                onClick={() => void revealJokerPlayers()}
                type="button"
              >
                <span aria-hidden="true">★</span>
                {isUsingJoker ? "Joker hazırlanıyor…" : "Joker: 6 oyuncu göster"}
                <small>1 hak</small>
              </button>
            ) : null}
            <form onSubmit={handleSubmit}>
              <label htmlFor="player-search">Oyuncu adı</label>
              <div className="search-field">
                <span aria-hidden="true">⌕</span>
                <input
                  aria-activedescendant={
                    results[activeResultIndex]
                      ? `result-${results[activeResultIndex].id}`
                      : undefined
                  }
                  aria-controls="player-results"
                  aria-expanded={results.length > 0}
                  autoComplete="off"
                  id="player-search"
                  onChange={(event) => {
                    const nextQuery = event.target.value;
                    setQuery(nextQuery);
                    setFeedback(null);
                    setActiveResultIndex(0);
                    if (nextQuery.trim().length < 2) {
                      setResults([]);
                      setSearchStatus("idle");
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={
                    selectedAnswerCount === undefined
                      ? "Geçerli oyunculardan birini ara"
                      : `${selectedAnswerCount} geçerli oyuncudan birini ara`
                  }
                  ref={inputRef}
                  role="combobox"
                  value={query}
                />
              </div>
            </form>

            <div
              className="search-results"
              id="player-results"
              role="listbox"
              aria-label="Oyuncu sonuçları"
            >
              {query.trim().length < 2 ? (
                <p className="search-helper">Aramak için en az 2 harf yaz.</p>
              ) : searchStatus === "loading" ? (
                <p className="search-helper">Oyuncular aranıyor…</p>
              ) : searchStatus === "error" ? (
                <p className="search-helper">Arama şu anda kullanılamıyor.</p>
              ) : results.length === 0 ? (
                <p className="search-helper">Bu isimle bir oyuncu bulamadık.</p>
              ) : (
                results.map((player, index) => (
                  <button
                    aria-selected={index === activeResultIndex}
                    className={index === activeResultIndex ? "is-active" : ""}
                    id={`result-${player.id}`}
                    key={player.id}
                    disabled={isSubmitting}
                    onClick={() => void choosePlayer(player)}
                    onMouseEnter={() => setActiveResultIndex(index)}
                    role="option"
                    type="button"
                  >
                    <span className="player-initials" aria-hidden="true">
                      {player.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <strong>{player.name}</strong>
                    <i aria-hidden="true">→</i>
                  </button>
                ))
              )}
            </div>
            {feedback && (
              <p className={`feedback ${feedback.tone}`} role="status">
                {feedback.tone === "success" ? "✓" : "!"} {feedback.text}
              </p>
            )}
            <p className="modal-footnote">
              <span aria-hidden="true">∞</span> Yanlış tahmin hakkın sınırsız. · Joker:{" "}
              {joker.available ? "1 hak" : "kullanıldı"}
            </p>
          </section>
        </div>
      )}

      {showHelp && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setShowHelp(false)}
        >
          <section
            className="help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowHelp(false)}
              aria-label="Nasıl oynanır penceresini kapat"
            >
              ×
            </button>
            <p className="modal-kicker">90+9</p>
            <h2 id="help-title">Nasıl oynanır?</h2>
            <p>
              Her hücre için satırdaki ve sütundaki iki kriteri de karşılayan bir Süper Lig oyuncusu
              bul.
            </p>
            <ul>
              <li>
                <span>↻</span> Grid tamamlanana kadar doğru seçimini değiştirebilirsin.
              </li>
              <li>
                <span>∞</span> Yanlış tahmin hakkın sınırsızdır; oyun bitmez.
              </li>
              <li>
                <span>1×</span> Aynı oyuncuyu gridde yalnızca bir kez kullanabilirsin.
              </li>
              <li>
                <span>★</span> Her günlük gridde bir kez, seçtiğin hücre için altı geçerli oyuncu
                görebilirsin.
              </li>
              <li>
                <span>9</span> Dokuz hücreyi doldurduğunda sonuç kesinleşir ve grid kilitlenir.
              </li>
            </ul>
            <button className="primary-button" type="button" onClick={() => setShowHelp(false)}>
              Oyuna dön
            </button>
          </section>
        </div>
      )}

      {showStatistics && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setShowStatistics(false)}
        >
          <section
            className="statistics-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="statistics-title"
          >
            <button
              className="modal-close"
              type="button"
              onClick={() => setShowStatistics(false)}
              aria-label="İstatistikleri kapat"
            >
              ×
            </button>
            <p className="modal-kicker">BU CİHAZDA</p>
            <h2 id="statistics-title">İstatistikler</h2>

            <div className="statistics-summary">
              <div>
                <strong>{statistics.currentStreak}</strong>
                <span>Mevcut seri</span>
              </div>
              <div>
                <strong>{statistics.bestStreak}</strong>
                <span>En uzun seri</span>
              </div>
              <div>
                <strong>{statistics.completedGrids}</strong>
                <span>Tamamlanan</span>
              </div>
            </div>

            <div className="recent-games">
              <h3>Son oynanan günler</h3>
              {statistics.recentDays.length > 0 ? (
                <ul>
                  {statistics.recentDays.map((day) => (
                    <li key={day.date}>
                      <span>{day.dateLabel}</span>
                      <strong className={day.completed ? "is-complete" : ""}>
                        {day.completed ? "Tamamlandı" : "Devam ediyor"}
                      </strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>İlk gridini tamamladığında istatistiklerin burada görünecek.</p>
              )}
            </div>
          </section>
        </div>
      )}

      {showResults && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => event.target === event.currentTarget && setShowResults(false)}
        >
          <section
            className="result-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-title"
          >
            <p className="modal-kicker">
              {gridMeta
                ? `${gridMeta.dateLabel} · GRID #${String(gridMeta.number).padStart(3, "0")}`
                : "GÜNÜN GRİDİ"}
            </p>
            <div className="result-score" aria-label="9 hücrenin 9'u tamamlandı">
              9<small>/9</small>
            </div>
            <h2 id="result-title">Grid tamamlandı!</h2>
            <p>Sonucun kaydedildi. Grid artık değiştirilemez.</p>

            <div className="result-streak">
              <strong>{statistics.currentStreak}</strong>
              <span>günlük seri</span>
            </div>

            <div className="share-preview" aria-live="polite">
              {shareImageUrl ? (
                <Image
                  src={shareImageUrl}
                  alt="Oyuncu adlarını gösteren 90+9 sonuç kartı"
                  height={1080}
                  unoptimized
                  width={1080}
                />
              ) : (
                <div className="share-preview-placeholder">
                  {shareStatus === "error"
                    ? "Görsel oluşturulamadı. Metin olarak paylaşabilirsin."
                    : "Paylaşım görseli hazırlanıyor…"}
                </div>
              )}
            </div>
            {jokerCells.flat().some(Boolean) && (
              <p className="joker-result-note">Koyu hücre jokerle bulunan oyuncuyu gösterir.</p>
            )}

            <div className="result-actions">
              <button className="primary-button" type="button" onClick={() => void shareResult()}>
                Paylaş
              </button>
              <button
                className="secondary-button"
                type="button"
                disabled={!shareImageUrl}
                onClick={downloadShareImage}
              >
                PNG görselini indir
              </button>
            </div>

            <div className="social-share-links" aria-label="Sosyal medya paylaşım seçenekleri">
              <a href={xShareUrl} target="_blank" rel="noreferrer">
                X’te paylaş
              </a>
              <a href={whatsappShareUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
              <button type="button" onClick={() => void copyShareLink()}>
                Bağlantıyı kopyala
              </button>
            </div>

            {shareFeedback && (
              <p className="share-feedback" role="status">
                {shareFeedback}
              </p>
            )}

            <button
              className="inspect-grid-button"
              type="button"
              onClick={() => setShowResults(false)}
            >
              Tamamlanan gridi incele
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
