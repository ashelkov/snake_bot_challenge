import { getBoardSize, countWallsAround } from './utils';
import { ELEMENT } from './constants';

export function detectLevelDeadlocks(board) {
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
      const y = (i - i % size) / size;

      if (countWallsAround(maskedBoard, x, y) > 2) {
        deadlocks[i] = ELEMENT.WALL;
        isDeadlockAdded = true;
      }
    }
  } while (isDeadlockAdded);

  return deadlocks;
}
