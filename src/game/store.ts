// ═══════════════════════════════════════════════════════════════
// NEON 2048 — Game Store (Zustand)
// ═══════════════════════════════════════════════════════════════

import { create } from 'zustand';
import {
  BoardSize, Direction, SaveData, PersistentData, HallOfFameEntry, ThemeMode, Language,
  ACHIEVEMENTS, GAME_MODES, getRank, toPersianDigits,
} from './types';
import {
  createEmptyBoard, cloneBoard, move, canMove, hasWon, spawnTile, getHighestTile,
  formatNumber, getDistinctValues,
} from './engine';
import * as S from './sound';

export type Screen = 'start' | 'game';
export type Overlay = 'none' | 'win' | 'lose' | 'howToPlay' | 'achievements' | 'hallOfFame' | 'onboarding';

type ToastType = 'info' | 'achievement' | 'combo' | 'overheat' | 'newBest' | 'rankUp' | 'hallOfFame' | 'nudge' | 'undo' | 'restored' | 'offline' | 'online' | 'installed' | 'runningAsApp' | 'private' | 'performance';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  sub?: string;
}

interface GameStore {
  // Screen state
  screen: Screen;
  overlay: Overlay;
  toasts: Toast[];
  toastId: number;

  // Game state
  board: (number | null)[][];
  score: number;
  moves: number;
  mergeCount: number;
  highestTile: number;
  mode: BoardSize;
  winTarget: number;
  hasWon: boolean;
  gameOver: boolean;
  isAnimating: boolean;

  // Undo
  undoSnapshot: {
    board: (number | null)[][];
    score: number;
    moves: number;
    mergeCount: number;
    highestTile: number;
    heatSegments: number;
  } | null;
  undosUsed: number;
  lastUndoHighestTile: number;
  movesSinceUndo: number;

  // Gamification
  comboCount: number;
  maxCombo: number;
  heatSegments: number;
  heatBonuses: number;
  currentCombo: number;
  lastScoreDisplay: number;
  floatingScores: { id: number; value: number; row: number; col: number }[];

  // Time
  playTime: number;
  playStartTime: number;

  // Persistent data
  bestScores: Partial<Record<BoardSize, number>>;
  achievements: Record<string, { unlocked: boolean; date: string | null }>;
  hallOfFame: Partial<Record<BoardSize, HallOfFameEntry[]>>;
  soundEnabled: boolean;
  effectsQuality: 'high' | 'low';
  themeSetting: 'dark' | 'light' | 'auto';
  language: Language;
  onboardingDone: boolean;
  installNudgeCount: number;
  installNudgeNever: boolean;
  isInstalled: boolean;
  lifetime: PersistentData['lifetime'];

  // Computed
  resolvedTheme: ThemeMode;
  rank: { name: string; nameFa: string };

  // Actions
  setScreen: (s: Screen) => void;
  setOverlay: (o: Overlay) => void;
  addToast: (type: ToastType, message: string, sub?: string) => void;
  removeToast: (id: number) => void;
  selectMode: (size: BoardSize) => void;
  startNewGame: () => void;
  continueGame: () => void;
  discardAndNew: () => void;
  doMove: (dir: Direction) => void;
  doUndo: () => void;
  goToStart: () => void;
  toggleSound: () => void;
  setTheme: (t: 'dark' | 'light' | 'auto') => void;
  setLanguage: (l: Language) => void;
  setEffectsQuality: (q: 'high' | 'low') => void;
  completeOnboarding: () => void;
  dismissNudge: (action: 'later' | 'never') => void;
  setInstalled: (v: boolean) => void;
  resetAllProgress: () => void;
  resolveTheme: () => void;
  setAnimating: (v: boolean) => void;
  tickPlayTime: () => void;
  checkAchievements: () => void;
  endGame: () => void;
}

const STORAGE_KEY = 'neon2048_data';
const SAVE_KEY = 'neon2048_save';
const SETTINGS_KEY = 'neon2048_settings';

