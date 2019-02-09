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
export const ELEMENT = {
  NONE: ' ',
  WALL: '☼',
  START_FLOOR: '#',
  OTHER: '?',

  APPLE: '○',
  STONE: '●',
  FLYING_PILL: '©',
  FURY_PILL: '®',
  GOLD: '$',

  // игрок
  HEAD_DOWN: '▼',
  HEAD_LEFT: '◄',
  HEAD_RIGHT: '►',
  HEAD_UP: '▲',
  HEAD_DEAD: '☻',
  HEAD_EVIL: '♥',
  HEAD_FLY: '♠',
  HEAD_SLEEP: '&',

  TAIL_END_DOWN: '╙',
  TAIL_END_LEFT: '╘',
  TAIL_END_UP: '╓',
  TAIL_END_RIGHT: '╕',
  TAIL_INACTIVE: '~',

  BODY_HORIZONTAL: '═',
  BODY_VERTICAL: '║',
  BODY_LEFT_DOWN: '╗',
  BODY_LEFT_UP: '╝',
  BODY_RIGHT_DOWN: '╔',
  BODY_RIGHT_UP: '╚',

  // противник
  ENEMY_HEAD_DOWN: '˅',
  ENEMY_HEAD_LEFT: '<',
  ENEMY_HEAD_RIGHT: '>',
  ENEMY_HEAD_UP: '˄',
  ENEMY_HEAD_DEAD: '☺',
  ENEMY_HEAD_EVIL: '♣',
  ENEMY_HEAD_FLY: '♦',
  ENEMY_HEAD_SLEEP: 'ø',

  ENEMY_TAIL_END_DOWN: '¤',
  ENEMY_TAIL_END_LEFT: '×',
  ENEMY_TAIL_END_UP: 'æ',
  ENEMY_TAIL_END_RIGHT: 'ö',
  ENEMY_TAIL_INACTIVE: '*',

  ENEMY_BODY_HORIZONTAL: '─',
  ENEMY_BODY_VERTICAL: '│',
  ENEMY_BODY_LEFT_DOWN: '┐',
  ENEMY_BODY_LEFT_UP: '┘',
  ENEMY_BODY_RIGHT_DOWN: '┌',
  ENEMY_BODY_RIGHT_UP: '└',
};

export const COMMANDS = {
  UP: 'UP', // snake momves
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  ACT: 'ACT', // drop stone if any
};

export const OPPOSITE_COMMANDS = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

// SETS OF BODY ELEMENTS

export const ENEMY_HEADS = [
  ELEMENT.ENEMY_HEAD_DOWN,
  ELEMENT.ENEMY_HEAD_LEFT,
  ELEMENT.ENEMY_HEAD_RIGHT,
  ELEMENT.ENEMY_HEAD_UP,
  ELEMENT.ENEMY_HEAD_EVIL,
  ELEMENT.ENEMY_HEAD_FLY,
];

export const EATABLE_ENEMY_HEADS = [
  ELEMENT.ENEMY_HEAD_DOWN,
  ELEMENT.ENEMY_HEAD_LEFT,
  ELEMENT.ENEMY_HEAD_RIGHT,
  ELEMENT.ENEMY_HEAD_UP,
];

export const ENEMY_TAILS = [
  ELEMENT.ENEMY_TAIL_END_DOWN,
  ELEMENT.ENEMY_TAIL_END_UP,
  ELEMENT.ENEMY_TAIL_END_LEFT,
  ELEMENT.ENEMY_TAIL_END_RIGHT,
  ELEMENT.ENEMY_TAIL_INACTIVE,
];

export const ENEMY_BODY = [
  ELEMENT.ENEMY_BODY_HORIZONTAL,
  ELEMENT.ENEMY_BODY_VERTICAL,
  ELEMENT.ENEMY_BODY_LEFT_DOWN,
  ELEMENT.ENEMY_BODY_LEFT_UP,
  ELEMENT.ENEMY_BODY_RIGHT_DOWN,
  ELEMENT.ENEMY_BODY_RIGHT_UP,
];

export const ENEMY_BODY_MATCHES = {
  RIGHT: [
    ELEMENT.ENEMY_BODY_HORIZONTAL,
    ELEMENT.ENEMY_BODY_LEFT_DOWN,
    ELEMENT.ENEMY_BODY_LEFT_UP,
    ELEMENT.ENEMY_TAIL_END_RIGHT,
  ],
  LEFT: [
    ELEMENT.ENEMY_BODY_HORIZONTAL,
    ELEMENT.ENEMY_BODY_RIGHT_DOWN,
    ELEMENT.ENEMY_BODY_RIGHT_UP,
    ELEMENT.ENEMY_TAIL_END_LEFT,
  ],
  UP: [
    ELEMENT.ENEMY_BODY_VERTICAL,
    ELEMENT.ENEMY_BODY_LEFT_DOWN,
    ELEMENT.ENEMY_BODY_RIGHT_DOWN,
    ELEMENT.ENEMY_TAIL_END_UP,
  ],
  DOWN: [
    ELEMENT.ENEMY_BODY_VERTICAL,
    ELEMENT.ENEMY_BODY_LEFT_UP,
    ELEMENT.ENEMY_BODY_RIGHT_UP,
    ELEMENT.ENEMY_TAIL_END_DOWN,
  ],
};
