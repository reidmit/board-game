import { randomNumber } from './helpers';
import { mergeWithDefaults, Settings } from './settings';

export interface Cell {
  id: string;
  row: number;
  col: number;
  symbol: string | number;
  owner: number;
  selected: boolean;
}

export interface Move {
  number: number;
  player: number;
  size: number;
  target: number;
}

export class Game {
  settings: Settings;
  playerCount: number;
  moveCount: number;
  currentScores: number[];
  currentMove: Move;
  currentSelection: { cells: Cell[]; total: number };
  isSelectionValid: boolean;
  board: Cell[][];
  possibleSelections: Set<string>;
  isOver: boolean;

  constructor(settings?: Settings) {
    this.settings = mergeWithDefaults(settings);
    this.playerCount = 2;
    this.board = [];
    this.currentSelection = { cells: [], total: 0 };
    this.moveCount = 0;
    this.currentMove = this.nextMove();
    this.currentScores = [0, 0];
    this.isSelectionValid = false;
    this.isOver = false;

    for (let row = 0; row < this.settings.height; row++) {
      this.board.push([]);

      for (let col = 0; col < this.settings.width; col++) {
        const id = `${row},${col}`;
        const symbol = this.determineSymbol(row, col);
        let owner = -1;
        if (typeof symbol === 'number') {
          if (row === 0) owner = 0;
          else if (row === this.settings.height - 1) owner = 1;
        }

        this.board[row].push({ id, row, col, symbol, owner, selected: false });
      }
    }

    this.calculateScores();
    this.possibleSelections = this.calculatePossibleSelections();
  }

  nextMove(): Move {
    const { moveLengthDice, moveTotalDice } = this.settings;

    const player =
      this.moveCount === 0
        ? randomNumber(0, 1)
        : (this.currentMove.player + 1) % this.playerCount;

    const size = this.rollDice(moveLengthDice);
    const target = this.rollDice(moveTotalDice);

    return {
      number: this.moveCount++,
      player,
      size,
      target
    };
  }

  clone(): Game {
    return Object.assign(new Game(), this);
  }

  selectCell(row: number, col: number) {
    const cell = this.cell(row, col);
    if (!cell || !this.possibleSelections.has(cell.id)) return;

    if (this.newSelectedCells().length >= this.currentMove.size) {
      return;
    }

    cell.selected = true;
    this.currentSelection.cells.push(cell);
    this.currentSelection.total = this.calculateSelectionTotal();
    this.possibleSelections = this.calculatePossibleSelections();
    this.checkSelectionValid();
  }

  deselectCell(row: number, col: number) {
    if (!this.currentSelection.cells.length) return;

    const newSelection = [];

    let foundDeselected = false;
    for (const selectedCell of this.currentSelection.cells) {
      if (selectedCell.row === row && selectedCell.col === col) {
        selectedCell.selected = false;
        foundDeselected = true;
      } else if (foundDeselected) {
        selectedCell.selected = false;
      } else {
        newSelection.push(selectedCell);
      }
    }

    this.currentSelection.cells = newSelection;
    this.currentSelection.total = this.calculateSelectionTotal();
    this.possibleSelections = this.calculatePossibleSelections();
    this.checkSelectionValid();
  }

  resetSelection() {
    for (const selectedCell of this.currentSelection.cells) {
      selectedCell.selected = false;
    }

    this.currentSelection = { cells: [], total: 0 };
    this.possibleSelections = this.calculatePossibleSelections();
    this.checkSelectionValid();
  }

  passMove() {
    this.currentMove = this.nextMove();
    this.resetSelection();
  }

  makeMove() {
    if (!this.isSelectionValid) return;

    for (const selectedCell of this.currentSelection.cells) {
      selectedCell.owner = this.currentMove.player;
      selectedCell.selected = false;
    }

    this.clearOrphanedCells();
    this.calculateScores();

    this.currentMove = this.nextMove();
    this.resetSelection();
    this.checkIfOver();
  }

  isSelected(row: number, col: number): boolean {
    return this.cell(row, col)?.selected || false;
  }

  private checkIfOver() {
    const firstRow = this.board[0];
    const lastRow = this.board[this.settings.height - 1];

    for (let col = 0; col < this.settings.width; col++) {
      if (firstRow[col].owner === 1 || lastRow[col].owner === 0) {
        this.possibleSelections.clear();
        this.isOver = true;
        return;
      }
    }
  }

  newSelectedCells() {
    return this.currentSelection.cells.filter(
      cell => cell.owner !== this.currentMove.player
    );
  }

  private checkSelectionValid() {
    if (!this.currentSelection.cells.length) {
      this.isSelectionValid = false;
      return;
    }

    const lastSelectedCell = this.currentSelection.cells[
      this.currentSelection.cells.length - 1
    ];

    if (typeof lastSelectedCell.symbol !== 'number') {
      this.isSelectionValid = false;
      return;
    }

    if (this.currentSelection.total !== this.currentMove.target) {
      this.isSelectionValid = false;
      return;
    }

    this.isSelectionValid = true;
  }

