// ═══════════════════════════════════════════════════════════════
// NEON 2048 — Core Game Engine
// ═══════════════════════════════════════════════════════════════

import { BoardSize, Direction, MoveResult, TileMovement } from './types';

let tileIdCounter = 0;

export function createEmptyBoard(size: BoardSize): (number | null)[][] {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function cloneBoard(board: (number | null)[][]): (number | null)[][] {
  return board.map(row => [...row]);
}

export function getEmptyCells(board: (number | null)[][]): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (board[r][c] === null) cells.push([r, c]);
    }
  }
  return cells;
}

export function spawnTile(board: (number | null)[][]): { row: number; col: number; value: number } | null {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return null;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  board[row][col] = value;
  return { row, col, value };
}

export function getHighestTile(board: (number | null)[][]): number {
  let max = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null && cell > max) max = cell;
    }
  }
  return max;
}

function slideLine(line: (number | null)[], dir: 1 | -1): {
  result: (number | null)[];
  score: number;
  mergeCount: number;
  movements: TileMovement[];
} {
  // Normalize: always slide toward index 0
  const reversed = dir === -1;
  const working = reversed ? [...line].reverse() : [...line];
  const len = working.length;

  // Track movement origins
  const origins: (number | null)[] = working.map((v, i) => v !== null ? i : null);

  // Remove nulls
  const filtered: { value: number; origIdx: number }[] = [];
  for (let i = 0; i < len; i++) {
    if (working[i] !== null) {
      filtered.push({ value: working[i]!, origIdx: origins[i]! });
    }
  }

  // Merge
  const merged: { value: number; merged: boolean; origIndices: number[] }[] = [];
  let score = 0;
  let mergeCount = 0;
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i].value === filtered[i + 1].value) {
      const newVal = filtered[i].value * 2;
      merged.push({
        value: newVal,
        merged: true,
        origIndices: [filtered[i].origIdx, filtered[i + 1].origIdx],
      });
      score += newVal;
      mergeCount++;
      i += 2;
    } else {
      merged.push({
        value: filtered[i].value,
        merged: false,
        origIndices: [filtered[i].origIdx],
      });
      i++;
    }
  }

  // Build result line
  const result: (number | null)[] = Array(len).fill(null);
  const movements: TileMovement[] = [];

  for (let j = 0; j < merged.length; j++) {
    const destIdx = reversed ? (len - 1 - j) : j;
    result[destIdx] = merged[j].value;

    if (merged[j].merged) {
      const id1 = ++tileIdCounter;
      const id2 = ++tileIdCounter;
      const destOrig1 = reversed ? (len - 1 - merged[j].origIndices[0]) : merged[j].origIndices[0];
      const destOrig2 = reversed ? (len - 1 - merged[j].origIndices[1]) : merged[j].origIndices[1];
      movements.push({
        id: id1, fromRow: 0, fromCol: destOrig1, toRow: 0, toCol: destIdx,
      });
      movements.push({
        id: id2, fromRow: 0, fromCol: destOrig2, toRow: 0, toCol: destIdx,
        merged: true, newValue: merged[j].value,
      });
    } else {
      const id = ++tileIdCounter;
      const destOrig = reversed ? (len - 1 - merged[j].origIndices[0]) : merged[j].origIndices[0];
      if (destOrig !== destIdx) {
        movements.push({
          id, fromRow: 0, fromCol: destOrig, toRow: 0, toCol: destIdx,
        });
      }
    }
  }

  return { result, score, mergeCount, movements };
}

export function move(
  board: (number | null)[][],
  direction: Direction,
): MoveResult {
  const size = board.length;
  const newBoard = cloneBoard(board);
  let totalScore = 0;
  let totalMergeCount = 0;
  const mergedTiles: { row: number; col: number; value: number }[] = [];
  const allMovements: TileMovement[] = [];
  let moved = false;

  const isHorizontal = direction === 'left' || direction === 'right';
  const dir: 1 | -1 = (direction === 'left' || direction === 'up') ? 1 : -1;

  for (let i = 0; i < size; i++) {
    const line = isHorizontal
      ? newBoard[i].map(v => v)
      : newBoard.map(row => row[i]);

    const { result, score, mergeCount, movements } = slideLine(line, dir);

    totalScore += score;
    totalMergeCount += mergeCount;

    // Check if anything changed
    for (let j = 0; j < size; j++) {
      const oldVal = isHorizontal ? board[i][j] : board[j][i];
      const newVal = result[j];
      if (oldVal !== newVal) moved = true;
    }

    // Track merged tiles
    if (isHorizontal) {
      for (let j = 0; j < size; j++) {
        newBoard[i][j] = result[j];
      }
    } else {
      for (let j = 0; j < size; j++) {
        newBoard[j][i] = result[j];
      }
    }

    // Remap movements to board coordinates
    for (const m of movements) {
      if (isHorizontal) {
        allMovements.push({
          ...m,
          fromRow: i, fromCol: m.fromCol,
          toRow: i, toCol: m.toCol,
        });
      } else {
        allMovements.push({
          ...m,
          fromRow: m.fromCol, fromCol: i,
          toRow: m.toCol, toCol: i,
        });
      }
    }

    // Track merge positions
    for (const m of movements) {
      if (m.merged && m.newValue) {
        const row = isHorizontal ? i : m.toCol;
        const col = isHorizontal ? m.toCol : i;
        mergedTiles.push({ row, col, value: m.newValue });
      }
    }
  }

  return {
    moved,
    board: newBoard,
    score: totalScore,
    mergeCount: totalMergeCount,
    mergedTiles,
    movements: allMovements,
  };
}

export function canMove(board: (number | null)[][]): boolean {
  // Check if any empty cells
  if (getEmptyCells(board).length > 0) return true;

  // Check if any adjacent cells can merge
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const val = board[r][c];
      if (c + 1 < size && val === board[r][c + 1]) return true;
      if (r + 1 < size && val === board[r + 1][c]) return true;
    }
  }
  return false;
}

export function hasWon(board: (number | null)[][], target: number): boolean {
  return getHighestTile(board) >= target;
}

export function getDistinctValues(board: (number | null)[][]): number {
  const set = new Set<number>();
  for (const row of board) {
    for (const cell of row) {
      if (cell !== null) set.add(cell);
    }
  }
  return set.size;
}

export function formatNumber(n: number, locale: 'en' | 'fa'): string {
  if (locale === 'fa') {
    const faDigits = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
    return n.toString().replace(/\d/g, d => faDigits[parseInt(d)]);
  }
  return n.toLocaleString('en-US');
}
