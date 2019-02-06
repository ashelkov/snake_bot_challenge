// TODO: fury dance to make more points
// TODO: keep moving forward if raitings are equal
// TODO: dont move into squares with 2/3 surround walls

import { ELEMENT } from './constants';
import { getHeadPosition, getBoardSize, getSnakeSize, getXYByPosition } from './utils';

let snakePath = [];
let penalties = {};
let prevTargetIndex;
let turn = 0;

export function getNextTarget(board, logger) {
  const head = getHeadPosition(board);
  const snakeSize = getSnakeSize(board);

  const values = [];

  for (var i = 0; i < board.length; i++) {
    const position = getXYByPosition(board, i);
    const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);

    const addValue = (type, value) => {
      const penalty = (penalties[i] || 0) * 3;
      values.push({
        index: i,
        type,
        position,
        distance,
        score: -distance + value - penalty,
      });
    };

    if (board[i] === ELEMENT.APPLE) {
      addValue('APPLE', 3);
    }

    if (board[i] === ELEMENT.GOLD) {
      addValue('GOLD', 10);
    }

    if (board[i] === ELEMENT.STONE) {
      if (snakeSize > 4) {
        addValue('STONE', 5);
      }
    }

    if (board[i] === ELEMENT.FLYING_PILL) {
      addValue('FLYING_PILL', 7);
    }

    if (board[i] === ELEMENT.FURY_PILL) {
      addValue('FURY_PILL', 20);
    }
  }

  const nextTarget = values.sort((a, b) => b.score - a.score)[0];

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
