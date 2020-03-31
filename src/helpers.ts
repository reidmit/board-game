import { Cell } from './game';

export function randomNumber(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatMathExpression(cells: Cell[]): string {
  if (cells.length < 4) return cells.map(cell => cell.symbol).join('');

  const endsInNumber = typeof cells[cells.length - 1].symbol === 'number';
  const splitPoint = endsInNumber ? cells.length - 2 : cells.length - 1;
  const start = cells.slice(0, splitPoint);
  const end = cells.slice(splitPoint);

  return `(${formatMathExpression(start)})${formatMathExpression(end)}`;
}
