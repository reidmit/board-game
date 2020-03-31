import React, { useReducer } from 'react';
import './App.css';
import { Game } from './game';
import { formatMathExpression } from './helpers';
import { gameReducer } from './reducer';
import { parseFromQueryString } from './settings';

function BoardCell(props: {
  children: string | number;
  owner: number;
  selected: boolean;
  selectable: boolean;
  onClick: React.EventHandler<React.MouseEvent> | undefined;
}) {
  let className = 'cell';
  if (props.owner > -1) className += ` player-${props.owner}`;
  if (props.selected) className += ` selected`;
  if (props.selectable) className += ` selectable`;

  return (
    <button
      className={className}
      onClick={props.onClick}
      disabled={!props.selected && !props.selectable}
    >
      {props.children}
    </button>
  );
}

function App() {
  const [game, dispatch] = useReducer(
    gameReducer,
    new Game(parseFromQueryString())
  );

  const {
    currentMove,
    currentSelection,
    currentScores,
    isSelectionValid,
    isOver
  } = game;

  const currentTotalString = currentSelection.cells.length
    ? formatMathExpression(currentSelection.cells)
    : '';

  let headerContent = null;

  if (isOver) {
    const [score0, score1] = currentScores;
    if (score0 > score1) {
      headerContent = `Player 0 wins!`;
    } else if (score1 > score0) {
      headerContent = 'Player 1 wins!';
    } else {
      headerContent = "It's a draw!";
    }
  } else {
    headerContent = (
      <>
        <div className="header-detail">player {currentMove.player}'s turn</div>

        <div className="header-detail">
          {currentTotalString}{' '}
          {currentTotalString && (
            <span>
              = <b>{currentSelection.total}</b> |
            </span>
          )}{' '}
          must total <b>{currentMove.target}</b>
        </div>

        <div className="header-detail">
          using <b>{currentSelection.cells.length}</b> of up to{' '}
          <b>{currentMove.size}</b> squares
        </div>

        <button
          className="header-button"
          disabled={currentSelection.cells.length === 0}
          onClick={() => dispatch({ type: 'resetMove' })}
        >
          reset
        </button>
        <button
          className="header-button"
          onClick={() => dispatch({ type: 'passMove' })}
        >
          pass
        </button>
        <button
          className="header-button"
          disabled={!isSelectionValid}
          onClick={() => dispatch({ type: 'confirmMove' })}
        >
          confirm
        </button>
      </>
    );
  }

  return (
    <div className="App">
      <header>
        <div className="header-detail">
          player 0: <b>{currentScores[0]}</b> squares | player 1:{' '}
          <b>{currentScores[1]}</b> squares
        </div>

        {headerContent}
      </header>
      <main>
        <div
          className="board"
          style={{ width: `${game.settings.width * 50}px` }}
        >
          {game.board.map((rowCells, row) => (
            <div key={row} className="row">
              {rowCells.map((cell, col) => {
                const selectable = game.possibleSelections.has(cell.id);
                const selected = !selectable && game.isSelected(row, col);
                const onClick = selectable
                  ? () => dispatch({ type: 'selectCell', row, col })
                  : selected
                  ? () => dispatch({ type: 'deselectCell', row, col })
                  : undefined;

                return (
                  <BoardCell
                    key={cell.id}
                    owner={cell.owner}
                    selected={selected}
                    selectable={selectable}
                    onClick={onClick}
                  >
                    {cell.symbol}
                  </BoardCell>
                );
              })}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;
