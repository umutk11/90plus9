"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { gridColumns as columns, gridRows as rows, type GridCellKey } from "@/lib/grid-config";

type Player = { id: number; name: string };
type FilledCells = Partial<Record<GridCellKey, Player>>;
type AnswerCounts = Partial<Record<GridCellKey, number>>;
type SearchStatus = "idle" | "loading" | "ready" | "error";

export default function Home() {
  const [filledCells, setFilledCells] = useState<FilledCells>({});
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
  const inputRef = useRef<HTMLInputElement>(null);

  const progress = Object.keys(filledCells).length;
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
  }, [selectedCell]);
  const selectedAnswerCount = selectedCell ? answerCounts[selectedCell] : undefined;

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/v1/game", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Grid yüklenemedi.");
        return response.json() as Promise<{ answerCounts: AnswerCounts }>;
      })
      .then((data) => setAnswerCounts(data.answerCounts))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setFeedback({ tone: "error", text: "Grid bilgileri şu anda yüklenemiyor." });
        }
      });

    return () => controller.abort();
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

  function openPlayerSearch(cellKey: GridCellKey) {
    setSelectedCell(cellKey);
    setQuery("");
    setFeedback(null);
    setActiveResultIndex(0);
    setResults([]);
    setSearchStatus("idle");
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
        body: JSON.stringify({ cellKey: selectedCell, playerId: player.id }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!response.ok) throw new Error("Tahmin kontrol edilemedi.");

      const result = (await response.json()) as { correct: boolean; player?: Player };
      if (!result.correct || !result.player) {
        setFeedback({
          tone: "error",
          text: "Bu oyuncu iki kriteri birlikte karşılamıyor. Başka bir isim deneyebilirsin.",
        });
        return;
      }

      setFilledCells((current) => ({ ...current, [selectedCell]: result.player }));
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
          <button
            className="icon-button"
            type="button"
            aria-label="İstatistikler yakında"
            title="İstatistikler yakında"
          >
            <span aria-hidden="true">↗</span>
          </button>
        </nav>
      </header>

      <section className="game-stage">
        <div className="game-layout" id="oyun">
          <article className="game-card" aria-label="Günün 3 çarpı 3 futbol gridi">
            <div className="game-card-header">
              <div>
                <p className="game-kicker">11 AĞUSTOS 2026 · GRID #001</p>
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

            {progress === 9 && (
              <div className="complete-banner" role="status">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>Grid tamamlandı!</strong>
                  <small>Süper Lig hafızan bugün kusursuz.</small>
                </div>
              </div>
            )}

            <div className="grid-wrap">
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
                          aria-label={`${row.label} ve ${column.label}${player ? `: ${player.name}` : ", boş hücre"}`}
                          className={`grid-cell ${player ? "is-filled" : ""}`}
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
              <span aria-hidden="true">∞</span> Yanlış tahmin hakkın sınırsız.
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
                <span>↻</span> Doğru oyuncuya dokunarak seçimini değiştirebilirsin.
              </li>
              <li>
                <span>∞</span> Yanlış tahmin hakkın sınırsızdır; oyun bitmez.
              </li>
              <li>
                <span>1×</span> Aynı oyuncuyu gridde yalnızca bir kez kullanabilirsin.
              </li>
              <li>
                <span>9</span> Dokuz hücreyi doldurduğunda oyun tamamlanır.
              </li>
            </ul>
            <button className="primary-button" type="button" onClick={() => setShowHelp(false)}>
              Oyuna dön
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
