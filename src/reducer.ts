import { Game } from './game';

export type Action =
  | {
      type: 'selectCell';
      row: number;
      col: number;
    }
  | {
      type: 'deselectCell';
      row: number;
      col: number;
    }
  | {
      type: 'resetMove';
    }
  | {
      type: 'confirmMove';
    }
  | {
      type: 'passMove';
    };

export function gameReducer(game: Game, action: Action): Game {
  switch (action.type) {
    case 'selectCell': {
      game.selectCell(action.row, action.col);
      break;
    }

    case 'deselectCell': {
      game.deselectCell(action.row, action.col);
      break;
    }

    case 'resetMove': {
      game.resetSelection();
      break;
    }

    case 'confirmMove': {
      game.makeMove();
      break;
    }

    case 'passMove': {
      const answer = window.confirm('Are you sure you want to pass your turn?');
      if (answer) game.passMove();
      break;
    }
  }

  return game.clone();
}
