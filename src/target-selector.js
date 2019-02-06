// TODO: keep moving forward if raitings are equal
// TODO: eval pseudo walls on round start
// TODO: penalty paths on repeat - not targets

import { ELEMENT } from './constants';
import { getHeadPosition, getBoardSize, getSnakeSize, getXYByPosition, isSnakeOnFury, countWallsAround } from './utils';

let snakePath = [];
let penalties = {};
let prevTargetIndex;
let turn = 0;

export function getNextTarget(board, logger) {
  const head = getHeadPosition(board);

  const snakeSize = getSnakeSize(board);
  const isUnderFury = isSnakeOnFury(board);

  const targets = [];

  for (var i = 0; i < board.length; i++) {
    const position = getXYByPosition(board, i);
    const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);
    const wallsAround = countWallsAround(board, position.x, position.y);

    const addTarget = (type, value) => {
      const penalty = (penalties[i] || 0) * 3;
      const wallPenalty = wallsAround * 5;
      targets.push({
        index: i,
        type,
        position,
        distance,
        score: value - distance - penalty - wallPenalty,
      });
    };

    if (board[i] === ELEMENT.APPLE) {
      addTarget('APPLE', 3);
    }

    if (board[i] === ELEMENT.GOLD) {
      addTarget('GOLD', 10);
    }

    if (board[i] === ELEMENT.STONE) {
      const canEatStone = snakeSize > 4 || isUnderFury;
      if (canEatStone) {
        addTarget('STONE', isUnderFury ? 25 : 10);
      }
    }

    if (board[i] === ELEMENT.FLYING_PILL) {
      addTarget('FLYING_PILL', 1);
    }

    if (board[i] === ELEMENT.FURY_PILL) {
      addTarget('FURY_PILL', 25);
    }
  }

  const nextTarget = targets.sort((a, b) => b.score - a.score)[0];

  // processors
  processSnakePath(board, nextTarget);
  turn++;

  // loggers
  logger('Turn:' + JSON.stringify(turn));
  logger('Penalties:' + JSON.stringify(penalties));

  return nextTarget;
}

function processSnakePath(board, nextTarget = { index: 0 }) {
  const boardSize = getBoardSize(board);
  const headPosition = getHeadPosition(board);

  const headIndex = headPosition.y * boardSize + headPosition.x;
  const isTargetTheSame = nextTarget.index === prevTargetIndex;

  if (isTargetTheSame) {
    if (snakePath.includes(headIndex)) {
      penalties[nextTarget.index] = (penalties[nextTarget.index] || 0) + 1;
    } else {
      snakePath.push(headIndex);
    }
  } else {
    snakePath = [headIndex];
    prevTargetIndex = nextTarget.index;
  }
}

export function resetGameData() {
  penalties = {};
  snakePath = [];
  prevTargetIndex = null;
  turn = 0;
}
