import { getEnemiesData } from './processing';

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
});
