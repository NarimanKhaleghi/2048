// ═══════════════════════════════════════════════════════════════
// NEON 2048 — Internationalization (EN / FA)
// ═══════════════════════════════════════════════════════════════

import type { Language } from './types';

export interface Strings {
  installPill: string;
  startGame: string;
  continue: string;
  discard: string;
  discardConfirm: string;
  score: string;
  best: string;
  goal: string;
  tagline: string;
  tour1Title: string;
  tour1Body: string;
  tour2Title: string;
  tour2Body: string;
  tour3Title: string;
  tour3Body: string;
  tour4Title: string;
  tour4Body: string;
  winTitle: string;
  loseTitle: string;
  undoRescue: string;
  endless: string;
  newGame: string;
  changeMode: string;
  tryAgain: string;
  offlineToast: string;
  restoredToast: string;
  onlineToast: string;
  nudge: string;
  nudgeInstall: string;
  nudgeLater: string;
  nudgeNever: string;
  installedToast: string;
  runningAsApp: string;
  newBest: string;
  combo: string;
  overheat: string;
  hallOfFame: string;
  rankUp: string;
  undoDone: string;
  privateMode: string;
  performanceMode: string;
  switchLight: string;
  switchDark: string;
  autoTheme: string;
  github: string;
  githubLabel: string;
  howToPlay: string;
  achievements: string;
  hallOfFameTitle: string;
  settings: string;
  sound: string;
  effects: string;
  effectsHigh: string;
  effectsLow: string;
  language: string;
  resetProgress: string;
  resetConfirm: string;
  resetDone: string;
  skip: string;
  startPlaying: string;
  stepOf: string;
  moves: string;
  merges: string;
  time: string;
  maxCombo: string;
  undosUsed: string;
  heatBonuses: string;
  locked: string;
  unlocked: string;
  noEntry: string;
  vsBest: string;
  rules: string;
  rulesBody: string;
  controls: string;
  controlsBody: string;
  scoring: string;
  scoringBody: string;
  undoRule: string;
  undoRuleBody: string;
  modes: string;
  shortcuts: string;
  shortcutsBody: string;
  noSaves: string;
  resumeInfo: string;
  modeChips: string[];
  rankNames: Record<string, string>;
  achievementUnlocked: string;
  gameStats: string;
  fullStats: string;
  swipeToLearn: string;
  keyboardToLearn: string;
}

