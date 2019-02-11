import { ELEMENT } from './constants';
import { getHeadPosition, getSnakeSize } from './utils';

const TILE_SIZE = 20;

export class BoardViewer {
  constructor(containerId) {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    document.getElementById(containerId).appendChild(this.canvas);
    this.canvas.width = TILE_SIZE * 30;
    this.canvas.height = TILE_SIZE * 30;
    this.imageCache = {};

    this.reset();

    this.draw = this.draw.bind(this);
    this.drawTile = this.drawTile.bind(this);
    this.setData = this.setData.bind(this);
    this.reset = this.reset.bind(this);
    this.drawAnalyzeLayer = this.drawAnalyzeLayer.bind(this);
    this.drawTarget = this.drawTarget.bind(this);
    this.drawTargetVector = this.drawTargetVector.bind(this);
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
    };
  }

  draw(board) {
    const boardSize = Math.sqrt(board.length);
    const tileMap = _.invert(ELEMENT);
    for (var i = 0; i < board.length; i++) {
      const element = board[i];
      const posX = i % boardSize;
      const posY = (i - posX) / boardSize;
      const tile = tileMap[element] || 'OTHER';
      this.drawTile(tile, posX, posY);
    }

    this.data.headPosition = getHeadPosition(board);
    this.data.snakeSize = getSnakeSize(board);

    this.drawAnalyzeLayer();
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

  drawAnalyzeLayer() {
    if (this.data.currentTarget) {
      this.drawTarget();
      this.drawTargetVector();
    }
  }

  drawTarget() {
    const { position } = this.data.currentTarget;
    this.ctx.fillStyle = 'rgba(250, 250, 0, 0.35)';
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
}
