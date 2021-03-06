import { ELEMENT } from './constants';

// Here is utils that might help for bot development
export function getBoardAsString(board) {
  return getBoardAsArray(board).join('\n');
}

export function getBoardAsArray(board) {
  const size = getBoardSize(board);
  var result = [];
  for (var i = 0; i < size; i++) {
    result.push(board.substring(i * size, (i + 1) * size));
  }
  return result;
}

export function getBoardSize(board) {
  return Math.sqrt(board.length);
}

export function isGameOver(board) {
  return board.indexOf(ELEMENT.HEAD_DEAD) !== -1;
}

export function isAt(board, x, y, element) {
  if (isOutOf(board, x, y)) {
    return false;
  }
  return getAt(board, x, y) === element;
}

export function getAt(board, x, y) {
  if (isOutOf(board, x, y)) {
    return ELEMENT.WALL;
  }
  return getElementByXY(board, { x, y });
}

export function isNear(board, x, y, element) {
  if (isOutOf(board, x, y)) {
    return ELEMENT.WALL;
  }

  return (
    isAt(board, x + 1, y, element) ||
    isAt(board, x - 1, y, element) ||
    isAt(board, x, y + 1, element) ||
    isAt(board, x, y - 1, element)
  );
}

export function isOutOf(board, x, y) {
  const boardSize = getBoardSize(board);
  return x >= boardSize || y >= boardSize || x < 0 || y < 0;
}

export function getHeadPosition(board) {
  return getFirstPositionOf(board, [
    ELEMENT.HEAD_DOWN,
    ELEMENT.HEAD_LEFT,
    ELEMENT.HEAD_RIGHT,
    ELEMENT.HEAD_UP,
    ELEMENT.HEAD_DEAD,
    ELEMENT.HEAD_EVIL,
    ELEMENT.HEAD_FLY,
    ELEMENT.HEAD_SLEEP,
  ]);
}

export function getTailPosition(board) {
  return getFirstPositionOf(board, [
    ELEMENT.TAIL_END_DOWN,
    ELEMENT.TAIL_END_LEFT,
    ELEMENT.TAIL_END_RIGHT,
    ELEMENT.TAIL_END_UP,
    ELEMENT.TAIL_INACTIVE,
  ]);
}

export function getFirstPositionOf(board, elements) {
  for (var i = 0; i < elements.length; i++) {
    var element = elements[i];
    var position = board.indexOf(element);
    if (position !== -1) {
      return getXYByPosition(board, position);
    }
  }
  return null;
}

export function getXYByPosition(board, position) {
  if (position === -1) {
    return null;
  }

  const size = getBoardSize(board);
  return {
    x: position % size,
    y: (position - (position % size)) / size,
  };
}

export function getElementByXY(board, position) {
  const size = getBoardSize(board);
  return board[size * position.y + position.x];
}

export function isSnakeOnFury(board) {
  return board.indexOf(ELEMENT.HEAD_EVIL) !== -1;
}

export function isSnakeSleep(board) {
  return board.indexOf(ELEMENT.HEAD_SLEEP) !== -1;
}

export function getSnakeSize(board) {
  const bodyParts = [
    ELEMENT.BODY_HORIZONTAL,
    ELEMENT.BODY_VERTICAL,
    ELEMENT.BODY_LEFT_DOWN,
    ELEMENT.BODY_LEFT_UP,
    ELEMENT.BODY_RIGHT_DOWN,
    ELEMENT.BODY_RIGHT_UP,
  ];
  let size = 2; // HEAD & TAIL
  for (var i = 0; i < board.length; i++) {
    if (bodyParts.includes(board[i])) size++;
  }
  return size;
}