  private calculateScores() {
    this.currentScores = [0, 0];

    this.forEachCell(cell => {
      if (cell.owner < 0) return;
      this.currentScores[cell.owner]++;
    });
  }

  private clearOrphanedCells() {
    const ownedVisitableCells = new Set();
    const visitQueue: Cell[] = [];

    // Enqueue the owned home row number cells for non-current player
    const opposingHomeRow =
      this.currentMove.player === 0 ? this.settings.height - 1 : 0;
    for (let col = 0; col < this.settings.width; col++) {
      const cell = this.cell(opposingHomeRow, col)!;
      if (typeof cell.symbol !== 'number') continue;
      if (cell.owner > -1 && cell.owner !== this.currentMove.player) {
        visitQueue.push(cell);
      }
    }

    // Visit all adjacent cells owned by non-current player
    while (visitQueue.length) {
      const cell = visitQueue.pop()!;
      if (ownedVisitableCells.has(cell.id)) continue;
      ownedVisitableCells.add(cell.id);

      const checkNeighbor = (r: number, c: number) => {
        const neighbor = this.cell(r, c);

        if (
          neighbor &&
          neighbor.owner > -1 &&
          neighbor.owner !== this.currentMove.player
        ) {
          visitQueue.push(this.cell(r, c)!);
        }
      };

      checkNeighbor(cell.row - 1, cell.col);
      checkNeighbor(cell.row + 1, cell.col);
      checkNeighbor(cell.row, cell.col - 1);
      checkNeighbor(cell.row, cell.col + 1);

      // checking diagonals
      checkNeighbor(cell.row - 1, cell.col - 1);
      checkNeighbor(cell.row + 1, cell.col + 1);
      checkNeighbor(cell.row - 1, cell.col + 1);
      checkNeighbor(cell.row + 1, cell.col - 1);
    }

    // Clear all previously owned cells not reachable from home row
    this.forEachCell(cell => {
      if (
        cell.owner !== this.currentMove.player &&
        !ownedVisitableCells.has(cell.id)
      ) {
        cell.owner = -1;
      }
    });
  }

  private cell(row: number, col: number): Cell | undefined {
    const r = this.board[row];
    return r && r[col];
  }

  private calculateSelectionTotal() {
    let total = 0;
    let i = 0;

    while (i < this.currentSelection.cells.length) {
      const cell = this.currentSelection.cells[i];

      if (i === 0) {
        total += cell.symbol as number;
        i++;
        continue;
      }

      const nextCell = this.currentSelection.cells[i + 1];
      if (!nextCell) break;

      switch (cell.symbol) {
        case '+': {
          total += nextCell.symbol as number;
          break;
        }
        case '-': {
          total -= nextCell.symbol as number;
          break;
        }
        case '*': {
          total *= nextCell.symbol as number;
          break;
        }
      }

      i += 2;
    }

    return total;
  }

  private calculatePossibleSelections() {
    const result = new Set<string>();

    if (!this.currentSelection.cells.length) {
      this.forEachCell(cell => {
        if (
          cell.owner === this.currentMove.player &&
          typeof cell.symbol === 'number'
        ) {
          result.add(cell.id);
        }
      });

      return result;
    }

    if (this.newSelectedCells().length >= this.currentMove.size) {
      return result;
    }

    const lastSelectedCell = this.currentSelection.cells[
      this.currentSelection.cells.length - 1
    ];

    this.forEachCell(cell => {
      if (cell.selected) return;

      if (
        this.cell(cell.row - 1, cell.col) === lastSelectedCell ||
        this.cell(cell.row + 1, cell.col) === lastSelectedCell ||
        this.cell(cell.row, cell.col - 1) === lastSelectedCell ||
        this.cell(cell.row, cell.col + 1) === lastSelectedCell
      )
        result.add(cell.id);
    });

    return result;
  }

  private forEachCell(func: (cell: Cell) => any) {
    for (let row = 0; row < this.settings.height; row++) {
      for (let col = 0; col < this.settings.width; col++) {
        const cell = this.board[row][col];
        func(cell);
      }
    }
  }

  private determineSymbol(row: number, col: number): '+' | '-' | '*' | number {
    const oddRow = row % 2 === 0;
    const oddCol = col % 2 === 0;
    const isNumber = (oddRow && !oddCol) || (!oddRow && oddCol);

    if (isNumber) {
      return this.rollDice(this.settings.boardDice);
    }

    return ['+', '-', '*'][randomNumber(0, 2)] as '+' | '-' | '*';
  }

  private rollDice(dice: number[][]) {
    let result = 0;

    for (const die of dice) {
      result += die[randomNumber(0, die.length - 1)];
    }

    return result;
  }
}
