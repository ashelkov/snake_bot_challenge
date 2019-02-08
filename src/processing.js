// TODO: calc snake length (own/enemy)
// TODO: prevent head-crash with bigger/fury snake
// TODO: hunt smaller enemies

import { ELEMENT, ENEMY_HEADS, ENEMY_TAILS, ENEMY_BODY_MATCHES } from './constants';
import { getHeadPosition, getBoardSize, getSnakeSize, getXYByPosition, isSnakeOnFury } from './utils';

// ROUND VARS

let turn = 0;
let targetPath = [];
let prevTarget = {};
let furyMovesLeft = 0;
let enemies = [];

// PREPROCESS TICK

export function preprocessTick(board, logger) {
  processSnakePaths(board);
  getEnemiesData(board);

  logger('Turn:' + turn++);
  logger('Path:' + JSON.stringify(targetPath));
  logger('My size: ' + getSnakeSize(board));
  logger('Enemy sizes' + JSON.stringify(enemies.map((e) => e.body.length)));

  if (isSnakeOnFury(board)) {
    furyMovesLeft--;
  } else {
    furyMovesLeft = 0;
  }
}

// TARGET EVENTS

function onTargetEat(target) {
  if (target.type === 'FURY_PILL') {
    furyMovesLeft += 10;
  }
}

function onTargetChange(nextTarget) {
  targetPath = [];
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
      addTarget('GOLD', 10);
    }

    if (board[i] === ELEMENT.STONE) {
      if (canCatchOnFury) {
        addTarget('STONE', 10);
      }
    }

    if (board[i] === ELEMENT.FURY_PILL) {
      addTarget('FURY_PILL', 25);
    }
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
  for (var i = 0, count = 0; i < targetPath.length; i++) {
    if (targetPath[i] === positionIndex) count++;
  }
  return count;
}

export function resetProcessingVars() {
  targetPath = [];
  prevTarget = {};
  turn = 0;
  furyMovesLeft = 0;
  enemies = [];
}

export function isNeedToDropStone() {
  // todo: drop if enemy head near the tail
  return false;
}

export function getFuryMovesLeft() {
  return furyMovesLeft;
}

// PATHS PROCESSING

function processSnakePaths(board) {
  const headIndex = getHeadIndex(board);

  targetPath.push(headIndex);

  if (headIndex === prevTarget.index) {
    onTargetEat(prevTarget);
  }
}

function getEnemiesData(board) {
  enemies = [];

  for (var i = 0; i < board.length; i++) {
    if (ENEMY_HEADS.includes(board[i])) {
      enemies.push({
        headIndex: i,
        headElement: board[i],
        isOnFury: board[i] === ELEMENT.ENEMY_HEAD_EVIL,
        isOnFly: board[i] === ELEMENT.ENEMY_HEAD_FLY,
        body: getEnemyBody(board, i),
      });
    }
  }
}

function getEnemyBody(board, headIndex) {
  const boardSize = getBoardSize(board);
  const snakeBody = [headIndex];
  let snakeBodyLength;

  do {
    const elemIndex = snakeBody[snakeBody.length - 1];
    snakeBodyLength = snakeBody.length;

    const indexUp = elemIndex - boardSize;
    const indexDown = elemIndex + boardSize;
    const indexLeft = elemIndex - 1;
    const indexRight = elemIndex + 1;

    if (ENEMY_BODY_MATCHES.UP.includes(board[indexUp]) && !snakeBody.includes(indexUp)) {
      snakeBody.push(indexUp);
    } else if (ENEMY_BODY_MATCHES.DOWN.includes(board[indexDown]) && !snakeBody.includes(indexDown)) {
      snakeBody.push(indexDown);
    } else if (ENEMY_BODY_MATCHES.LEFT.includes(board[indexLeft]) && !snakeBody.includes(indexLeft)) {
      snakeBody.push(indexLeft);
    } else if (ENEMY_BODY_MATCHES.RIGHT.includes(board[indexRight]) && !snakeBody.includes(indexRight)) {
      snakeBody.push(indexRight);
    }
  } while (snakeBodyLength !== snakeBody.length);

  return snakeBody;
}
