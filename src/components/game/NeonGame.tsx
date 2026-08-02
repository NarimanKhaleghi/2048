'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useGameStore, hasSavedGame, getSavedGameInfo } from '@/game/store';
import { t as strings } from '@/game/i18n';
import {
  BoardSize, GAME_MODES, getTileColor, ACHIEVEMENTS,
  toPersianDigits, getRank,
} from '@/game/types';
import { formatNumber } from '@/game/engine';
import { Direction } from '@/game/types';
import * as Sound from '@/game/sound';

// ═══════════════════════════════════════════════════════════════
// CONFETTI SYSTEM
// ═══════════════════════════════════════════════════════════════

function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number }[]>([]);
  const rafRef = useRef(0);

  const fire = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#00e5ff', '#e040fb', '#ffd740', '#ff6d00', '#76ff03', '#448aff', '#ff1744'];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    for (let i = 0; i < 120; i++) {
      const angle = (Math.PI * 2 * i) / 120 + Math.random() * 0.5;
      const speed = 4 + Math.random() * 8;
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 5,
        life: 1,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particlesRef.current) {
        if (p.life <= 0) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life -= 0.012;
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    cancelAnimationFrame(rafRef.current);
    animate();
  }, []);

  return { canvasRef, fire };
}

// ═══════════════════════════════════════════════════════════════
// BACKGROUND STAGE
// ═══════════════════════════════════════════════════════════════