const en: Strings = {
  installPill: 'Install App',
  startGame: 'Start Game',
  continue: 'Continue',
  discard: 'Discard & New Game',
  discardConfirm: 'Tap again to confirm',
  score: 'SCORE',
  best: 'BEST',
  goal: 'GOAL {n}',
  tagline: 'MERGE \u00B7 GLOW \u00B7 ASCEND',
  tour1Title: 'Welcome to Neon 2048',
  tour1Body: 'Slide tiles to merge matching numbers. Reach the goal tile to win!',
  tour2Title: 'Install it \u2014 make it yours',
  tour2Body: 'Add it to your home screen for a fullscreen app experience.',
  tour3Title: 'Plays anywhere. Even nowhere.',
  tour3Body: 'After the first visit, the entire game works offline.',
  tour4Title: 'Sharpen your run',
  tour4Body: 'Use undo, build combos, fill the heat meter. Choose your board size!',
  winTitle: 'NEON MASTER!',
  loseTitle: 'GAME OVER',
  undoRescue: 'Undo Rescue',
  endless: 'Continue \u2014 Endless',
  newGame: 'New Game',
  changeMode: 'Change Mode',
  tryAgain: 'Try Again',
  offlineToast: 'Offline \u2014 full game still available \u2713',
  restoredToast: 'Progress restored \u2713',
  onlineToast: 'Back online \u2713',
  nudge: 'Enjoying Neon 2048? Install it \u2014 plays 100% offline \u26A1',
  nudgeInstall: 'Install',
  nudgeLater: 'Later',
  nudgeNever: 'Never',
  installedToast: 'Installed! Launch it from your home screen \u2713',
  runningAsApp: 'Running as an app \u2713',
  newBest: 'NEW BEST',
  combo: 'COMBO \u00D7{n}',
  overheat: 'OVERHEAT! +{n}',
  hallOfFame: 'HALL OF FAME \u2014 #{n}',
  rankUp: 'RANK UP \u2014 {rank}',
  undoDone: 'Move undone. Score restored to {n}.',
  privateMode: 'Private browsing \u2014 progress won\'t persist',
  performanceMode: 'Performance mode enabled',
  switchLight: 'Switch to light theme',
  switchDark: 'Switch to dark theme',
  autoTheme: 'Auto (follow system)',
  github: 'Source on GitHub',
  githubLabel: 'View source code on GitHub',
  howToPlay: 'How to Play',
  achievements: 'Achievements',
  hallOfFameTitle: 'Hall of Fame',
  settings: 'Settings',
  sound: 'Sound',
  effects: 'Effects',
  effectsHigh: 'High',
  effectsLow: 'Low',
  language: 'Language',
  resetProgress: 'Reset all progress',
  resetConfirm: 'Tap again to confirm reset',
  resetDone: 'All progress has been reset',
  skip: 'Skip',
  startPlaying: 'Start Playing',
  stepOf: '{current} of {total}',
  moves: 'Moves',
  merges: 'Merges',
  time: 'Time',
  maxCombo: 'Max Combo',
  undosUsed: 'Undos Used',
  heatBonuses: 'Heat Bonuses',
  locked: 'Locked',
  unlocked: 'Unlocked',
  noEntry: 'No entries yet',
  vsBest: 'vs Best: {n}',
  rules: 'Rules',
  rulesBody: 'Swipe or use arrow keys to slide all tiles. When two tiles with the same number collide, they merge into one tile with double the value. After each move, a new tile (90% chance of 2, 10% chance of 4) appears in a random empty cell. Reach the goal tile to win!',
  controls: 'Controls',
  controlsBody: 'Mobile: Swipe in any direction on the board. Desktop: Arrow keys or WASD. Press Esc to close any overlay.',
  scoring: 'Scoring',
  scoringBody: 'Each merge adds the merged tile\'s value to your score. Multiple merges in one move trigger a combo multiplier (\u00D72, \u00D73, ...). Consecutive merging moves fill the heat meter \u2014 a full meter pays a 5\u00D7 highest-tile bonus!',
  undoRule: 'Undo',
  undoRuleBody: 'You can undo exactly one move. After using it, the button disables until your next successful move. Undo is free, unlimited in frequency, and also available as a \"Rescue\" on the Game Over screen.',
  modes: 'Board Modes',
  shortcuts: 'Keyboard Shortcuts',
  shortcutsBody: 'Arrow Keys / WASD: Move tiles | Esc: Close overlay | U: Undo',
  noSaves: 'No saved game',
  resumeInfo: 'Board {size} \u00B7 Score {score}',
  modeChips: ['2\u00D72 Blitz', '3\u00D73 Compact', '4\u00D74 Classic', '5\u00D75 Grand', '6\u00D76 Mega'],
  rankNames: {
    Spark: 'Spark', Glow: 'Glow', Flare: 'Flare', Blaze: 'Blaze',
    Nova: 'Nova', Pulsar: 'Pulsar', Quasar: 'Quasar',
    Supernova: 'Supernova', Infinity: 'Infinity',
  },
  achievementUnlocked: 'Achievement Unlocked!',
  gameStats: 'Game Stats',
  fullStats: 'Full Stats',
  swipeToLearn: 'Swipe or use arrow keys to play',
  keyboardToLearn: 'Arrow keys or WASD',
};

