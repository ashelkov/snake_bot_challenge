import { ELEMENT } from './constants';
import { getHeadPosition, getBoardSize, getXYByPosition } from './utils';

let snakeTargetPath = [];
let penalty = []; // LETS STORE INDEXES HERE
let currentTarget = {};

export function getNextTarget(board) {
  const head = getHeadPosition(board);
  const boardSize = getBoardSize(board);
  const snakeSize = getSnakeSize(board);
  const values = [];

  for (var i = 0; i < board.length; i++) {
    const position = getXYByPosition(board, i);
    const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);

    if (penalty.includes(JSON.stringify(position))) continue;

    if (board[i] === ELEMENT.APPLE) {
      values.push({
        index: i,
        type: 'APPLE',
        position,
        distance,
        score: -distance,
      });
    }

    if (board[i] === ELEMENT.GOLD) {
      values.push({
        index: i,
        type: 'GOLD',
        position,
        distance,
        score: -distance + 10,
      });
    }

    if (board[i] === ELEMENT.STONE) {
      const modifier = snakeSize > 5 ? (snakeSize - 5) * 3 : -100;
      values.push({
        index: i,
        type: 'STONE',
        position,
        distance,
        score: -distance + modifier,
      });
    }
  }

  const next = values.sort((a, b) => b.score - a.score)[0];
  processTargetPath(next);
  // processPenalties();

  return next;
}

export function getSnakeSize(board) {
  const bodyParts = [
    ELEMENT.BODY_HORIZONTAL,
    ELEMENT.BODY_VERTICAL,
    ELEMENT.BODY_LEFT_DOWN,
    ELEMENT.BODY_LEFT_UP,
    ELEMENT.BODY_RIGHT_DOWN,
    ELEMENT.BODY_RIGHT_UP,
  ];
  let size = 2; // HEAD & TAIL
  for (var i = 0; i < board.length; i++) {
    if (bodyParts.includes(board[i])) size++;
  }
  return size;
}

export function processTargetPath(nextTarget) {
  const nextKey = JSON.stringify(nextTarget.position);
  if (nextKey === JSON.stringify(currentTarget.position)) {
    if (snakeTargetPath.includes(nextKey)) {
      penalty.push(nextKey);
    } else {
      snakeTargetPath.push(nextKey);
    }
  } else {
    snakeTargetPath = [nextKey];
    currentTarget = nextTarget;
  }
}
