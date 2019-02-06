import { ELEMENT, COMMANDS, OPPOSITE_COMMANDS } from './constants';
import {
  isGameOver,
  getHeadPosition,
  getElementByXY,
  getSnakeSize,
  isSnakeSleep,
  isSnakeOnFury,
  countWallsAround,
} from './utils';
import { getNextTarget, resetGameData } from './target-selector';

let lastCommand;

// Bot Example
export function getNextSnakeMove(board, logger) {
  if (isGameOver(board)) {
    return '';
  }

  if (isSnakeSleep(board)) {
    resetGameData();
    return (lastCommand = '');
  }

  const headPosition = getHeadPosition(board);
  if (!headPosition) {
    return '';
  }

  const sorround = getSorround(headPosition); // (LEFT, UP, RIGHT, DOWN)
  const target = getNextTarget(board, logger);
  const raitings = sorround.map(ratePositions(board, target));
  const command = getCommandByRaitings(raitings);

  logger('Target:' + JSON.stringify(target));
  logger('Raitings:' + JSON.stringify(raitings));

  return isNeedToDropStone(board) ? [COMMANDS.ACT, command].join(',') : command;
}

function isNeedToDropStone(board) {
  return isSnakeOnFury(board);
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

const ratePositions = (board, target) => ({ x, y, command }) => {
  const element = getElementByXY(board, { x, y });
  const snakeSize = getSnakeSize(board);

  const isImpossibleCommand = command === OPPOSITE_COMMANDS[lastCommand];
  const distance = target ? Math.abs(target.position.x - x) + Math.abs(target.position.y - y) : 0;
  const wallsAround = countWallsAround(board, x, y);

  if (wallsAround > 2) {
    return -100;
  }

  if (isImpossibleCommand) {
    return -50;
  }

  switch (element) {
    case ELEMENT.NONE:
      return Math.floor(1 / (distance + 1) * 100) / 100; // SCORE (0..1) BASED ON DISTANCE TO TARGET
    case ELEMENT.APPLE:
      return 10;
    case ELEMENT.FLYING_PILL:
      return 10;
    case ELEMENT.GOLD:
      return 25;
    case ELEMENT.FURY_PILL:
      return 50;
    case ELEMENT.STONE:
      if (target.type === 'STONE') {
        return 30;
      }
      return -5;
    case ELEMENT.WALL:
    case ELEMENT.START_FLOOR:
      return -10;
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
