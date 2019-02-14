import _ from 'lodash';

import { ELEMENT, ENEMY_HEADS, ENEMY_BODY_MATCHES, ENEMY_BODY } from './constants';
import { getHeadPosition, getBoardSize, getSnakeSize, getXYByPosition, getBoardAsArray } from './utils';

// ROUND VARS

let turn = 0;
let targetPath = [];
let prevTarget = {};
let furyMovesLeft = 0;
let flyMovesLeft = 0;
let enemies = [];
let warnArea = [];
let lastEatenElement = '';

// PREPROCESS TICK

export function preprocessTick(board, prevBoard, logger, boardViewer) {
  processSnakePaths(board);
  enemies = getEnemiesData(board);

  boardViewer.setData({ enemies });

  const headIndex = getHeadIndex(board);
  const eatenElement = prevBoard[headIndex];

  if (eatenElement !== ELEMENT.NONE) {
    lastEatenElement = eatenElement;
    onElementEaten(eatenElement);
  }

  if (furyMovesLeft > 0) {
    furyMovesLeft--;
  }
  if (flyMovesLeft > 0) {
    flyMovesLeft--;
  }

  logger('Turn: ' + turn++);
  logger('My size: ' + getSnakeSize(board));
  logger('Enemy sizes: ' + JSON.stringify(enemies.map((e) => e.body.length).sort((a, b) => b - a)));
  logger('Fury moves: ' + furyMovesLeft);
  logger('Fly moves: ' + flyMovesLeft);
  logger('Eaten: ' + lastEatenElement);
}

// TARGET EVENTS

function onElementEaten(elem) {
  if (elem === ELEMENT.FURY_PILL) {
    furyMovesLeft += 10;
  }
  if (elem === ELEMENT.FLYING_PILL) {
    flyMovesLeft += 10;
  }
}

function onTargetChange(nextTarget) {
  targetPath = [];
}

// TARGET SELECTOR

