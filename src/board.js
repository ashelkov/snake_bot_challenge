import { getBoardSize } from './utils';
import { ELEMENT } from './constants';

// RED ZONES: DEADLOCKS

export function getLevelDeadlocks(board) {
  const boardSize = getBoardSize(board);
  const deadlocks = [];

  let isDeadlockAdded;

  do {
    isDeadlockAdded = false;

    for (var i = 0; i < board.length; i++) {
      if (deadlocks.includes(i)) continue;
      if (board[i] === ELEMENT.WALL || board[i] === ELEMENT.START_FLOOR) continue;

      let count = 0;
      [i + 1, i - 1, i + boardSize, i - boardSize].forEach((index) => {
        const e = board[index];
        if (e === ELEMENT.WALL || e === ELEMENT.START_FLOOR || deadlocks.includes(index)) {
          count++;
        }
      });

      if (count > 2) {
        deadlocks.push(i);
        isDeadlockAdded = true;
      }
    }
  } while (isDeadlockAdded);

  return deadlocks;
}

// YELLOW ZONES: PENALTIES

export function getLevelPenalties(board, deadlocks = []) {
  const boardSize = getBoardSize(board);
  const penalties = [];

  let isPenaltyAdded;

  do {
    isPenaltyAdded = false;

    for (var i = 0; i < board.length; i++) {
      const x = i % boardSize;
      const y = (i - x) / boardSize;

      if (x < 5 || x > boardSize - 5 || y < 5 || y > boardSize - 5) continue;
      if (penalties.includes(i)) continue;
      if (deadlocks.includes(i)) continue;
      if (board[i] === ELEMENT.WALL || board[i] === ELEMENT.START_FLOOR) continue;

      let count = 0;
      [i + 1, i - 1, i + boardSize, i - boardSize].forEach((index) => {
        const e = board[index];
        if (e === ELEMENT.WALL || e === ELEMENT.START_FLOOR || penalties.includes(index) || deadlocks.includes(index)) {
          count++;
        }
      });

      if (count > 1) {
        penalties.push(i);
        isPenaltyAdded = true;
      }
    }
  } while (isPenaltyAdded);

  return penalties;
}
