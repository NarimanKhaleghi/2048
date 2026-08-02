// ═══════════════════════════════════════════════════════════════
// NEON 2048 — Type Definitions & Constants
// ═══════════════════════════════════════════════════════════════

export type BoardSize = 2 | 3 | 4 | 5 | 6;

export interface GameMode {
  size: BoardSize;
  name: string;
  nameFa: string;
  winTarget: number;
}

export const GAME_MODES: GameMode[] = [
  { size: 2, name: 'Blitz', nameFa: 'بلیتز', winTarget: 16 },
  { size: 3, name: 'Compact', nameFa: 'کمپکت', winTarget: 256 },
  { size: 4, name: 'Classic', nameFa: 'کلاسیک', winTarget: 2048 },
  { size: 5, name: 'Grand', nameFa: 'گراند', winTarget: 2048 },
  { size: 6, name: 'Mega', nameFa: 'مگا', winTarget: 2048 },
];

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface TileData {
  id: number;
  value: number;
  row: number;
  col: number;
  mergedFrom?: [number, number];
  isNew?: boolean;
}

export interface MoveResult {
  moved: boolean;
  board: (number | null)[][];
  score: number;
  mergeCount: number;
  mergedTiles: { row: number; col: number; value: number }[];
  movements: TileMovement[];
}

export interface TileMovement {
  id: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  merged?: boolean;
  newValue?: number;
}

export type RankName =
  | 'Spark' | 'Glow' | 'Flare' | 'Blaze' | 'Nova'
  | 'Pulsar' | 'Quasar' | 'Supernova' | 'Infinity';

export const RANKS: { minTile: number; name: string; nameFa: string }[] = [
  { minTile: 2, name: 'Spark', nameFa: 'ادراک' },
  { minTile: 4, name: 'Glow', nameFa: 'درخش' },
  { minTile: 8, name: 'Flare', nameFa: 'پرتاب' },
  { minTile: 16, name: 'Blaze', nameFa: 'شعله' },
  { minTile: 32, name: 'Nova', nameFa: 'نوا' },
  { minTile: 64, name: 'Pulsar', nameFa: 'پلسار' },
  { minTile: 128, name: 'Quasar', nameFa: 'کواسار' },
  { minTile: 256, name: 'Supernova', nameFa: 'ابرنووا' },
  { minTile: 512, name: 'Infinity', nameFa: 'بی‌نهایت' },
];

export function getRank(highestTile: number): { name: string; nameFa: string } {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (highestTile >= r.minTile) rank = r;
  }
  return rank;
}

export const TILE_COLORS: Record<number, { bg: string; glow: string; text: string; gradient: string }> = {
  2:    { bg: '#0e4d5e', glow: '#00e5ff', text: '#00e5ff', gradient: 'from-cyan-900 to-cyan-800' },
  4:    { bg: '#0e5e4d', glow: '#00e5a0', text: '#00e5a0', gradient: 'from-emerald-900 to-emerald-800' },
  8:    { bg: '#3d5e0e', glow: '#a0e500', text: '#c6ff00', gradient: 'from-lime-900 to-lime-800' },
  16:   { bg: '#5e4a0e', glow: '#ffab00', text: '#ffd740', gradient: 'from-amber-900 to-amber-800' },
  32:   { bg: '#5e2e0e', glow: '#ff6d00', text: '#ff9e40', gradient: 'from-orange-900 to-orange-800' },
  64:   { bg: '#5e0e3a', glow: '#ff1744', text: '#ff6090', gradient: 'from-pink-900 to-pink-800' },
  128:  { bg: '#4a0e5e', glow: '#e040fb', text: '#ea80fc', gradient: 'from-purple-900 to-purple-800' },
  256:  { bg: '#2e0e5e', glow: '#b388ff', text: '#d1c4e9', gradient: 'from-violet-900 to-violet-800' },
  512:  { bg: '#0e2e5e', glow: '#7c4dff', text: '#b388ff', gradient: 'from-indigo-900 to-indigo-800' },
  1024: { bg: '#0e3d5e', glow: '#448aff', text: '#82b1ff', gradient: 'from-blue-900 to-blue-800' },
  2048: { bg: '#5e4e0e', glow: '#ffd740', text: '#fff9c4', gradient: 'from-yellow-800 to-amber-600' },
};

export function getTileColor(value: number) {
  if (TILE_COLORS[value]) return TILE_COLORS[value];
  return { bg: '#1a1a2e', glow: '#e0e0e0', text: '#ffffff', gradient: 'from-gray-800 to-gray-700' };
}