const fa: Strings = {
  installPill: 'نصب اپلیکیشن',
  startGame: 'شروع بازی',
  continue: 'ادامه',
  discard: 'انداکردن و بازی جدید',
  discardConfirm: 'برای تأیید دوباره بزنید',
  score: 'امتیاز',
  best: 'بهترین',
  goal: 'هدف {n}',
  tagline: 'ترکیب \u00B7 درخش \u00B7 صعود',
  tour1Title: 'به نئون ۲۰۴۸ خوش آمدید',
  tour1Body: 'کاچوها را بسلید تا اعداد یکسان را ترکیب کنید. به کاچوی هدف برسید تا ببرید!',
  tour2Title: 'نصب کنید \u2014 مال خودتان کنید',
  tour2Body: 'به صفحه اصلی افزوده تجربه اپلیکیشن تمام‌صفحه را داشته باشید.',
  tour3Title: 'هرجا بازی کنید. حتی بدون اینترنت.',
  tour3Body: 'پس از اولین بازدید، کل بازی آفلاین کار می‌کند.',
  tour4Title: 'بازیتان را تقویت کنید',
  tour4Body: 'از بازگشت، کمبو و اندازه گرما استفاده کنید. اندازه بورد را انتخاب کنید!',
  winTitle: 'استاد نئون!',
  loseTitle: 'بازی تمام شد',
  undoRescue: 'نجات با بازگشت',
  endless: 'ادامه \u2014 بی‌پایان',
  newGame: 'بازی جدید',
  changeMode: 'تغییر حالت',
  tryAgain: 'تلاش دوباره',
  offlineToast: 'آفلاین \u2014 بازی کامل فعال \u2713',
  restoredToast: 'پیشرفت بازیابی شد \u2713',
  onlineToast: 'دوباره آنلاین \u2713',
  nudge: 'نئون ۲۰۴۸ را دوست دارید؟ نصبش کنید \u2014 کاملا\u064B آفلاین \u26A1',
  nudgeInstall: 'نصب',
  nudgeLater: 'بعدا\u064B',
  nudgeNever: 'هرگز',
  installedToast: 'نصب شد! از صفحه اصلی بازش کنید \u2713',
  runningAsApp: 'در حال اجرا به عنوان اپلیکیشن \u2713',
  newBest: 'رکورد جدید',
  combo: 'کمبو \u00D7{n}',
  overheat: 'داغ شده! +{n}',
  hallOfFame: 'تالار موفقیت \u2014 #{n}',
  rankUp: 'ترقی \u2014 {rank}',
  undoDone: 'حرکت بازگشت. امتیاز به {n} بازگشت.',
  privateMode: 'حالت خصوصی \u2014 پیشرفت ذخیره نمی\u0634ود',
  performanceMode: 'حالت عملکرد فعال شد',
  switchLight: 'تغییر به پوسته روزانه',
  switchDark: 'تغییر به پوسته تاریک',
  autoTheme: 'خودکار (مطابق سیستم)',
  github: 'کد منبع در گیتهاب',
  githubLabel: 'مشاهده کد منبع در گیتهاب',
  howToPlay: 'راهنمای بازی',
  achievements: 'دستاوردها',
  hallOfFameTitle: 'تالار موفقیت',
  settings: 'تنظیمات',
  sound: 'صدا',
  effects: 'تأثیرات',
  effectsHigh: 'بالا',
  effectsLow: 'پایین',
  language: 'زبان',
  resetProgress: 'بازنشانی کل پیشرفت',
  resetConfirm: 'برای تأیید دوباره بزنید',
  resetDone: 'همه پیشرفت بازنشانی شد',
  skip: 'رد شد',
  startPlaying: 'شروع بازی',
  stepOf: '{current} از {total}',
  moves: 'حرکات',
  merges: 'ترکیب‌ها',
  time: 'زمان',
  maxCombo: 'بیشترین کمبو',
  undosUsed: 'بازگشت‌ها',
  heatBonuses: 'جایزه دما',
  locked: 'قفل',
  unlocked: 'باز',
  noEntry: 'هیچ موردی وجود ندارد',
  vsBest: 'نسبت به بهترین: {n}',
  rules: 'قواعد',
  rulesBody: 'بسلید یا کلیدهای فلش را برای جابه‌جایی کاچوها استفاده کنید. وقتی دو کاچو هم‌عدد برخورد کنند، به یک کاچو با مقدار دوبرابر ترکیب می‌شوند. پس از هر حرکت، یک کاچوی جدید (۹۰\% احتمال ۲، ۱۰\% احتمال ۴) ظاهر می‌شود.',
  controls: 'کنترل‌ها',
  controlsBody: 'موبایل: در بورد بسلید. دکستاپ: کلیدهای فلش یا WASD. Esc برای بستن هر لایه.',
  scoring: 'امتیازدهی',
  scoringBody: 'هر ترکیب مقدار کاچوی جدید را به امتیاز اضافه می‌کند. ترکیب‌های چندگانه کمبو ایجاد می‌کنند. حرکات متوالی با ترکیب، اندازه گرما را پر می‌کنند \u2014 اندازه کامل جایزه ۵\u00D7 بالاترین کاچو اعطا می‌کند!',
  undoRule: 'بازگشت',
  undoRuleBody: 'می‌توانید دقیقا\u064B یک حرکت را بازگردانید. پس از استفاده، تا حرکت موفق بعدی غیرفعال می‌شود. بازگشت رایگان و بدون محدودیت است.',
  modes: 'حالت‌های بورد',
  shortcuts: 'میانبرهای کلیدی',
  shortcutsBody: 'کلیدهای فلش / WASD: جابه‌جایی | Esc: بستن لایه | U: بازگشت',
  noSaves: 'بازی ذخیره‌ای وجود ندارد',
  resumeInfo: 'بورد {size} \u00B7 امتیاز {score}',
  modeChips: ['۲\u00D7۲ بلیتز', '۳\u00D7۳ کمپکت', '۴\u00D7۴ کلاسیک', '۵\u00D7۵ گراند', '۶\u00D7۶ مگا'],
  rankNames: {
    Spark: 'ادراک', Glow: 'درخش', Flare: 'پرتاب', Blaze: 'شعله',
    Nova: 'نوا', Pulsar: 'پلسار', Quasar: 'کواسار',
    Supernova: 'ابرنوا', Infinity: 'بی‌نهایت',
  },
  achievementUnlocked: 'دستاورد باز شد!',
  gameStats: 'آمار بازی',
  fullStats: 'آمار کامل',
  swipeToLearn: 'بسلید یا کلیدهای فلش برای بازی',
  keyboardToLearn: 'کلیدهای فلش یا WASD',
};

const strings: Record<Language, Strings> = { en, fa };

export function t(lang: Language): Strings {
  return strings[lang] || strings.en;
}

export function toPersianDigits(n: number): string {
  const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  return n.toString().replace(/\d/g, d => faDigits[parseInt(d)]);
}
