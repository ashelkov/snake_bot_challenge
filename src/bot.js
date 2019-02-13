import { ELEMENT, COMMANDS, OPPOSITE_COMMANDS } from './constants';
import { getLevelDeadlocks, getLevelPenalties } from './board';
import { isGameOver, isSnakeSleep, getHeadPosition, getElementByXY, getBoardSize, getBoardAsString } from './utils';
import {
  getNextTarget,
  preprocessTick,
  resetProcessingVars,
  countRepeatsInPath,
  getFuryMovesLeft,
  getFlyMovesLeft,
  getWarnArea,
  isNeedToDropStone,
  getClosestEnemyToTarget,
  getEnemyHeadzones,
  countWallsAround,
  isEnemiesGoRight,
  getTick,
} from './processing';

let lastCommand = '';
let isLevelProcessed = false;
let deadlocks = [];
let pockets = [];
let prevBoard = '';

export function getNextSnakeMove(board = '', logger, boardViewer) {
  if (isGameOver(board)) {
    positionLogger(board, 'GAME OVER!');
    return '';
  }

  if (isSnakeSleep(board)) {
    onRoundStart(board, boardViewer);
    return '';
  }

  if (!isLevelProcessed) {
    onRoundStart(board, boardViewer);
  }

  // prepare board
  const headPosition = getHeadPosition(board);
  if (!headPosition) {
    return '';
  }

  // pre-processor
  preprocessTick(board, prevBoard, logger, boardViewer);

  // reset zombie room
  if (getTick() === 5) {
    const isZombieRoom = isEnemiesGoRight(board);
    console.log('isZombieRoom:', isZombieRoom);
    if (isZombieRoom) {
      return 'ACT(0)';
    }
  }

  // should be after pre-processor
  const command = getNextCommand({ board: board, headPosition, logger, boardViewer });

  // set prev board
  prevBoard = board;

  return command;
}

function getNextCommand({ board, headPosition, logger, boardViewer }) {
  const target = getNextTarget(board, { deadlocks, pockets }, boardViewer, logger);
  const headzones = getEnemyHeadzones();

  const sorround = getSorround(headPosition);
  const raitings = sorround.map(ratePositions(board, target, headzones));
  const command = getCommandByRaitings(raitings);

  boardViewer.setData({
    currentTarget: target,
    enemyHeadzones: headzones,
    command,
  });

  const closestEnemyToTarget = getClosestEnemyToTarget(board, target.position);
  logger('Target: ' + JSON.stringify(_.pick(target, ['type', 'distance'])));
  logger('Opponent: ' + JSON.stringify(_.pick(closestEnemyToTarget, ['distance', 'enemy.size'])));
  logger('Raitings: ' + JSON.stringify(raitings));

  if (isNeedToDropStone()) {
    return [command, COMMANDS.ACT].join(',');
  }

  return command;
}

function getSorround(position) {
  const p = position;
  return [
    { x: p.x - 1, y: p.y, command: 'LEFT' },
    { x: p.x, y: p.y - 1, command: 'UP' },
    { x: p.x + 1, y: p.y, command: 'RIGHT' },
    { x: p.x, y: p.y + 1, command: 'DOWN' },
  ];
}

