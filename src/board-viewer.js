import { ELEMENT } from './constants';
import { getHeadPosition, getSnakeSize, getXYByPosition } from './utils';

const TILE_SIZE = 22;

export class BoardViewer {
  constructor(containerId) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    document.getElementById(containerId).appendChild(this.canvas);
    this.canvas.width = TILE_SIZE * 30;
    this.canvas.height = TILE_SIZE * 30;
    this.imageCache = {};

    this.reset();

    [
      'draw',
      'drawTile',
      'setData',
      'reset',
      'drawAnalyzeLayer',
      'drawTarget',
      'drawTargetVector',
      'drawSnakeSizes',
      'maskPositions',
      'drawDeadlocks',
      'drawPockets',
      'drawCommand',
      'drawEnemyHeadzones',
      'drawWarnAreas',
    ].forEach((funcName) => (this[funcName] = this[funcName].bind(this)));
  }

  setData(patch) {
    if (patch) {
      Object.assign(this.data, patch);
    }
  }

  reset() {
    this.data = {
      enemies: null,
      currentTarget: null,
      command: null,
      deadlocks: null,
      pockets: null,
      command: null,
      enemyHeadzones: null,
    };
  }

  draw(board) {
    const boardSize = Math.sqrt(board.length);
    const tileMap = _.invert(ELEMENT);

    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 0.3;

    for (var i = 0; i < board.length; i++) {
      const element = board[i];
      const posX = i % boardSize;
      const posY = (i - posX) / boardSize;
      const tile = tileMap[element] || 'OTHER';
      this.drawTile(tile, posX, posY);
    }

    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;

    this.data.headPosition = getHeadPosition(board);
    this.data.snakeSize = getSnakeSize(board);

    this.drawAnalyzeLayer(board);
  }

  drawTile(tile, x, y) {
    const image = this.imageCache[tile] || new Image();
    // image.src = `https://github.com/codenjoyme/codenjoy/blob/master/CodingDojo/games/snake-battle/src/main/webapp/resources/sprite/snakebattle/${tile}.png?raw=true`;
    image.src = `https://github.com/Kontsedal/snake-bot-logs-viewer/blob/master/src/components/BoardDrawer/assets/${tile}.png?raw=true`;
    if (image.complete) {
      this.ctx.drawImage(image, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    image.onload = () => {
      this.imageCache[tile] = image;
    };
  }

  drawAnalyzeLayer(board) {
    if (this.data.deadlocks) {
      this.drawDeadlocks(board);
    }
    if (this.data.pockets) {
      this.drawPockets(board);
    }
    if (this.data.warnArea) {
      this.drawWarnAreas(board);
    }
    if (this.data.enemyHeadzones) {
      this.drawEnemyHeadzones(board);
    }
    if (this.data.enemies) {
      this.drawSnakeSizes();
    }
    if (this.data.currentTarget) {
      this.drawTarget();
      this.drawTargetVector();
    }
    if (this.data.command) {
      this.drawCommand();
    }
  }

  drawTarget() {
    const { position } = this.data.currentTarget;
    this.ctx.fillStyle = 'rgba(250, 250, 0, 0.5)';
    this.ctx.beginPath();
    this.ctx.arc(position.x * TILE_SIZE + TILE_SIZE / 2, position.y * TILE_SIZE + TILE_SIZE / 2, 25, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  drawTargetVector() {
    const {
      headPosition,
      currentTarget: { position },
    } = this.data;
    if (!headPosition) return;

    this.ctx.beginPath();
    this.ctx.moveTo(headPosition.x * TILE_SIZE + TILE_SIZE / 2, headPosition.y * TILE_SIZE + TILE_SIZE / 2);
    this.ctx.lineTo(position.x * TILE_SIZE + TILE_SIZE / 2, position.y * TILE_SIZE + TILE_SIZE / 2);
    this.ctx.strokeStyle = 'rgba(200, 100, 0, 0.5)';
    this.ctx.stroke();
  }

  drawSnakeSizes() {
    const { enemies, headPosition, snakeSize } = this.data;
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    this.ctx.shadowBlur = 3;

    if (headPosition) {
      this.ctx.font = '13px Arial';
      this.ctx.fillStyle = 'darkgreen';
      this.ctx.fillText(snakeSize, headPosition.x * TILE_SIZE + TILE_SIZE * 0.75, headPosition.y * TILE_SIZE);
    }

    if (enemies) {
      enemies.forEach(({ size, headPosition: { x, y } }) => {
        this.ctx.font = '13px Arial';
        this.ctx.fillStyle = 'firebrick';
        this.ctx.fillText(size, x * TILE_SIZE + TILE_SIZE * 0.75, y * TILE_SIZE);
      });
    }

    this.ctx.shadowColor = 'transparent';
    this.ctx.shadowBlur = 0;
  }

  maskPositions(board, positions, color = 'rgba(255, 0, 0, 0.35)') {
    this.ctx.fillStyle = color;
    positions.forEach((pos) => {
      const { x, y } = getXYByPosition(board, pos);
      this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    });
  }

  drawCommand() {
    if (!this.data.headPosition) return;
    const {
      command,
      headPosition: { x, y },
    } = this.data;
    const position = {
      UP: { x, y: y - 1 },
      DOWN: { x, y: y + 1 },
      LEFT: { x: x - 1, y },
      RIGHT: { x: x + 1, y },
    }[command];

    this.ctx.fillStyle = 'rgba(50, 150, 250, 0.75)';
    this.ctx.beginPath();
    this.ctx.arc(position.x * TILE_SIZE + TILE_SIZE / 2, position.y * TILE_SIZE + TILE_SIZE / 2, 5, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  drawDeadlocks(board) {
    const { deadlocks } = this.data;
    if (deadlocks) {
      this.maskPositions(board, deadlocks, 'rgba(255, 0, 0, 0.4)');
    }
  }

  drawPockets(board) {
    const { pockets } = this.data;
    if (pockets) {
      this.maskPositions(board, pockets, 'rgba(255, 150, 0, 0.4)');
    }
  }

  drawEnemyHeadzones(board) {
    const { enemyHeadzones } = this.data;
    if (enemyHeadzones) {
      this.maskPositions(board, enemyHeadzones, 'rgba(255, 0, 0, 0.25)');
    }
  }

  drawWarnAreas(board) {
    const { warnArea } = this.data;
    if (warnArea) {
      this.maskPositions(board, warnArea, 'rgba(255, 100, 0, 0.25)');
    }
  }
}