export interface Achievement {
  id: string;
  name: string;
  nameFa: string;
  desc: string;
  descFa: string;
  glyph: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_spark', name: 'First Spark', nameFa: 'اولین ادراک', desc: 'Merge your first tiles', descFa: 'اولین ترکیب را انجام بدهید', glyph: '✦' },
  { id: 'chain_reaction', name: 'Chain Reaction', nameFa: 'واکنش زنجیره‌ای', desc: '3+ merges in one move', descFa: '۳ ترکیب یا بیشتر در یک حرکت', glyph: '⚡' },
  { id: 'triple_digits', name: 'Triple Digits', nameFa: 'سه رقمی', desc: 'Reach tile 128', descFa: 'به کاچوی ۱۲۸ برسید', glyph: '✶' },
  { id: 'half_kilowatt', name: 'Half Kilowatt', nameFa: 'نیم کیلووات', desc: 'Reach tile 512', descFa: 'به کاچوی ۵۱۲ برسید', glyph: '☄' },
  { id: 'neon_master', name: 'Neon Master', nameFa: 'استاد نئون', desc: 'Reach tile 2048', descFa: 'به کاچوی ۲۰۴۸ برسید', glyph: '★' },
  { id: 'beyond_infinity', name: 'Beyond Infinity', nameFa: 'فراتر از بی‌نهایت', desc: 'Reach tile 4096', descFa: 'به کاچوی ۴۰۹۶ برسید', glyph: '✷' },
  { id: 'blitz_king', name: 'Blitz King', nameFa: 'پادشاه بلیتز', desc: 'Win on 2×2', descFa: 'برد در بورد ۲×۲', glyph: '♔' },
  { id: 'perfectionist', name: 'Perfectionist', nameFa: 'کمال‌گرا', desc: 'Win on 3×3', descFa: 'برد در بورد ۳×۳', glyph: '♕' },
  { id: 'mega_mind', name: 'Mega Mind', nameFa: 'ذهن مگا', desc: 'Win on 6×6', descFa: 'برد در بورد ۶×۶', glyph: '♚' },
  { id: 'speed_demon', name: 'Speed Demon', nameFa: 'اعجازه سرعت', desc: 'Win 4×4 in 200 moves or fewer', descFa: 'برد در بورد ۴×۴ در ۲۰۰ حرکت یا کمتر', glyph: '⚡' },
  { id: 'savior', name: 'Savior', nameFa: 'nجات‌دهنده', desc: 'New highest tile within 3 moves after undo', descFa: 'کاچوی جدید در ۳ حرکت پس از بازگشت', glyph: '✝' },
  { id: 'purist', name: 'Purist', nameFa: 'پاک‌گرا', desc: 'Win with zero undos', descFa: 'برد بدون هیچ بازگشتی', glyph: '✵' },
  { id: 'marathoner', name: 'Marathoner', nameFa: 'دوماراتون‌چی', desc: 'Play 500 moves in a single run', descFa: '۵۰۰ حرکت در یک بازی', glyph: '☆' },
  { id: 'full_spectrum', name: 'Full Spectrum', nameFa: 'طیف کامل', desc: '7+ distinct tile values on board at once', descFa: '۷ مقدار مختلف همزمان روی بورد', glyph: '✱' },
  { id: 'overheated', name: 'Overheated', nameFa: 'داغ شده', desc: 'Trigger a heat bonus', descFa: 'جایزه دما را فعال کنید', glyph: '☀' },
];

export interface HallOfFameEntry {
  score: number;
  moves: number;
  time: number;
  date: string;
}

export interface SaveData {
  board: (number | null)[][];
  score: number;
  moves: number;
  mergeCount: number;
  highestTile: number;
  heatSegments: number;
  mode: BoardSize;
  undoSnapshot: {
    board: (number | null)[][];
    score: number;
    moves: number;
    mergeCount: number;
    highestTile: number;
    heatSegments: number;
  } | null;
  playTime: number;
  hasWon: boolean;
  undosUsed: number;
  maxCombo: number;
  heatBonuses: number;
}

export interface PersistentData {
  bestScores: Partial<Record<BoardSize, number>>;
  achievements: Record<string, { unlocked: boolean; date: string | null }>;
  hallOfFame: Partial<Record<BoardSize, HallOfFameEntry[]>>;
  settings: {
    sound: boolean;
    effectsQuality: 'high' | 'low';
    theme: 'dark' | 'light' | 'auto';
    language: 'en' | 'fa';
    lastBoardSize: BoardSize;
    onboardingDone: boolean;
    installNudgeCount: number;
    installNudgeNever: boolean;
    installed: boolean;
  };
  lifetime: {
    gamesPlayed: number;
    gamesWon: number;
    totalMoves: number;
    totalMerges: number;
    highestTileEver: number;
  };
}

export type ThemeMode = 'dark' | 'light';
export type Language = 'en' | 'fa';

export const RANK_NAMES_FA: Record<string, string> = {
  Spark: 'ادراک',
  Glow: 'درخش',
  Flare: 'پرتاب',
  Blaze: 'شعله',
  Nova: 'نوا',
  Pulsar: 'پلسار',
  Quasar: 'کواسار',
  Supernova: 'ابرنووا',
  Infinity: 'بی‌نهایت',
};
