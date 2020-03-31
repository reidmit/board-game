export interface Settings {
  width: number;
  height: number;
  boardDice: number[][];
  moveLengthDice: number[][];
  moveTotalDice: number[][];
}

export function mergeWithDefaults(given: Partial<Settings> = {}): Settings {
  return {
    width: given.width || 12,
    height: given.height || 12,
    boardDice: given.boardDice || [[1, 2, 3, 4, 5, 6]],
    moveLengthDice: given.moveLengthDice || [
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6]
    ],
    moveTotalDice: given.moveTotalDice || [
      [1, 2, 3, 4, 5, 6],
      [1, 2, 3, 4, 5, 6]
    ]
  };
}

export function parseFromQueryString(): Settings {
  const parsed: Partial<Settings> = {};

  const urlParams = new URLSearchParams(window.location.search);

  const parseNumber = (key: keyof Settings) => {
    if (urlParams.has(key)) {
      parsed[key] = parseInt(urlParams.get(key) as string) as any;
    }
  };

  const parseDice = (key: keyof Settings) => {
    if (urlParams.has(key)) {
      const allValues = urlParams.getAll(key);
      parsed[key] = allValues.map(value =>
        value.split(',').map(num => parseInt(num))
      ) as any;
    }
  };

  parseNumber('width');
  parseNumber('height');
  parseDice('boardDice');
  parseDice('moveLengthDice');
  parseDice('moveLengthDice');

  return mergeWithDefaults(parsed);
}
