// TODO: calc snake length (own/enemy)
// TODO: prevent head-crash with bigger/fury snake
// TODO: hunt smaller enemies

import { ELEMENT } from './constants';
import { getHeadPosition, getBoardSize, getSnakeSize, getXYByPosition, isSnakeOnFury } from './utils';

let turn = 0;
let prevTarget = {};
let snakePath = [];
let furyMovesLeft = 0;

// PREPROCESS TICK

export function preprocessTick(board, logger) {
  const headIndex = getHeadIndex(board);
  snakePath.push(headIndex);

  if (headIndex === prevTarget.index) {
    onTargetEat(prevTarget);
  }

  logger('Turn:' + turn++);
  logger('Path:' + JSON.stringify(snakePath));

  if (isSnakeOnFury(board)) {
    furyMovesLeft--;
  }
}

// TARGET EVENTS

function onTargetEat(target) {
  if (target.type === 'FURY_PILL') {
    furyMovesLeft += 10;
  }
}

function onTargetChange(nextTarget) {
  snakePath = [];
}

// TARGET SELECTOR

export function getNextTarget(board) {
  const head = getHeadPosition(board);
  const snakeSize = getSnakeSize(board);
  const furyMovesLeft = getFuryMovesLeft();
  const targets = [];

  for (var i = 0; i < board.length; i++) {
    const position = getXYByPosition(board, i);
    const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);
    const canCatchOnFury = furyMovesLeft && furyMovesLeft >= distance;

    const addTarget = (type, value) => {
      targets.push({
        index: i,
        type,
        position,
        distance,
        score: value - distance,
      });
    };

    if (board[i] === ELEMENT.APPLE) {
      addTarget('APPLE', 3);
    }

    if (board[i] === ELEMENT.GOLD) {
      addTarget('GOLD', 5);
    }

    if (board[i] === ELEMENT.STONE) {
      if (canCatchOnFury) {
        addTarget('STONE', 20);
      } else if (snakeSize > 4) {
        addTarget('STONE', 5);
      }
    }

    if (board[i] === ELEMENT.FURY_PILL) {
      addTarget('FURY_PILL', 25);
    }

    // if (board[i] === ELEMENT.FLYING_PILL) {
    //   addTarget('FLYING_PILL', 0);
    // }
  }

  const nextTarget = targets.sort((a, b) => b.score - a.score)[0];

  if (nextTarget.index !== prevTarget.index) {
    onTargetChange(nextTarget);
  }

  return (prevTarget = nextTarget);
}

// UTILITY FUNCTIONS

export function getHeadIndex(board) {
  const position = getHeadPosition(board);
  const index = position.y * getBoardSize(board) + position.x;
  return index;
}

export function countRepeatsInPath(board, x, y) {
  const positionIndex = getBoardSize(board) * y + x;
  for (var i = 0, count = 0; i < snakePath.length; i++) {
    if (snakePath[i] === positionIndex) count++;
  }
  return count;
}

export function resetProcessingVars() {
  snakePath = [];
  prevTarget = {};
  turn = 0;
  furyMovesLeft = 0;
}

export function getFuryMovesLeft() {
  return furyMovesLeft;
}
