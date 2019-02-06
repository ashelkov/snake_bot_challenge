/*-
 * #%L
 * Codenjoy - it's a dojo-like platform from developers to developers.
 * %%
 * Copyright (C) 2018 - 2019 Codenjoy
 * %%
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program.  If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.html>.
 * #L%
 */
import { ELEMENT, COMMANDS, OPPOSITE_COMMANDS } from './constants';
import { isGameOver, getHeadPosition, getElementByXY, getSnakeSize, isSnakeSleep, isSnakeOnFury } from './utils';
import { getNextTarget, resetGameData } from './bot-navigator';

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

  logger('Head:' + JSON.stringify(headPosition));
  logger('Target:' + JSON.stringify(target));
  logger('Raitings:' + JSON.stringify(raitings));

  return (lastCommand = command);
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
  const distance = target ? Math.abs(target.position.x - x) + Math.abs(target.position.y - y) : 0;
  const isImpossibleCommand = getSnakeSize(board) > 2 && command === OPPOSITE_COMMANDS[lastCommand];

  if (isImpossibleCommand) {
    return -100;
  }

  switch (element) {
    case ELEMENT.NONE:
      return Math.floor((10 / (distance + 1)) * 100) / 100; // SCORE BASED ON DISTANCE TO TARGET
    case ELEMENT.APPLE:
      return 10;
    case ELEMENT.FLYING_PILL:
      return 15;
    case ELEMENT.GOLD:
      return 25;
    case ELEMENT.FURY_PILL:
      return 50;
    case ELEMENT.STONE:
      if (target.type === 'STONE') {
        return 20;
      }
      return -5;
    case ELEMENT.WALL:
    case ELEMENT.START_FLOOR:
      return -10;

    // OWN BODY OPTIONS
    case ELEMENT.BODY_HORIZONTAL:
    case ELEMENT.BODY_VERTICAL:
    case ELEMENT.BODY_LEFT_DOWN:
    case ELEMENT.BODY_LEFT_UP:
    case ELEMENT.BODY_RIGHT_DOWN:
    case ELEMENT.BODY_RIGHT_UP:
    case ELEMENT.TAIL_END_DOWN:
    case ELEMENT.TAIL_END_LEFT:
    case ELEMENT.TAIL_END_RIGHT:
    case ELEMENT.TAIL_END_UP:
      if (isSnakeOnFury(board)) {
        return 30;
      }
      return -3;
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
  return command;
}
