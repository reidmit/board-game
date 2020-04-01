import React, { useReducer } from 'react';
import './App.css';
import { Game } from './game';
import { formatMathExpression } from './helpers';
import { gameReducer } from './reducer';
import { parseFromQueryString } from './settings';

const settings = parseFromQueryString();

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
  const [game, dispatch] = useReducer(gameReducer, new Game(settings));

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
      headerContent = `${settings.playerNames[0]} wins!`;
    } else if (score1 > score0) {
      headerContent = `${settings.playerNames[1]} wins!`;
    } else {
      headerContent = "It's a draw!";
    }
  } else {
    headerContent = (
      <>
        <div className="header-detail">
          {settings.playerNames[currentMove.player]}'s turn
        </div>

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
          using <b>{game.newSelectedCells().length}</b> of up to{' '}
          <b>{currentMove.size}</b> new squares
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
          {settings.playerNames[0]}: <b>{currentScores[0]}</b> squares |{' '}
          {settings.playerNames[1]}: <b>{currentScores[1]}</b> squares
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
      <section>
        <h2>how to play</h2>
        <p>
          Each player starts with some squares on one side of the board (their
          "home row"). They claim squares each turn until the game ends.
        </p>
        <p>
          Each turn, a player rolls two sets of dice: one determines their
          target move total, and one determines the maximum squares they can use
          to get to that total. For example, if a turn has a target of 10 and
          can use up to 4 squares, they might play <code>(1 + 5) * 2</code> to
          reach 10.
        </p>
        <p>
          When a player uses a square in a turn, they claim that square. A
          player may claim a square owned by their opponent; this means they
          take over that square. All owned squares must be reachable from a
          player's home row. If a player makes a move that "cuts off" some of
          their opponent's squares (rendering them unreachable from the
          opponent's home row), the opponent loses those squares.
        </p>
        <p>
          Players earn a point for each square they have claimed. The game ends
          when one player claims a square in their opponent's home row. At that
          point, the scores are finalized, and the highest score wins.
        </p>
      </section>
      <section>
        <h2>settings</h2>
        <p>Settings can be changed with query parameters.</p>
        <p>
          For example, <code>?player1=A&player2=B&width=20</code> sets player
          names to "A" and "B", with a board width of 20.
        </p>
        <p>Current settings:</p>
        <pre>
          <code>{JSON.stringify(settings, null, 2)}</code>
        </pre>
      </section>
    </div>
  );
}

export default App;
