import _ from 'lodash';

import { ELEMENT, ENEMY_HEADS, ENEMY_BODY_MATCHES, ENEMY_BODY } from './constants';
import { getHeadPosition, getBoardSize, getSnakeSize, getXYByPosition, isSnakeOnFury } from './utils';

// ROUND VARS

let turn = 0;
let targetPath = [];
let prevTarget = {};
let furyMovesLeft = 0;
let enemies = [];

// PREPROCESS TICK

export function preprocessTick(board, logger, boardViewer) {
  processSnakePaths(board);
  enemies = getEnemiesData(board);

  boardViewer.setData({ enemies });

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

export function getNextTarget(board, pockets = []) {
  const head = getHeadPosition(board);
  const snakeSize = getSnakeSize(board);
  const furyMovesLeft = getFuryMovesLeft();
  const targets = [];

  for (var i = 0; i < board.length; i++) {
    const position = getXYByPosition(board, i);
    const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);
    const canCatchOnFury = furyMovesLeft && furyMovesLeft >= distance;

    // is closer to on target
    const enemyDistances = getEnemyDistancesToTarget(board, position);
    const closestEnemyDistance = Math.min(...enemyDistances);
    const isFirstOnTarget = closestEnemyDistance > distance;
    const extraDistance = closestEnemyDistance - distance;

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
      addTarget('GOLD', 6);
    }

    if (board[i] === ELEMENT.STONE) {
      if (canCatchOnFury) {
        addTarget('STONE', 5);
      }
    }

    if (board[i] === ELEMENT.FURY_PILL) {
      if (isFirstOnTarget && extraDistance <= 5) {
        addTarget('FURY_PILL', 20);
      }
    }

    if (ENEMY_BODY.includes(board[i])) {
      if (canCatchOnFury) {
        addTarget('ENEMY_BODY', 25);
      }
    }

    if (ENEMY_HEADS.includes(board[i])) {
      const enemy = getEnemyByHeadIndex(i);
      const canEatSnake = snakeSize >= enemy.size + 2;
      const canKillEnemyNext = canEatSnake && distance === 1;
      const oversize = snakeSize - enemy.size;
      const shouldHuntEnemy = enemies.length === 1 && canEatSnake && oversize > 3;

      if (canKillEnemyNext) {
        addTarget('ENEMY_HEAD', 99);
      }

      if (shouldHuntEnemy) {
        addTarget('ENEMY_HEAD', 20);
      }
    }
  }

  const nextTarget = targets
    .filter((target) => !pockets.includes(target.index)) // exclude target in pockets
    .sort((a, b) => b.score - a.score)[0];

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

export function getEnemyByHeadIndex(headIndex) {
  return _.find(enemies, { headIndex });
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

export function getEnemyDistancesToTarget(board, position) {
  if (!position) {
    return [];
  }
  const { x, y } = position;
  return enemies.map((enemy) => {
    const pos = getXYByPosition(board, enemy.headIndex);
    return Math.abs(pos.x - x) + Math.abs(pos.y - y);
  });
}

// PATHS PROCESSING

function processSnakePaths(board) {
  const headIndex = getHeadIndex(board);

  targetPath.push(headIndex);

  if (headIndex === prevTarget.index) {
    onTargetEat(prevTarget);
  }
}

export function countRepeatsInPath(board, x, y) {
  const positionIndex = getBoardSize(board) * y + x;
  for (var i = 0, count = 0; i < targetPath.length; i++) {
    if (targetPath[i] === positionIndex) count++;
  }
  return count;
}

// GET ENEMIES DATA

export function getEnemiesData(board) {
  const enemiesData = [];
  const snakeSize = getSnakeSize(board);

  for (var i = 0; i < board.length; i++) {
    if (ENEMY_HEADS.includes(board[i])) {
      const body = getEnemyBody(board, i);

      enemiesData.push({
        headIndex: i,
        headPosition: getXYByPosition(board, i),
        headElement: board[i],
        body,
        size: body.length,
        isOnFury: board[i] === ELEMENT.ENEMY_HEAD_EVIL,
        isOnFly: board[i] === ELEMENT.ENEMY_HEAD_FLY,
      });
    }
  }

  const isEnemyDangerous = (enemy) => {
    const oversize = snakeSize - enemy.size;
    if ((furyMovesLeft && enemy.isOnFury) || (!furyMovesLeft && !enemy.isOnFury)) {
      return oversize < 2;
    }
    if (furyMovesLeft) {
      return false;
    }
    if (enemy.isOnFury) {
      return true;
    }
  };

  enemiesData.forEach((enemy) => {
    enemy.headZone = getEnemyHeadZone(enemy, board);
    enemy.dangerous = isEnemyDangerous(enemy);
  });

  return enemiesData;
}

export function getEnemyHeadZone(enemy, board) {
  const { headIndex, body } = enemy;
  const boardSize = getBoardSize(board);
  const twoMovesZone = [
    headIndex + 1,
    headIndex + 2,
    headIndex - 1,
    headIndex - 2,
    headIndex + boardSize,
    headIndex + boardSize * 2,
    headIndex - boardSize,
    headIndex - boardSize * 2,
    headIndex + boardSize + 1,
    headIndex + boardSize - 1,
    headIndex - boardSize + 1,
    headIndex - boardSize - 1,
  ].filter((index) => index !== body[1] && index !== body[2]);

  return twoMovesZone;
}

export function getEnemyBody(board, headIndex) {
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

export function getEnemyHeadzones() {
  const enemyHeadZones = enemies
    .filter((enemy) => enemy.dangerous)
    .reduce((zones, enemy) => [...zones, ...enemy.headZone], []);
  return enemyHeadZones;
}