export function getNextTarget(board, { deadlocks, pockets }, boardViewer, logger) {
  const head = getHeadPosition(board);
  const snakeSize = getSnakeSize(board);
  const boardSize = getBoardSize(board);
  const enemySizes = enemies.map((e) => e.body.length).sort((a, b) => b - a);
  const enemyOversize = snakeSize - enemySizes[0];
  const furyMovesLeft = getFuryMovesLeft();
  const targets = [];
  const furyPills = [];
  const furyHeads = [];

  for (var i = 0; i < board.length; i++) {
    const position = getXYByPosition(board, i);
    const distance = Math.abs(position.x - head.x) + Math.abs(position.y - head.y);
    const canCatchOnFury = furyMovesLeft && furyMovesLeft >= distance;

    // is closer to on target
    const closestEnemy = getClosestEnemyToTarget(board, position) || { distance: 0 };
    const isFirstOnTarget = closestEnemy.distance > distance;
    const extraDistance = closestEnemy.distance - distance;

    const addTarget = (type, value, props) => {
      targets.push({
        index: i,
        type,
        position,
        distance,
        score: value - distance,
        isFirstOnTarget,
        inDeadlocks: deadlocks.includes(i),
        inPocket: pockets.includes(i),
        isValuable: ['FURY_PILL', 'ENEMY_HEAD', 'ENEMY_BODY'].includes(type),
        ...props,
      });
    };

    if (board[i] === ELEMENT.APPLE) {
      addTarget('APPLE', 3);
    }

    if (board[i] === ELEMENT.GOLD) {
      addTarget('GOLD', 6);
    }

    if (board[i] === ELEMENT.STONE) {
      if (canCatchOnFury || enemyOversize > 6 || (snakeSize > 4 && enemyOversize < -6)) {
        addTarget('STONE', 5);
      }
    }

    if (board[i] === ELEMENT.FLYING_PILL) {
      addTarget('FLYING_PILL', 0);
    }

    if (board[i] === ELEMENT.FURY_PILL) {
      if ((turn < 120 && enemies.length > 1) || turn > 270) {
        addTarget('FURY_PILL', 5);
      } else {
        if (closestEnemy.size > 15) {
          if (extraDistance <= 9) {
            addTarget('FURY_PILL', 25);
          }
        } else {
          if (extraDistance <= 6) {
            addTarget('FURY_PILL', 20);
          }
        }
      }

      // need to calc danger zones
      furyPills.push({
        index: i,
        position,
        extraDistance,
        size: 10 + extraDistance,
        isFirstOnTarget,
        inDeadlocks: deadlocks.includes(i),
        inPocket: pockets.includes(i),
      });
    }

    if (ENEMY_BODY.includes(board[i])) {
      if (canCatchOnFury) {
        addTarget('ENEMY_BODY', 30, { isEnemy: true });
      }
    }

    if (ENEMY_HEADS.includes(board[i])) {
      const enemy = getEnemyByHeadIndex(i);
      const canEatSnake = !enemy.isOnFury && snakeSize >= enemy.size + 2;
      const canCatchEnemyNext = canEatSnake && distance === 1;
      const oversize = snakeSize - enemy.size;
      const shouldHuntEnemy = canEatSnake && oversize > 2;

      if (canCatchEnemyNext) {
        addTarget('ENEMY_HEAD', 99, { isEnemy: true });
      }

      if (canCatchOnFury) {
        addTarget('ENEMY_HEAD', 50, { isEnemy: true });
      }

      if (shouldHuntEnemy) {
        if (enemies.length === 1) {
          addTarget('ENEMY_HEAD', 12, { isEnemy: true });
        } else {
          addTarget('ENEMY_HEAD', 7, { isEnemy: true });
        }
      }

      if (enemy.isOnFury) {
        // need to calc danger zones
        furyHeads.push({
          index: i,
          position,
        });
      }
    }
  }

  // CALC DANGER ZONES HERE

  warnArea = [];
  furyHeads.forEach((head) => {
    for (var i = 0; i < board.length; i++) {
      const pos = getXYByPosition(board, i);
      const distance = Math.abs(head.position.x - pos.x) + Math.abs(head.position.y - pos.y);
      if (distance <= 9) {
        warnArea.push(i);
      }
    }
  });
  furyPills.filter((pill) => !pill.isFirstOnTarget && !pill.inDeadlocks).forEach((pill) => {
    for (var i = 0; i < board.length; i++) {
      const pos = getXYByPosition(board, i);
      const distance = Math.abs(pill.position.x - pos.x) + Math.abs(pill.position.y - pos.y);
      if (pill.inPocket) {
        if (distance <= 5) {
          warnArea.push(i);
        }
      } else {
        if (distance <= 9) {
          warnArea.push(i);
        }
      }
    }
  });

  boardViewer.setData({ warnArea });

  const filteredTargets = targets
    .filter(({ isFirstOnTarget, isEnemy }) => isFirstOnTarget || isEnemy)
    .filter(({ inDeadlocks }) => !inDeadlocks) // reject deadlocked targets
    .filter(({ inPocket, isValuable }) => !inPocket || isValuable) // reject not valuable in pockets
    .filter(
      ({ index, type, isFirstOnTarget }) => !warnArea.includes(index) || (type === 'FURY_PILL' && isFirstOnTarget),
    ); // not in warn area

  // add board center target (use if no closer argets available)
  const CENTER = { x: 15, y: 15 };
  const distanceToCenter = Math.abs(CENTER.x - head.x) + Math.abs(CENTER.y - head.y);
  filteredTargets.push({
    type: 'BOARD_CENTER',
    position: CENTER,
    index: CENTER.y * boardSize + CENTER.x,
    distance: distanceToCenter,
    score: -20 - distanceToCenter,
  });

  const nextTarget = filteredTargets.sort((a, b) => b.score - a.score)[0]; // get best target

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
  return furyMovesLeft;
}

export function getFuryMovesLeft() {
  return furyMovesLeft;
}

export function getFlyMovesLeft() {
  return flyMovesLeft;
}

export function getWarnArea() {
  return warnArea;
}

export function countWallsAround(board, { x, y }) {
  const boardArr = getBoardAsArray(board);
  let wallsCount = 0;
  [boardArr[x + 1][y], boardArr[x - 1][y], boardArr[x][y + 1], boardArr[x][y - 1]].forEach((element) => {
    if ([ELEMENT.WALL, ELEMENT.START_FLOOR].includes(element)) {
      wallsCount++;
    }
  });
  return wallsCount;
}

// PATHS PROCESSING

function processSnakePaths(board) {
  const headIndex = getHeadIndex(board);
  targetPath.push(headIndex);
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

export function getClosestEnemyToTarget(board, position) {
  if (!position) {
    return [];
  }
  const { x, y } = position;
  return enemies
    .map((enemy) => {
      const pos = getXYByPosition(board, enemy.headIndex);
      return {
        enemy,
        distance: Math.abs(pos.x - x) + Math.abs(pos.y - y),
      };
    })
    .sort((a, b) => a.distance - b.distance)[0];
}

export function isEnemiesGoRight(board) {
  return (
    board.indexOf(ELEMENT.ENEMY_HEAD_DOWN) === -1 &&
    board.indexOf(ELEMENT.ENEMY_HEAD_UP) === -1 &&
    board.indexOf(ELEMENT.ENEMY_HEAD_LEFT) === -1
  );
}

export function getTick() {
  return turn;
}
