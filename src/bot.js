import { ELEMENT, COMMANDS, OPPOSITE_COMMANDS } from './constants';
import {
  isGameOver,
  getHeadPosition,
  getElementByXY,
  getSnakeSize,
  isSnakeSleep,
  isSnakeOnFury,
  countWallsAround,
  getBoardSize,
} from './utils';
import { getNextTarget, processSnakePath, resetTargetSelector, detectLevelDeadlocks } from './target-selector';

let lastCommand = '';
let deadlocks = {};

export function getNextSnakeMove(board = '', logger) {
  if (isGameOver(board)) {
    return '';
  }

  if (isSnakeSleep(board)) {
    prepareToRound(board);
    return '';
  }

  const maskedBoard = Object.assign(board.split(''), deadlocks).join('');
  const headPosition = getHeadPosition(maskedBoard);
  if (!headPosition) {
    return '';
  }

  const target = getNextTarget(maskedBoard, logger);
  const sorround = getSorround(headPosition);
  const raitings = sorround.map(ratePositions(maskedBoard, target));
  const command = getCommandByRaitings(raitings);

  // processors
  processSnakePath(maskedBoard, target);
  
  // loggers
  logger('Target:' + JSON.stringify(target));
  logger('Raitings:' + JSON.stringify(raitings));

  if (isNeedToDropStone(maskedBoard)) {
    return `${COMMANDS.ACT}, ${command}`;
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

function isNeedToDropStone(board) {
  return isSnakeOnFury(board);
}

const ratePositions = (board, target) => ({ x, y, command }) => {
  const element = getElementByXY(board, { x, y });
  const boardSize = getBoardSize(board);

  const snakeSize = getSnakeSize(board);
  const snakeOnFury = isSnakeOnFury(board);

  const isImpossibleCommand = command === OPPOSITE_COMMANDS[lastCommand];
  const distanceX = target ? Math.abs(target.position.x - x) : 0;
  const distanceY = target ? Math.abs(target.position.y - y) : 0;
  const wallsAround = countWallsAround(board, x, y);

  if (wallsAround > 2) {
    return -100;
  }

  if (isImpossibleCommand) {
    return -50;
  }

  // SCORE (0..900) BASED ON DISTANCE TO TARGET
  const distSqr = distanceX * distanceX + distanceY * distanceY;
  const distanceScore = boardSize * boardSize - distSqr;

  switch (element) {
    case ELEMENT.NONE:
    case ELEMENT.APPLE:
    case ELEMENT.FLYING_PILL:
    case ELEMENT.GOLD:
    case ELEMENT.FURY_PILL:
      return distanceScore;

    case ELEMENT.STONE:
      if (target.type === 'STONE') {
        return distanceScore;
      }
      return -5;

    case ELEMENT.WALL:
    case ELEMENT.START_FLOOR:
      return -10;

    // OWN BODY
    case ELEMENT.BODY_HORIZONTAL:
    case ELEMENT.BODY_VERTICAL:
    case ELEMENT.BODY_LEFT_DOWN:
    case ELEMENT.BODY_LEFT_UP:
    case ELEMENT.BODY_RIGHT_UP:
      if (snakeOnFury) {
        return 900;
      }
      return -3;

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
      if (snakeOnFury) {
        return 999;
      }
      return -5;

    default:
      return -1;
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

function prepareToRound(board) {
  resetTargetSelector();
  deadlocks = detectLevelDeadlocks(board);
  lastCommand = '';
}