const ratePositions = (board, target, enemyHeadzones) => ({ x, y, command }) => {
  const boardSize = getBoardSize(board);
  const element = getElementByXY(board, { x, y });
  const elementIndex = y * boardSize + x;

  const distanceX = target ? Math.abs(target.position.x - x) : 0;
  const distanceY = target ? Math.abs(target.position.y - y) : 0;
  const distance = distanceX + distanceY;

  const furyMovesLeft = getFuryMovesLeft();
  const flyMovesLeft = getFlyMovesLeft();
  const canCatchOnFury = furyMovesLeft >= distance;
  const warnArea = getWarnArea();

  const isExactTarget = target && distance === 0;
  if (isExactTarget && ['ENEMY_HEAD', 'ENEMY_BODY', 'FURY_PILL', 'FLYING_PILL'].includes(target.type)) {
    return 99;
  }

  const isImpossibleCommand = command === OPPOSITE_COMMANDS[lastCommand];
  if (isImpossibleCommand) {
    return -99;
  }

  const isDeadlocked = deadlocks.includes(elementIndex);
  if (isDeadlocked) {
    return -50;
  }

  // BASE SCORE (0..90) BASED ON DISTANCE TO TARGET
  // ALSO PENALTY DIVIDERS ARE PRESENT

  // distance (0..90)
  const distanceScore = boardSize * 3 - (distanceX + distanceY + Math.max(distanceX, distanceY) / 10);
  // penalties (0..1)
  const pathRepeats = countRepeatsInPath(board, x, y);
  const pathRepeatPenalty = pathRepeats > 1 ? 1 / pathRepeats : 1;
  const pocketPenalty = target.inPocket ? 1 : pockets.includes(elementIndex) ? 0.75 : 1;
  const dangerZonePenalty = enemyHeadzones.includes(elementIndex) ? 0.5 : 1;
  const warnAreaPenalty = !warnArea.includes(elementIndex) || canCatchOnFury ? 1 : 0;
  const wallsPenalty = countWallsAround(board, target.position); // not working
  const penalties = pocketPenalty * pathRepeatPenalty * dangerZonePenalty * warnAreaPenalty;

  // score
  const score = distanceScore * penalties - wallsPenalty;

  switch (element) {
    case ELEMENT.WALL:
    case ELEMENT.START_FLOOR:
      return -10;

    case ELEMENT.FURY_PILL:
      if (target.type !== 'FURY_PILL') {
        return score - 1;
      }
      return score;

    // OWN BODY
    case ELEMENT.BODY_HORIZONTAL:
    case ELEMENT.BODY_VERTICAL:
    case ELEMENT.BODY_LEFT_DOWN:
    case ELEMENT.BODY_LEFT_UP:
    case ELEMENT.BODY_RIGHT_UP:
    case ELEMENT.BODY_RIGHT_DOWN:
      if (flyMovesLeft) {
        return distanceScore;
      }
      return -5;

    // ENEMY HEAD OR BODY
    case ELEMENT.ENEMY_HEAD_DOWN:
    case ELEMENT.ENEMY_HEAD_LEFT:
    case ELEMENT.ENEMY_HEAD_RIGHT:
    case ELEMENT.ENEMY_HEAD_UP:
    case ELEMENT.ENEMY_BODY_HORIZONTAL:
    case ELEMENT.ENEMY_BODY_VERTICAL:
    case ELEMENT.ENEMY_BODY_LEFT_DOWN:
    case ELEMENT.ENEMY_BODY_LEFT_UP:
    case ELEMENT.ENEMY_BODY_RIGHT_DOWN:
    case ELEMENT.ENEMY_BODY_RIGHT_UP:
    case ELEMENT.ENEMY_TAIL_END_DOWN:
    case ELEMENT.ENEMY_TAIL_END_LEFT:
    case ELEMENT.ENEMY_TAIL_END_RIGHT:
    case ELEMENT.ENEMY_TAIL_END_UP:
      if (furyMovesLeft) {
        return 90;
      }
      if (flyMovesLeft) {
        return distanceScore;
      }
      return -20;

    // STONE
    case ELEMENT.STONE:
      if (flyMovesLeft) {
        return distanceScore;
      }
      if (target.type === 'STONE' || furyMovesLeft) {
        return score;
      }
      return 0;

    default:
      return score;
  }
};

function getCommandByRaitings(raitings) {
  const commandRaitings = [
    { command: COMMANDS.LEFT, raiting: raitings[0] },
    { command: COMMANDS.UP, raiting: raitings[1] },
    { command: COMMANDS.RIGHT, raiting: raitings[2] },
    { command: COMMANDS.DOWN, raiting: raitings[3] },
  ];

  const { command } = commandRaitings.sort((a, b) => b.raiting - a.raiting)[0];
  lastCommand = command;

  return command;
}

function onRoundStart(board, boardViewer) {
  resetProcessingVars();
  processLevel(board, boardViewer);
  lastCommand = null;
}

function processLevel(board, boardViewer) {
  deadlocks = getLevelDeadlocks(board);
  pockets = getLevelPenalties(board, deadlocks);

  boardViewer.reset();
  boardViewer.setData({ deadlocks, pockets });
  isLevelProcessed = true;
}

export function positionLogger(board, message) {
  console.log('\n');
  console.log(message, { lastCommand });
  console.log(getBoardAsString(board));
  getBoardAsString(board);
}
