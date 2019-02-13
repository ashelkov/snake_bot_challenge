import { getEnemiesData, countWallsAround } from './processing';

describe('board processing', () => {
  describe('getEnemiesData', () => {
    it('should return correct enemy size', () => {
      const board =
        '******' + //
        '*  ┌ö*' +
        '* ┌┘ *' +
        '* ˅  *' +
        '*    *' +
        '******';

      const enemies = getEnemiesData(board);
      expect(enemies[0].size).toEqual(5);
    });
  });

  describe('penalties procesing', () => {
    it('should return correct walls count', () => {
      const board =
        '******' + //
        '*  ┌ö*' +
        '* ┌┘ *' +
        '* ˅  *' +
        '*    *' +
        '******';

      const wallsCount = countWallsAround(board, { x: 1, y: 1 });
      expect(wallsCount).toEqual(2);
    });
  });
});