function BackgroundStage() {
  return (
    <div className="neon-stage" aria-hidden="true">
      <div className="grid-floor" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="vignette" />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TOAST STACK
// ═══════════════════════════════════════════════════════════════

function ToastStack() {
  const toasts = useGameStore(s => s.toasts);
  const removeToast = useGameStore(s => s.removeToast);

  useEffect(() => {
    if (toasts.length > 0) {
      const latest = toasts[toasts.length - 1];
      const timer = setTimeout(() => removeToast(latest.id), 3000);
      return () => clearTimeout(timer);
    }
  }, [toasts, removeToast]);

  return (
    <div className="fixed top-0 left-0 right-0 flex flex-col items-center gap-2 z-[100] pointer-events-none safe-top" style={{ paddingTop: '70px' }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`neon-toast ${toast.type}`}
          role="alert"
        >
          {toast.message}
          {toast.sub && <div className="text-[10px] mt-1 opacity-70 normal-case tracking-normal font-body">{toast.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TILE COMPONENT
// ═══════════════════════════════════════════════════════════════

function Tile({ value, row, col, gap, tileSize, isNew, isMerged, isBigMerge, language }: {
  value: number; row: number; col: number; gap: number; tileSize: number;
  isNew: boolean; isMerged: boolean; isBigMerge: boolean; language: 'en' | 'fa';
}) {
  const color = getTileColor(value);
  const isSuper = value > 2048;
  const is2048 = value === 2048;
  const fontSize = value >= 1024 ? tileSize * 0.22 : value >= 128 ? tileSize * 0.28 : tileSize * 0.35;

  const tileClass = [
    'tile',
    isNew && 'tile-new',
    isMerged && 'tile-merged',
    isBigMerge && 'tile-big-merge',
    is2048 && 'tile-2048',
    isSuper && 'tile-super',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={tileClass}
      style={{
        top: row * (tileSize + gap) + gap,
        left: col * (tileSize + gap) + gap,
        width: tileSize,
        height: tileSize,
        background: isSuper || is2048 ? undefined : color.bg,
        boxShadow: `0 0 ${Math.min(value / 16, 20)}px ${color.glow}40, inset 0 0 ${Math.min(value / 32, 10)}px ${color.glow}20`,
        color: color.text,
        fontSize,
      }}
      aria-label={`${value}`}
    >
      {value}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GAME BOARD
// ═══════════════════════════════════════════════════════════════

function GameBoard() {
  const board = useGameStore(s => s.board);
  const mode = useGameStore(s => s.mode);
  const highestTile = useGameStore(s => s.highestTile);
  const language = useGameStore(s => s.language);
  const gameOver = useGameStore(s => s.gameOver);
  const boardRef = useRef<HTMLDivElement>(null);
  const [animTiles, setAnimTiles] = useState<{ spawned: string | null; merged: Set<string> }>({ spawned: null, merged: new Set() });
  const prevBoardRef = useRef<(number | null)[][] | null>(null);

  const size = board.length;
  const containerSize = Math.min(
    typeof window !== 'undefined' ? Math.min(window.innerWidth - 32, window.innerHeight - 280) : 400,
    480
  );
  const gap = size <= 3 ? 8 : size <= 4 ? 10 : 8;
  const boardPx = containerSize;
  const cellSize = (boardPx - gap * (size + 1)) / size;
  const tilePad = Math.max(2, cellSize * 0.06);
  const tileSize = cellSize - tilePad * 2;

  // Detect newly spawned and merged tiles via timeout to break synchronous setState
  useEffect(() => {
    const prev = prevBoardRef.current;
    if (!prev || prev.length !== board.length) {
      prevBoardRef.current = board.map(r => [...r]);
      return;
    }

    const newMerged = new Set<string>();
    let foundSpawn: string | null = null;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const curr = board[r][c];
        const p = prev[r]?.[c];
        if (curr && curr !== p) {
          if (p !== null && curr > p) {
            newMerged.add(`${r},${c}`);
          }
        }
        if (curr && p === null && !newMerged.has(`${r},${c}`)) {
          foundSpawn = `${r},${c}`;
        }
      }
    }

    const handle = setTimeout(() => {
      setAnimTiles({ spawned: foundSpawn, merged: newMerged });
      const t1 = setTimeout(() => setAnimTiles({ spawned: null, merged: new Set() }), 300);
      return () => clearTimeout(t1);
    }, 0);

    prevBoardRef.current = board.map(r => [...r]);
    return () => clearTimeout(handle);
  }, [board, size]);

  const highestColor = getTileColor(highestTile);

  return (
    <div
      ref={boardRef}
      className={`game-board ${gameOver ? 'board-desaturate' : ''}`}
      style={{
        width: boardPx,
        height: boardPx,
        borderColor: `${highestColor.glow}30`,
        boxShadow: `0 0 30px ${highestColor.glow}12, inset 0 0 20px rgba(0,0,0,0.2)`,
      }}
      role="grid"
      aria-label={`${size}x${size} game board`}
      tabIndex={0}
    >
      {/* Empty cells */}
      {Array.from({ length: size }, (_, r) =>
        Array.from({ length: size }, (_, c) => (
          <div
            key={`cell-${r}-${c}`}
            className="board-cell"
            style={{
              top: r * (cellSize + gap) + gap,
              left: c * (cellSize + gap) + gap,
              width: cellSize,
              height: cellSize,
            }}
          />
        ))
      )}

      {/* Tiles */}
      {board.map((row, r) =>
        row.map((cell, c) =>
          cell !== null ? (
            <Tile
              key={`${r}-${c}-${cell}`}
              value={cell}
              row={r}
              col={c}
              gap={gap}
              tileSize={tileSize}
              isNew={animTiles.spawned === `${r},${c}`}
              isMerged={animTiles.merged.has(`${r},${c}`)}
              isBigMerge={animTiles.merged.has(`${r},${c}`) && cell >= 128}
              language={language}
            />
          ) : null
        )
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HUD (GAME SCREEN)
// ═══════════════════════════════════════════════════════════════

function GameHUD() {
  const score = useGameStore(s => s.score);
  const best = useGameStore(s => s.bestScores[s.mode]) ?? 0;
  const mode = useGameStore(s => s.mode);
  const winTarget = useGameStore(s => s.winTarget);
  const rank = useGameStore(s => s.rank);
  const heatSegments = useGameStore(s => s.heatSegments);
  const undoSnapshot = useGameStore(s => s.undoSnapshot);
  const doUndo = useGameStore(s => s.doUndo);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const toggleSound = useGameStore(s => s.toggleSound);
  const goToStart = useGameStore(s => s.goToStart);
  const setOverlay = useGameStore(s => s.setOverlay);
  const language = useGameStore(s => s.language);
  const resolvedTheme = useGameStore(s => s.resolvedTheme);
  const s = strings(language);

  const rankLabel = language === 'fa' ? rank.nameFa : rank.name;

  return (
    <div className="flex flex-col gap-2 w-full max-w-[560px]">
      {/* Top row: score, best, goal */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3 items-center flex-1">
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest opacity-40 font-display">{s.score}</div>
            <div className="score-value text-xl text-[var(--neon-glow-cyan)]">{formatNumber(score, language)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest opacity-40 font-display">{s.best}</div>
            <div className="score-value text-lg opacity-70">{formatNumber(best, language)}</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] uppercase tracking-widest opacity-40 font-display">{s.goal.replace('{n}', String(winTarget))}</div>
          </div>
        </div>
      </div>

      {/* Rank + Heat */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-display uppercase tracking-wider opacity-50">{rankLabel}</span>
          <div className="heat-meter flex-1 max-w-[120px]">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`heat-segment ${i < heatSegments ? 'filled' : ''}`}
                aria-label={language === 'fa' ? `دمای ${i + 1} از ۱۰` : `Heat ${i + 1} of 10`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            className="neon-btn neon-btn-icon"
            onClick={doUndo}
            disabled={!undoSnapshot}
            aria-label={language === 'fa' ? 'بازگشت' : 'Undo'}
            style={{ opacity: undoSnapshot ? 1 : 0.3 }}
          >
            ↩
          </button>
          <button
            className="neon-btn neon-btn-icon"
            onClick={toggleSound}
            aria-label={s.sound}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          <button
            className="neon-btn neon-btn-icon"
            onClick={() => setOverlay('howToPlay')}
            aria-label={s.howToPlay}
          >
            ?
          </button>
          <button
            className="neon-btn neon-btn-icon"
            onClick={goToStart}
            aria-label={language === 'fa' ? 'بازگشت' : 'Back'}
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GAME SCREEN (BOARD + HUD)
// ═══════════════════════════════════════════════════════════════

function GameScreen() {
  const doMove = useGameStore(s => s.doMove);
  const overlay = useGameStore(s => s.overlay);
  const isAnimating = useGameStore(s => s.isAnimating);
  const boardRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastKeyTime = useRef(0);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
 if (overlay !== 'none') {
        if (e.key === 'Escape') {
          e.preventDefault();
          useGameStore.getState().setOverlay('none');
        }
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime.current < 80) return; // Debounce
      lastKeyTime.current = now;

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': dir = 'up'; break;
        case 'ArrowDown': case 's': case 'S': dir = 'down'; break;
        case 'ArrowLeft': case 'a': case 'A': dir = 'left'; break;
        case 'ArrowRight': case 'd': case 'D': dir = 'right'; break;
        case 'u': case 'U': doMove.call(null); useGameStore.getState().doUndo(); return;
      }

      if (dir) {
        e.preventDefault();
        doMove(dir);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [overlay, doMove]);

  // Touch / swipe
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStart.current.x;
    const dy = touch.clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 24;

    if (Math.max(absDx, absDy) < threshold) {
      touchStart.current = null;
      return;
    }

    let dir: Direction;
    if (absDx > absDy) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }
    doMove(dir);
    touchStart.current = null;
  }, [doMove]);

  return (
    <div
      ref={boardRef}
      className="flex flex-col items-center justify-center gap-4 h-full px-4 safe-top"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="application"
      aria-label="2048 game board"
    >
      <GameHUD />
      <GameBoard />
      <div className="text-[10px] opacity-30 font-display tracking-wider">
        {strings(useGameStore.getState().language).swipeToLearn}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// START SCREEN
// ═══════════════════════════════════════════════════════════════

function StartScreen() {
  const mode = useGameStore(s => s.mode);
  const selectMode = useGameStore(s => s.selectMode);
  const startNewGame = useGameStore(s => s.startNewGame);
  const continueGame = useGameStore(s => s.continueGame);
  const discardAndNew = useGameStore(s => s.discardAndNew);
  const setOverlay = useGameStore(s => s.setOverlay);
  const language = useGameStore(s => s.language);
  const resolvedTheme = useGameStore(s => s.resolvedTheme);
  const toggleSound = useGameStore(s => s.toggleSound);
  const soundEnabled = useGameStore(s => s.soundEnabled);
  const setTheme = useGameStore(s => s.setTheme);
  const themeSetting = useGameStore(s => s.themeSetting);
  const setLanguage = useGameStore(s => s.setLanguage);
  const s = strings(language);
  const [hasSave] = useState(() => hasSavedGame());
  const [saveInfo] = useState(() => getSavedGameInfo());
  const [discardConfirm, setDiscardConfirm] = useState(false);

  useEffect(() => {
    if (discardConfirm) {
      const t = setTimeout(() => setDiscardConfirm(false), 2000);
      return () => clearTimeout(t);
    }
  }, [discardConfirm]);

  const handleDiscard = () => {
    if (!discardConfirm) {
      setDiscardConfirm(true);
      return;
    }
    discardAndNew();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 safe-top safe-bottom gap-5 max-w-[480px] mx-auto">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-1">
        <div className="logo-tile w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#0e4d5e', color: '#00e5ff', boxShadow: '0 0 12px #00e5ff40' }}>2</div>
        <div className="logo-tile w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#5e4a0e', color: '#ffd740', boxShadow: '0 0 12px #ffd74040' }}>0</div>
        <div className="logo-tile w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#5e4a0e', color: '#ffd740', boxShadow: '0 0 12px #ffd74040' }}>4</div>
        <div className="logo-tile w-10 h-10 flex items-center justify-center rounded-lg text-sm font-bold" style={{ background: '#5e4e0e', color: '#ffd740', boxShadow: '0 0 15px #ffd74050' }}>8</div>
      </div>

      <div className="font-display text-xs tracking-[0.3em] uppercase opacity-40">{s.tagline}</div>

      {/* Continue card */}
      {hasSave && saveInfo && (
        <div className="continue-card w-full">
          <div>
            <div className="font-display text-xs opacity-60">{s.continue}</div>
            <div className="font-display text-sm text-[var(--neon-glow-cyan)]">{formatNumber(saveInfo.score, language)}</div>
            <div className="text-[10px] opacity-40 mt-0.5">{saveInfo.mode}×{saveInfo.mode} · {formatNumber(saveInfo.highestTile, language)}</div>
          </div>
          <div className="flex gap-2">
            <button className="neon-btn neon-btn-sm" onClick={continueGame}>{s.continue}</button>
            <button
              className={`neon-btn neon-btn-sm ${discardConfirm ? '!border-red-500 !text-red-500 !bg-red-500/10' : ''}`}
              onClick={handleDiscard}
            >
              {discardConfirm ? s.discardConfirm : s.discard}
            </button>
          </div>
        </div>
      )}

      {/* Mode chips */}
      <div className="flex flex-wrap justify-center gap-2 w-full">
        {GAME_MODES.map(gm => (
          <button
            key={gm.size}
            className={`mode-chip ${mode === gm.size ? 'selected' : ''}`}
            onClick={() => { selectMode(gm.size as BoardSize); Sound.playUITick(); }}
            aria-pressed={mode === gm.size}
          >
            <div className="font-display chip-name">{language === 'fa' ? gm.nameFa : gm.name}</div>
            <div className="chip-goal">{gm.size}×{gm.size} → {formatNumber(gm.winTarget, language)}</div>
          </button>
        ))}
      </div>

      {/* Start button */}
      <button
        className="neon-btn neon-btn-gold px-10 py-3 text-base"
        onClick={startNewGame}
        aria-label={s.startGame}
      >
        {s.startGame}
      </button>

      {/* Header controls */}
      <div className="flex items-center gap-3 mt-2">
        {/* Theme toggle */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={() => {
            const next = themeSetting === 'dark' ? 'light' : themeSetting === 'light' ? 'auto' : 'dark';
            setTheme(next);
            Sound.playUITick();
          }}
          aria-label={themeSetting === 'dark' ? s.switchLight : s.switchDark}
        >
          {resolvedTheme === 'dark' ? '☀' : '🌙'}
        </button>

        {/* Language toggle */}
        <div className="lang-toggle">
          <div
            className="indicator"
            style={{
              transform: language === 'fa' ? (typeof document !== 'undefined' && document.dir === 'rtl' ? 'translateX(calc(-100% - 1px))' : 'translateX(100%)') : 'translateX(0)',
            }}
          />
          <button
            className={language === 'en' ? 'active' : ''}
            onClick={() => { setLanguage('en'); Sound.playUITick(); }}
          >EN</button>
          <button
            className={language === 'fa' ? 'active' : ''}
            onClick={() => { setLanguage('fa'); Sound.playUITick(); }}
          >FA</button>
        </div>

        {/* Sound */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={toggleSound}
          aria-label={s.sound}
        >
          {soundEnabled ? '🔊' : '🔇'}
        </button>

        {/* Help */}
        <button
          className="neon-btn neon-btn-icon"
          onClick={() => setOverlay('howToPlay')}
          aria-label={s.howToPlay}
        >
          ?
        </button>

        {/* GitHub */}
        <a
          href="https://github.com/NarimanKhaleghi/2048"
          target="_blank"
          rel="noopener noreferrer referrer"
          className="neon-btn neon-btn-icon"
          aria-label={s.githubLabel}
          style={{ textDecoration: 'none' }}
        >
          ⌨
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// WIN MODAL
// ═══════════════════════════════════════════════════════════════

function WinModal() {
  const score = useGameStore(s => s.score);
  const best = useGameStore(s => s.bestScores[s.mode]) ?? 0;
  const moves = useGameStore(s => s.moves);
  const language = useGameStore(s => s.language);
  const setOverlay = useGameStore(s => s.setOverlay);
  const startNewGame = useGameStore(s => s.startNewGame);
  const goToStart = useGameStore(s => s.goToStart);
  const s = strings(language);
  const { fire: fireConfetti } = useConfetti();

  useEffect(() => { fireConfetti(); }, [fireConfetti]);

  return (
    <div className="neon-overlay" onClick={() => setOverlay('none')} role="dialog" aria-label={s.winTitle}>
      <div className="neon-modal" onClick={e => e.stopPropagation()}>
        <div className="font-display text-2xl font-black text-[var(--neon-glow-amber)] mb-2" style={{ textShadow: '0 0 20px var(--neon-glow-amber)' }}>
          {s.winTitle}
        </div>
        <div className="font-display text-4xl font-black my-4">{formatNumber(score, language)}</div>
        <div className="text-sm opacity-50 mb-6">{s.vsBest.replace('{n}', formatNumber(best, language))}</div>
        <div className="flex flex-col gap-2">
          <button className="neon-btn neon-btn-gold w-full" onClick={() => { setOverlay('none'); }}>{s.endless}</button>
          <button className="neon-btn w-full" onClick={startNewGame}>{s.newGame}</button>
          <button className="neon-btn neon-btn-sm w-full opacity-60" onClick={goToStart}>{s.changeMode}</button>
        </div>
      </div>
      <ConfettiCanvas />
    </div>
  );
}

function ConfettiCanvas() {
  const { canvasRef } = useConfetti();
  return <canvas ref={canvasRef} className="confetti-canvas" />;
}

// ═══════════════════════════════════════════════════════════════
// LOSE OVERLAY
// ═══════════════════════════════════════════════════════════════

function LoseOverlay() {
  const score = useGameStore(s => s.score);
  const best = useGameStore(s => s.bestScores[s.mode]) ?? 0;
  const moves = useGameStore(s => s.moves);
  const mergeCount = useGameStore(s => s.mergeCount);
  const undoSnapshot = useGameStore(s => s.undoSnapshot);
  const doUndo = useGameStore(s => s.doUndo);
  const startNewGame = useGameStore(s => s.startNewGame);
  const goToStart = useGameStore(s => s.goToStart);
  const language = useGameStore(s => s.language);
  const s = strings(language);

  return (
    <div className="neon-overlay" role="dialog" aria-label={s.loseTitle}>
      <div className="neon-modal">
        <div className="font-display text-2xl font-black text-red-400 mb-2" style={{ textShadow: '0 0 15px #ff1744' }}>
          {s.loseTitle}
        </div>
        <div className="font-display text-3xl font-black my-4">{formatNumber(score, language)}</div>
        <div className="text-sm opacity-50 mb-6">{s.vsBest.replace('{n}', formatNumber(best, language))}</div>
        <div className="grid grid-cols-2 gap-3 text-xs opacity-60 mb-6">
          <div>{s.moves}: {formatNumber(moves, language)}</div>
          <div>{s.merges}: {formatNumber(mergeCount, language)}</div>
        </div>
        <div className="flex flex-col gap-2">
          {undoSnapshot && (
            <button className="neon-btn neon-btn-gold w-full" onClick={() => { doUndo(); useGameStore.getState().setOverlay('none'); }}>{s.undoRescue}</button>
          )}
          <button className="neon-btn w-full" onClick={startNewGame}>{s.tryAgain}</button>
          <button className="neon-btn neon-btn-sm w-full opacity-60" onClick={goToStart}>{s.changeMode}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOW TO PLAY DRAWER
// ═══════════════════════════════════════════════════════════════

function HowToPlayDrawer() {
  const setOverlay = useGameStore(s => s.setOverlay);
  const language = useGameStore(s => s.language);
  const resetAllProgress = useGameStore(s => s.resetAllProgress);
  const effectsQuality = useGameStore(s => s.effectsQuality);
  const setEffectsQuality = useGameStore(s => s.setEffectsQuality);
  const themeSetting = useGameStore(s => s.themeSetting);
  const setTheme = useGameStore(s => s.setTheme);
  const s = strings(language);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    if (resetConfirm) {
      const t = setTimeout(() => setResetConfirm(false), 3000);
      return () => clearTimeout(t);
    }
  }, [resetConfirm]);

  return (
    <div className="neon-drawer" onClick={() => setOverlay('none')} role="dialog" aria-label={s.howToPlay}>
      <div className="scrim" />
      <div className="panel" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold mb-4 text-[var(--neon-glow-cyan)]">{s.howToPlay}</h2>

        <Section title={s.rules} body={s.rulesBody} />
        <Section title={s.controls} body={s.controlsBody} />
        <Section title={s.scoring} body={s.scoringBody} />
        <Section title={s.undoRule} body={s.undoRuleBody} />

        {/* Modes table */}
        <h3 className="font-display text-xs font-bold mt-4 mb-2 uppercase tracking-wider opacity-60">{s.modes}</h3>
        <div className="space-y-1 mb-4">
          {GAME_MODES.map(gm => (
            <div key={gm.size} className="flex justify-between text-xs opacity-70 py-1">
              <span>{language === 'fa' ? gm.nameFa : gm.name} ({gm.size}×{gm.size})</span>
              <span className="font-display">→ {formatNumber(gm.winTarget, language)}</span>
            </div>
          ))}
        </div>

        <Section title={s.shortcuts} body={s.shortcutsBody} />

        {/* Settings */}
        <h3 className="font-display text-xs font-bold mt-4 mb-3 uppercase tracking-wider opacity-60">{s.settings}</h3>

        {/* Effects quality */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span>{s.effects}</span>
          <div className="flex gap-1">
            <button
              className={`neon-btn neon-btn-sm ${effectsQuality === 'high' ? 'selected' : 'opacity-50'}`}
              onClick={() => setEffectsQuality('high')}
            >{s.effectsHigh}</button>
            <button
              className={`neon-btn neon-btn-sm ${effectsQuality === 'low' ? 'selected' : 'opacity-50'}`}
              onClick={() => setEffectsQuality('low')}
            >{s.effectsLow}</button>
          </div>
        </div>

        {/* Theme */}
        <div className="flex items-center justify-between mb-3 text-sm">
          <span>{themeSetting === 'auto' ? s.autoTheme : themeSetting === 'dark' ? s.switchDark : s.switchLight}</span>
          <div className="flex gap-1">
            <button className={`neon-btn neon-btn-sm ${themeSetting === 'dark' ? 'selected' : 'opacity-50'}`} onClick={() => setTheme('dark')}>Dark</button>
            <button className={`neon-btn neon-btn-sm ${themeSetting === 'light' ? 'selected' : 'opacity-50'}`} onClick={() => setTheme('light')}>Light</button>
            <button className={`neon-btn neon-btn-sm ${themeSetting === 'auto' ? 'selected' : 'opacity-50'}`} onClick={() => setTheme('auto')}>Auto</button>
          </div>
        </div>

        {/* GitHub link */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <a
            href="https://github.com/NarimanKhaleghi/2048"
            target="_blank"
            rel="noopener noreferrer referrer"
            className="text-xs opacity-40 hover:opacity-70 transition-opacity"
          >
            {s.github}
          </a>
        </div>

        {/* Reset */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <button
            className={`text-xs opacity-30 hover:opacity-60 transition-opacity ${resetConfirm ? 'text-red-400' : ''}`}
            onClick={() => {
              if (!resetConfirm) { setResetConfirm(true); return; }
              resetAllProgress();
              setOverlay('none');
            }}
          >
            {resetConfirm ? s.resetConfirm : s.resetProgress}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div className="mb-3">
      <h3 className="font-display text-xs font-bold mb-1 uppercase tracking-wider opacity-60">{title}</h3>
      <p className="text-xs leading-relaxed opacity-70">{body}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ACHIEVEMENTS DRAWER
// ═══════════════════════════════════════════════════════════════

function AchievementsDrawer() {
  const setOverlay = useGameStore(s => s.setOverlay);
  const achievements = useGameStore(s => s.achievements);
  const language = useGameStore(s => s.language);
  const s = strings(language);

  return (
    <div className="neon-drawer" onClick={() => setOverlay('none')} role="dialog" aria-label={s.achievements}>
      <div className="scrim" />
      <div className="panel" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold mb-4 text-[var(--neon-glow-amber)]">{s.achievements}</h2>
        <div className="space-y-2">
          {ACHIEVEMENTS.map(ach => {
            const state = achievements[ach.id];
            const unlocked = state?.unlocked;
            return (
              <div key={ach.id} className={`achievement-item ${unlocked ? 'unlocked' : 'locked'}`}>
                <div className="achievement-glyph">{ach.glyph}</div>
                <div className="flex-1">
                  <div className="font-display text-xs font-bold">{language === 'fa' ? ach.nameFa : ach.name}</div>
                  <div className="text-[10px] opacity-60">{language === 'fa' ? ach.descFa : ach.desc}</div>
                </div>
                <div className="text-[10px] font-display opacity-40">
                  {unlocked ? (state.date ? new Date(state.date).toLocaleDateString(language === 'fa' ? 'fa-IR' : 'en-US') : s.unlocked) : s.locked}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HALL OF FAME DRAWER
// ═══════════════════════════════════════════════════════════════

function HallOfFameDrawer() {
  const setOverlay = useGameStore(s => s.setOverlay);
  const hallOfFame = useGameStore(s => s.hallOfFame);
  const mode = useGameStore(s => s.mode);
  const language = useGameStore(s => s.language);
  const s = strings(language);

  const entries = hallOfFame[mode] || [];

  return (
    <div className="neon-drawer" onClick={() => setOverlay('none')} role="dialog" aria-label={s.hallOfFameTitle}>
      <div className="scrim" />
      <div className="panel" onClick={e => e.stopPropagation()}>
        <h2 className="font-display text-lg font-bold mb-4 text-[var(--neon-glow-cyan)]">{s.hallOfFameTitle}</h2>
        {entries.length === 0 ? (
          <div className="text-sm opacity-40 text-center py-8">{s.noEntry}</div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <div key={i} className="hof-entry">
                <div className="font-display text-lg font-bold text-[var(--neon-glow-amber)] w-8">#{i + 1}</div>
                <div className="flex-1">
                  <div className="font-display text-sm font-bold">{formatNumber(entry.score, language)}</div>
                  <div className="text-[10px] opacity-50">{s.moves}: {entry.moves} · {s.time}: {Math.floor(entry.time / 60)}:{String(entry.time % 60).padStart(2, '0')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ONBOARDING TOUR
// ═══════════════════════════════════════════════════════════════

function OnboardingTour() {
  const completeOnboarding = useGameStore(s => s.completeOnboarding);
  const language = useGameStore(s => s.language);
  const s = strings(language);
  const [step, setStep] = useState(0);

  const steps = [
    { title: s.tour1Title, body: s.tour1Body, icon: '🎮' },
    { title: s.tour2Title, body: s.tour2Body, icon: '📲' },
    { title: s.tour3Title, body: s.tour3Body, icon: '✈' },
    { title: s.tour4Title, body: s.tour4Body, icon: '⚡' },
  ];

  const next = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
      Sound.playUITick();
    } else {
      completeOnboarding();
    }
  };

  const prev = () => {
    if (step > 0) {
      setStep(step - 1);
      Sound.playUITick();
    }
  };

  return (
    <div className="neon-onboarding" role="dialog" aria-label="Onboarding">
      <div className="tour-card">
        <div className="text-4xl mb-4">{steps[step].icon}</div>
        <div className="text-xs opacity-40 font-display mb-2">
          {s.stepOf.replace('{current}', String(step + 1)).replace('{total}', String(steps.length))}
        </div>
        <h2 className="font-display text-lg font-bold mb-3 text-[var(--neon-glow-cyan)]">{steps[step].title}</h2>
        <p className="text-sm opacity-70 leading-relaxed mb-6">{steps[step].body}</p>

        <div className="tour-dots mb-6">
          {steps.map((_, i) => (
            <div key={i} className={`tour-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>

        <div className="flex gap-3 justify-center">
          <button className="neon-btn neon-btn-sm opacity-60" onClick={completeOnboarding}>{s.skip}</button>
          {step > 0 && <button className="neon-btn neon-btn-sm" onClick={prev}>←</button>}
          <button className="neon-btn neon-btn-gold" onClick={next}>
            {step === steps.length - 1 ? s.startPlaying : '→'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN GAME COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function NeonGame() {
  const screen = useGameStore(s => s.screen);
  const overlay = useGameStore(s => s.overlay);
  const onboardingDone = useGameStore(s => s.onboardingDone);
  const resolvedTheme = useGameStore(s => s.resolvedTheme);
  const language = useGameStore(s => s.language);
  const resolveTheme = useGameStore(s => s.resolveTheme);
  const effectsQuality = useGameStore(s => s.effectsQuality);

  // Apply theme class and dir
  useEffect(() => {
    resolveTheme();
  }, [resolveTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'light') {
      root.classList.remove('dark');
      document.body.classList.add('neon-light');
    } else {
      root.classList.add('dark');
      document.body.classList.remove('neon-light');
    }
    document.documentElement.dir = language === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [resolvedTheme, language]);

  // Detect performance
  useEffect(() => {
    const isLowPerf = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    if (isLowPerf && effectsQuality === 'high') {
      useGameStore.getState().setEffectsQuality('low');
    }
    // Private browsing detection
    try {
      const testKey = '__neon2048_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch {
      useGameStore.getState().addToast('info', strings(language).privateMode);
    }
  }, []);

  // Offline detection
  useEffect(() => {
    const handleOffline = () => {
      useGameStore.getState().addToast('offline', strings(language).offlineToast);
    };
    const handleOnline = () => {
      useGameStore.getState().addToast('online', strings(language).onlineToast);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [language]);

  // Install detection
  useEffect(() => {
    let deferredPrompt: unknown = null;

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);

    const handleAppInstalled = () => {
      useGameStore.getState().setInstalled(true);
      const s2 = strings(useGameStore.getState().language);
      useGameStore.getState().addToast('installed', s2.installedToast);
      deferredPrompt = null;
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return (
    <div
      className={`relative w-full h-[100dvh] overflow-hidden ${resolvedTheme === 'dark' ? 'dark' : ''}`}
      style={{ background: 'var(--neon-bg)' }}
    >
      <BackgroundStage />

      {/* Screen reader announcer */}
      <div id="sr-announcer" className="sr-only" aria-live="polite" aria-atomic="true" />

      {screen === 'start' && <StartScreen />}
      {screen === 'game' && <GameScreen />}

      {/* Overlays */}
      {overlay === 'win' && <WinModal />}
      {overlay === 'lose' && <LoseOverlay />}
      {overlay === 'howToPlay' && <HowToPlayDrawer />}
      {overlay === 'achievements' && <AchievementsDrawer />}
      {overlay === 'hallOfFame' && <HallOfFameDrawer />}

      {!onboardingDone && <OnboardingTour />}

      <ToastStack />
    </div>
  );
}
