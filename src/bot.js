import { ELEMENT, COMMANDS, OPPOSITE_COMMANDS } from './constants';
import { getLevelDeadlocks, getLevelPenalties } from './board';
import { isGameOver, isSnakeSleep, getHeadPosition, getElementByXY, getBoardSize, getBoardAsString } from './utils';
import {
  getNextTarget,
  preprocessTick,
  resetProcessingVars,
  countRepeatsInPath,
  getFuryMovesLeft,
  isNeedToDropStone,
  getEnemyDistancesToTarget,
  getEnemyHeadzones,
} from './processing';

let lastCommand = '';
let isLevelProcessed = false;
let deadlocks = [];
let pockets = [];

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
  preprocessTick(board, logger, boardViewer);

  // should be after pre-processor
  const command = getNextCommand({ board: board, headPosition, logger, boardViewer });

  return command;
}

function getNextCommand({ board, headPosition, logger, boardViewer }) {
  const target = getNextTarget(board, { deadlocks, pockets });
  const headzones = getEnemyHeadzones();

  const sorround = getSorround(headPosition);
  const raitings = sorround.map(ratePositions(board, target, headzones));
  const command = getCommandByRaitings(raitings);

  boardViewer.setData({
    currentTarget: target,
    enemyHeadzones: headzones,
    command,
  });

  logger('Target:' + JSON.stringify(target));
  logger('Target distances:' + JSON.stringify(getEnemyDistancesToTarget(board, target.position)));
  logger('Raitings:' + JSON.stringify(raitings));

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
  const element = getElementByXY(board, { x, y });
  const boardSize = getBoardSize(board);
  const distanceX = target ? Math.abs(target.position.x - x) : 0;
  const distanceY = target ? Math.abs(target.position.y - y) : 0;
  const distance = distanceX + distanceY;
  const furyMovesLeft = getFuryMovesLeft();

  const isExactTarget = target && distance === 0;
  if (isExactTarget && ['ENEMY_HEAD', 'ENEMY_BODY', 'FURY_PILL'].includes(target.type)) {
    return 999;
  }

  const isImpossibleCommand = command === OPPOSITE_COMMANDS[lastCommand];
  if (isImpossibleCommand) {
    return -99;
  }

  const elementIndex = y * boardSize + x;
  const isInDangerZone = enemyHeadzones.includes(elementIndex);
  if (isInDangerZone) {
    return 0;
  }

  // BASE SCORE (0..900) BASED ON DISTANCE TO TARGET
  // ALSO PENALTY DIVIDERS ARE PRESENT

  // distance score (0..900)
  const distSqr = distanceX * distanceX + distanceY * distanceY;
  const distanceScore = boardSize * boardSize - distSqr;
  // penalty modifiers (0..1)
  const pathRepeats = countRepeatsInPath(board, x, y);
  const pathRepeatPenalty = pathRepeats > 1 ? 1 / pathRepeats : 1;
  const pocketPenalty = pockets.includes(elementIndex) && !target.inPocket ? 0.5 : 1;
  // score
  const score = distanceScore * pocketPenalty * pathRepeatPenalty;

  switch (element) {
    case ELEMENT.WALL:
    case ELEMENT.START_FLOOR:
      return -10;

    // OWN BODY
    case ELEMENT.BODY_HORIZONTAL:
    case ELEMENT.BODY_VERTICAL:
    case ELEMENT.BODY_LEFT_DOWN:
    case ELEMENT.BODY_LEFT_UP:
    case ELEMENT.BODY_RIGHT_UP:
    case ELEMENT.BODY_RIGHT_DOWN:
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
      if (furyMovesLeft) {
        return 900;
      }
      return -20;

    // STONE
    case ELEMENT.STONE:
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
