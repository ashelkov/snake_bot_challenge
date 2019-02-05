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
import { ELEMENT, COMMANDS } from './constants';
import { isGameOver, getHeadPosition, getElementByXY } from './utils';
import { getNextTarget } from './brain';

// Bot Example
export function getNextSnakeMove(board, logger) {
  if (isGameOver(board)) {
    return '';
  }
  const headPosition = getHeadPosition(board);
  if (!headPosition) {
    return '';
  }

  const sorround = getSorround(headPosition); // (LEFT, UP, RIGHT, DOWN)
  const target = getNextTarget(board);
  const raitings = sorround.map(ratePositions(target, board));
  const command = getCommandByRaitings(raitings);

  logger('Head:' + JSON.stringify(headPosition));
  logger('Target:' + JSON.stringify(target));

  return command;
}

function getSorround(position) {
  const p = position;
  return [
    { x: p.x - 1, y: p.y }, // LEFT
    { x: p.x, y: p.y - 1 }, // UP
    { x: p.x + 1, y: p.y }, // RIGHT
    { x: p.x, y: p.y + 1 }, // DOWN
  ];
}

const ratePositions = (target, board) => ({ x, y }) => {
  const element = getElementByXY(board, { x, y });
  const distance = Math.abs(target.position.x - x) + Math.abs(target.position.y - y);

  switch (element) {
    case ELEMENT.NONE:
      return Math.floor((10 / (distance + 1)) * 100) / 100; // SCORE BASED ON DISTANCE TO TARGET
    case ELEMENT.APPLE:
      return 10;
    case ELEMENT.GOLD:
      return 15;
    case ELEMENT.FLYING_PILL:
      return 20;
    case ELEMENT.FURY_PILL:
      return 50;
    case ELEMENT.STONE:
      if (target.type === 'STONE') {
        return 25;
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
  var indexToCommand = ['LEFT', 'UP', 'RIGHT', 'DOWN'];
  var maxIndex = 0;
  var max = -Infinity;
  for (var i = 0; i < raitings.length; i++) {
    var r = raitings[i];
    if (r > max) {
      maxIndex = i;
      max = r;
    }
  }

  return indexToCommand[maxIndex];
}