function loadPersistentData(): PersistentData {
  if (typeof window === 'undefined') {
    return defaultPersistentData();
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return { ...defaultPersistentData(), ...data };
    }
  } catch { /* corrupt data */ }
  return defaultPersistentData();
}

function defaultPersistentData(): PersistentData {
  return {
    bestScores: {},
    achievements: Object.fromEntries(ACHIEVEMENTS.map(a => [a.id, { unlocked: false, date: null }])),
    hallOfFame: {},
    settings: {
      sound: true,
      effectsQuality: 'high',
      theme: 'dark',
      language: detectLanguage(),
      lastBoardSize: 4,
      onboardingDone: false,
      installNudgeCount: 0,
      installNudgeNever: false,
      installed: false,
    },
    lifetime: { gamesPlayed: 0, gamesWon: 0, totalMoves: 0, totalMerges: 0, highestTileEver: 2 },
  };
}

function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || '';
  if (lang.startsWith('fa')) return 'fa';
  return 'en';
}

function savePersistentData(data: PersistentData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* private mode */ }
}

function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return null;
}

function saveSave(data: SaveData) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch { /* private mode */ }
}

function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch { /* */ }
}

export const useGameStore = create<GameStore>((set, get) => {
  const persisted = loadPersistentData();
  const save = loadSave();
  const settings = persisted.settings;
  const s = settings;

  return {
    screen: save ? 'start' : 'start',
    overlay: 'none',
    toasts: [],
    toastId: 0,

    board: save?.board ?? createEmptyBoard(s.lastBoardSize),
    score: save?.score ?? 0,
    moves: save?.moves ?? 0,
    mergeCount: save?.mergeCount ?? 0,
    highestTile: save?.highestTile ?? 2,
    mode: save?.mode ?? s.lastBoardSize,
    winTarget: GAME_MODES.find(m => m.size === (save?.mode ?? s.lastBoardSize))?.winTarget ?? 2048,
    hasWon: save?.hasWon ?? false,
    gameOver: false,
    isAnimating: false,

    undoSnapshot: save?.undoSnapshot ?? null,
    undosUsed: save?.undosUsed ?? 0,
    lastUndoHighestTile: 0,
    movesSinceUndo: 0,

    comboCount: 0,
    maxCombo: save?.maxCombo ?? 0,
    heatSegments: save?.heatSegments ?? 0,
    heatBonuses: save?.heatBonuses ?? 0,
    currentCombo: 0,
    lastScoreDisplay: 0,
    floatingScores: [],

    playTime: save?.playTime ?? 0,
    playStartTime: Date.now(),

    bestScores: persisted.bestScores,
    achievements: persisted.achievements,
    hallOfFame: persisted.hallOfFame,
    soundEnabled: s.sound,
    effectsQuality: s.effectsQuality,
    themeSetting: s.theme,
    language: s.language,
    onboardingDone: s.onboardingDone,
    installNudgeCount: s.installNudgeCount,
    installNudgeNever: s.installNudgeNever,
    isInstalled: s.installed,
    lifetime: persisted.lifetime,

    resolvedTheme: s.theme === 'auto'
      ? (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
      : s.theme,
    rank: getRank(save?.highestTile ?? 2),

    setScreen: (screen) => set({ screen }),
    setOverlay: (overlay) => set({ overlay }),
    addToast: (type, message, sub) => set(s => ({
      toasts: [...s.toasts, { id: s.toastId + 1, type, message, sub }],
      toastId: s.toastId + 1,
    })),
    removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

    selectMode: (size) => {
      set({ mode: size, winTarget: GAME_MODES.find(m => m.size === size)!.winTarget });
    },

    startNewGame: () => {
      const { mode, language } = get();
      const board = createEmptyBoard(mode);
      spawnTile(board);
      spawnTile(board);
      const ht = getHighestTile(board);
      const state = {
        screen: 'game' as Screen,
        overlay: 'none' as Overlay,
        board,
        score: 0,
        moves: 0,
        mergeCount: 0,
        highestTile: ht,
        hasWon: false,
        gameOver: false,
        undoSnapshot: null,
        undosUsed: 0,
        lastUndoHighestTile: 0,
        movesSinceUndo: 0,
        comboCount: 0,
        maxCombo: 0,
        heatSegments: 0,
        heatBonuses: 0,
        currentCombo: 0,
        lastScoreDisplay: 0,
        floatingScores: [] as { id: number; value: number; row: number; col: number }[],
        playTime: 0,
        playStartTime: Date.now(),
        rank: getRank(ht),
      };
      set(state);
      // Update lifetime
      const pd = loadPersistentData();
      pd.lifetime.gamesPlayed++;
      pd.settings.lastBoardSize = mode;
      savePersistentData(pd);
      autoSave();
      announce('Game started. ' + (mode === 4 ? 'Classic 4 by 4.' : `${mode} by ${mode} board.`));
    },

    continueGame: () => {
      const { playTime } = get();
      set({
        screen: 'game',
        overlay: 'none',
        playStartTime: Date.now() - playTime * 1000,
      });
      const { language } = get();
      const msg = language === 'fa' ? 'پیشرفت بازیابی شد ✓' : 'Progress restored ✓';
      get().addToast('restored', msg);
    },

    discardAndNew: () => {
      clearSave();
      get().startNewGame();
    },

    doMove: (dir) => {
      const s = get();
      if (s.isAnimating || s.gameOver || s.screen !== 'game' || s.overlay !== 'none') return;

      const result = move(s.board, dir);
      if (!result.moved) return;

      // Save undo snapshot
      const snapshot = {
        board: cloneBoard(s.board),
        score: s.score,
        moves: s.moves,
        mergeCount: s.mergeCount,
        highestTile: s.highestTile,
        heatSegments: s.heatSegments,
      };

      // Spawn new tile
      const spawned = spawnTile(result.board);
      const newHighest = getHighestTile(result.board);

      // Combo
      const combo = result.mergeCount > 1 ? result.mergeCount : 0;
      const newMaxCombo = Math.max(s.maxCombo, combo);

      // Heat
      let newHeat = s.heatSegments;
      let heatBonusScore = 0;
      if (result.mergeCount > 0) {
        newHeat = Math.min(newHeat + 1, 10);
        if (newHeat >= 10) {
          heatBonusScore = 5 * newHighest;
          newHeat = 0;
          S.playHeatFlare();
          S.vibrate([25, 10, 25]);
          const ht = getHighestTile(result.board);
          const msg = s.language === 'fa'
            ? `داغ شد! +${formatNumber(heatBonusScore, s.language)}`
            : `OVERHEAT! +${formatNumber(heatBonusScore, s.language)}`;
          get().addToast('overheat', msg);
          s.heatBonuses++;
          // Check overheated achievement
          checkSingleAchievement(get, 'overheated');
        }
      } else {
        newHeat = 0;
      }

      // Calculate final score
      const finalMoveScore = (result.score * (combo > 1 ? combo : 1)) + heatBonusScore;
      const newScore = s.score + finalMoveScore;
      const newMoves = s.moves + 1;
      const newMerges = s.mergeCount + result.mergeCount;

      // Floating scores
      const floats = result.mergedTiles.map((mt, i) => ({
        id: Date.now() + i,
        value: mt.value,
        row: mt.row,
        col: mt.col,
      }));

      // Play sounds
      S.playSlide();
      if (result.mergeCount > 0) {
        S.playMerge(newHighest);
        S.vibrate(10);
        if (combo > 1) {
          S.playChainChime(combo);
        }
      }

      // Combo toast
      if (combo > 1) {
        const cmsg = s.language === 'fa'
          ? `کمبو ×${combo}`
          : `COMBO ×${combo}`;
        get().addToast('combo', cmsg);
      }

      // Track after undo
      const movesSinceUndo = s.movesSinceUndo + 1;
      const lastUndoHighestTile = s.lastUndoHighestTile;

      // Check new best
      let isNewBest = false;
      const currentBest = s.bestScores[s.mode] ?? 0;
      if (newScore > currentBest) {
        isNewBest = true;
      }

      // Check rank up
      const oldRank = s.rank;
      const newRank = getRank(newHighest);
      if (newRank.name !== oldRank.name) {
        const rankName = s.language === 'fa' ? newRank.nameFa : newRank.name;
        const rmsg = s.language === 'fa'
          ? `ترقی — ${rankName}`
          : `RANK UP — ${rankName}`;
        get().addToast('rankUp', rmsg);
        S.playRankUp();
      }

      set({
        board: result.board,
        score: newScore,
        moves: newMoves,
        mergeCount: newMerges,
        highestTile: newHighest,
        undoSnapshot: snapshot,
        hasWon: s.hasWon || hasWon(result.board, s.winTarget),
        comboCount: combo,
        maxCombo: newMaxCombo,
        heatSegments: newHeat,
        currentCombo: combo,
        floatingScores: floats,
        rank: newRank,
        movesSinceUndo,
        lastUndoHighestTile,
        isAnimating: true,
        heatBonuses: s.heatBonuses + (newHeat === 0 && heatBonusScore > 0 ? 0 : 0),
      });

      // Update best
      if (isNewBest) {
        const pd = loadPersistentData();
        pd.bestScores[s.mode] = newScore;
        savePersistentData(pd);
        set({ bestScores: { ...s.bestScores, [s.mode]: newScore } });
        get().addToast('newBest', s.language === 'fa' ? 'رکورد جدید' : 'NEW BEST');
        S.playNewBest();
      }

      // Update lifetime
      const pd = loadPersistentData();
      pd.lifetime.totalMoves += 1;
      pd.lifetime.totalMerges += result.mergeCount;
      if (newHighest > pd.lifetime.highestTileEver) {
        pd.lifetime.highestTileEver = newHighest;
      }
      savePersistentData(pd);

      // Check achievements
      setTimeout(() => get().checkAchievements(), 50);

      // Announce for accessibility
      if (result.mergeCount > 0) {
        const tileWord = s.language === 'fa' ? 'ترکیب' : 'Merge';
        announce(`${tileWord} ${newHighest}, score ${newScore}`);
      }

      // Check win/loss after animation
      setTimeout(() => {
        set({ isAnimating: false });
        const st = get();
        if (!st.hasWon && hasWon(st.board, st.winTarget)) {
          st.setOverlay('win');
          S.playWin();
          S.vibrate([50, 30, 50, 30, 100]);
          const pd2 = loadPersistentData();
          pd2.lifetime.gamesWon++;
          savePersistentData(pd2);
          get().checkAchievements();
        } else if (!canMove(st.board)) {
          st.endGame();
        }
        autoSave();
      }, 150);
    },

    doUndo: () => {
      const s = get();
      if (!s.undoSnapshot || s.isAnimating) return;

      S.playUndo();
      S.vibrate(8);
      const ht = getHighestTile(s.undoSnapshot.board);
      set({
        board: s.undoSnapshot.board,
        score: s.undoSnapshot.score,
        moves: s.undoSnapshot.moves,
        mergeCount: s.undoSnapshot.mergeCount,
        highestTile: s.undoSnapshot.highestTile,
        heatSegments: s.undoSnapshot.heatSegments,
        undoSnapshot: null,
        undosUsed: s.undosUsed + 1,
        lastUndoHighestTile: ht,
        movesSinceUndo: 0,
        gameOver: false,
        overlay: 'none',
        rank: getRank(s.undoSnapshot.highestTile),
      });
      const msg = s.language === 'fa'
        ? `حرکت بازگشت. امتیاز به ${formatNumber(s.undoSnapshot.score, s.language)}.`
        : `Move undone. Score restored to ${formatNumber(s.undoSnapshot.score, s.language)}.`;
      get().addToast('undo', msg);
      announce(msg);
      autoSave();
    },

    goToStart: () => {
      const { playStartTime, playTime: pt } = get();
      const newPlayTime = pt + (Date.now() - playStartTime) / 1000;
      set({ screen: 'start', overlay: 'none', playTime: newPlayTime });
      autoSave();
    },

    toggleSound: () => {
      const { soundEnabled } = get();
      const newVal = !soundEnabled;
      S.setMuted(!newVal);
      set({ soundEnabled: newVal });
      persistSetting(get, 'sound', newVal);
      if (newVal) S.playUITick();
    },

    setTheme: (t) => {
      set({ themeSetting: t });
      persistSetting(get, 'theme', t);
      get().resolveTheme();
    },

    setLanguage: (l) => {
      set({ language: l });
      persistSetting(get, 'language', l);
    },

    setEffectsQuality: (q) => {
      set({ effectsQuality: q });
      persistSetting(get, 'effectsQuality', q);
    },

    completeOnboarding: () => {
      set({ onboardingDone: true });
      persistSetting(get, 'onboardingDone', true);
    },

    dismissNudge: (action) => {
      const pd = loadPersistentData();
      if (action === 'never') {
        pd.settings.installNudgeNever = true;
        set({ installNudgeNever: true });
      } else {
        pd.settings.installNudgeCount = (pd.settings.installNudgeCount || 0) + 1;
        set({ installNudgeCount: pd.settings.installNudgeCount });
      }
      savePersistentData(pd);
    },

    setInstalled: (v) => {
      set({ isInstalled: v });
      persistSetting(get, 'installed', v);
    },

    resetAllProgress: () => {
      const defaults = defaultPersistentData();
      defaults.settings.language = get().language;
      defaults.settings.theme = get().themeSetting;
      savePersistentData(defaults);
      clearSave();
      set({
        bestScores: defaults.bestScores,
        achievements: defaults.achievements,
        hallOfFame: defaults.hallOfFame,
        lifetime: defaults.lifetime,
        onboardingDone: false,
        installNudgeCount: 0,
        installNudgeNever: false,
        screen: 'start',
        overlay: 'none',
      });
    },

    resolveTheme: () => {
      const { themeSetting } = get();
      let resolved: ThemeMode = 'dark';
      if (themeSetting === 'auto') {
        resolved = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
      } else {
        resolved = themeSetting;
      }
      set({ resolvedTheme: resolved });
    },

    setAnimating: (v) => set({ isAnimating: v }),

    tickPlayTime: () => {
      const { playStartTime, playTime: pt } = get();
      if (get().screen === 'game') {
        set({ playTime: pt + (Date.now() - playStartTime) / 1000, playStartTime: Date.now() });
      }
    },

    checkAchievements: () => {
      const s = get();
      const pd = loadPersistentData();
      const achs = pd.achievements;

      // First Spark
      checkSingleAch(achs, 'first_spark', s.mergeCount > 0);
      // Chain Reaction
      checkSingleAch(achs, 'chain_reaction', s.maxCombo >= 3);
      // Triple Digits
      checkSingleAch(achs, 'triple_digits', s.highestTile >= 128);
      // Half Kilowatt
      checkSingleAch(achs, 'half_kilowatt', s.highestTile >= 512);
      // Neon Master
      checkSingleAch(achs, 'neon_master', s.highestTile >= 2048);
      // Beyond Infinity
      checkSingleAch(achs, 'beyond_infinity', s.highestTile >= 4096);
      // Blitz King
      checkSingleAch(achs, 'blitz_king', s.hasWon && s.mode === 2);
      // Perfectionist
      checkSingleAch(achs, 'perfectionist', s.hasWon && s.mode === 3);
      // Mega Mind
      checkSingleAch(achs, 'mega_mind', s.hasWon && s.mode === 6);
      // Speed Demon
      checkSingleAch(achs, 'speed_demon', s.hasWon && s.mode === 4 && s.moves <= 200);
      // Savior
      checkSingleAch(achs, 'savior', s.movesSinceUndo > 0 && s.movesSinceUndo <= 3 && s.lastUndoHighestTile > 0 && s.highestTile > s.lastUndoHighestTile);
      // Purist
      checkSingleAch(achs, 'purist', s.hasWon && s.undosUsed === 0);
      // Marathoner
      checkSingleAch(achs, 'marathoner', s.moves >= 500);
      // Full Spectrum
      checkSingleAch(achs, 'full_spectrum', getDistinctValues(s.board) >= 7);

      savePersistentData(pd);
      set({ achievements: { ...achs } });
    },

    endGame: () => {
      const s = get();
      set({ gameOver: true, overlay: 'lose' });
      S.playLose();
      S.vibrate(50);

      // Record to Hall of Fame
      const pd = loadPersistentData();
      const hof = pd.hallOfFame[s.mode] || [];
      const entry: HallOfFameEntry = {
        score: s.score,
        moves: s.moves,
        time: Math.round(s.playTime + (Date.now() - s.playStartTime) / 1000),
        date: new Date().toISOString(),
      };
      hof.push(entry);
      hof.sort((a, b) => b.score - a.score);
      pd.hallOfFame[s.mode] = hof.slice(0, 5);
      savePersistentData(pd);
      set({ hallOfFame: { ...s.hallOfFame, [s.mode]: hof.slice(0, 5) } });

      // Check HOF toast
      const pos = hof.findIndex(e => e.date === entry.date);
      if (pos >= 0 && pos < 5) {
        const msg = s.language === 'fa'
          ? `تالار موفقیت — #${pos + 1}`
          : `HALL OF FAME — #${pos + 1}`;
        get().addToast('hallOfFame', msg);
      }

      // Check achievements
      get().checkAchievements();
      clearSave();
    },
  };
});

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

function persistSetting(get: () => GameStore, key: string, value: unknown) {
  const pd = loadPersistentData();
  (pd.settings as Record<string, unknown>)[key] = value;
  savePersistentData(pd);
}

function autoSave() {
  const s = useGameStore.getState();
  if (s.screen !== 'game') return;
  const data: SaveData = {
    board: s.board,
    score: s.score,
    moves: s.moves,
    mergeCount: s.mergeCount,
    highestTile: s.highestTile,
    heatSegments: s.heatSegments,
    mode: s.mode,
    undoSnapshot: s.undoSnapshot,
    playTime: s.playTime + (Date.now() - s.playStartTime) / 1000,
    hasWon: s.hasWon,
    undosUsed: s.undosUsed,
    maxCombo: s.maxCombo,
    heatBonuses: s.heatBonuses,
  };
  saveSave(data);
}

function checkSingleAchievement(get: () => GameStore, id: string): boolean {
  const s = get();
  const ach = s.achievements[id];
  if (!ach || ach.unlocked) return false;
  return false;
}

function checkSingleAch(
  achs: Record<string, { unlocked: boolean; date: string | null }>,
  id: string,
  condition: boolean
) {
  if (!condition) return;
  if (achs[id]?.unlocked) return;
  achs[id] = { unlocked: true, date: new Date().toISOString() };
  const ach = ACHIEVEMENTS.find(a => a.id === id);
  if (ach) {
    const s = useGameStore.getState();
    const name = s.language === 'fa' ? ach.nameFa : ach.name;
    const desc = s.language === 'fa' ? ach.descFa : ach.desc;
    useGameStore.getState().addToast('achievement', `${ach.glyph} ${name}`, desc);
    S.playAchievement();
    S.vibrate([15, 10, 15]);
    announce(`Achievement unlocked: ${name}`);
  }
}

function announce(text: string) {
  if (typeof window === 'undefined') return;
  const el = document.getElementById('sr-announcer');
  if (el) {
    el.textContent = '';
    requestAnimationFrame(() => { el.textContent = text; });
  }
}

// Auto-save on page hide
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) autoSave();
  });
  window.addEventListener('beforeunload', () => {
    autoSave();
  });
  // Listen for theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    useGameStore.getState().resolveTheme();
  });
  // Detect standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    useGameStore.getState().setInstalled(true);
  }
}

export function hasSavedGame(): boolean {
  return loadSave() !== null;
}

export function getSavedGameInfo(): { mode: BoardSize; score: number; highestTile: number; playTime: number } | null {
  const save = loadSave();
  if (!save) return null;
  return {
    mode: save.mode,
    score: save.score,
    highestTile: save.highestTile,
    playTime: save.playTime,
  };
}
