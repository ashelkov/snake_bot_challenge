import { getBoardSize, countWallsAround } from './utils';
import { ELEMENT } from './constants';

// RED ZONES: DEADLOCKS

export function getLevelDeadlocks(board) {
  const size = getBoardSize(board);
  const deadlocks = {};

  let isDeadlockAdded;
  let maskedBoard = [];

  do {
    isDeadlockAdded = false;
    maskedBoard = Object.assign(board.split(''), deadlocks);

    for (var i = 0; i < maskedBoard.length; i++) {
      if (maskedBoard[i] === ELEMENT.WALL) continue;
      const x = i % size;
      const y = (i - (i % size)) / size;

      if (countWallsAround(maskedBoard, x, y) > 2) {
        deadlocks[i] = ELEMENT.WALL;
        isDeadlockAdded = true;
      }
    }
  } while (isDeadlockAdded);

  return deadlocks;
}

// YELLOW ZONES: POCKETS

export function getLevelPockets(board) {
  const isEpamLevel = [61, 241, 262, 311, 322, 421, 552, 564, 601, 781].every(
    (i) => board[i] === ELEMENT.START_FLOOR || board[i] === ELEMENT.ENEMY_HEAD_SLEEP || board[i] === ELEMENT.HEAD_SLEEP,
  );
  if (isEpamLevel) {
    return [
      ...[218, 219, 220, 221, 250, 251, 278, 279, 280, 281], // E
      ...[289, 290, 291, 349, 350, 351, 352, 379, 380, 381, 382], // P
      ...[520, 521, 579, 580, 581, 609, 610, 611], // A
      ...[560, 561, 562, 589, 591, 593, 619, 620, 622, 623, 649, 650, 651, 652, 653, 679, 680, 681, 682, 683], // M
    ];
  }

  return [];
}
