export interface Settings {
  width: number;
  height: number;
  boardDice: number[][];
  moveLengthDice: number[][];
  moveTotalDice: number[][];
  playerNames: string[];
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
    ],
    playerNames: ['player 1', 'player 2']
  };
}

export function parseFromQueryString(): Settings {
  const parsed: Settings = mergeWithDefaults({});

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
  parseDice('moveTotalDice');
  parseDice('moveLengthDice');

  if (urlParams.has('player1')) {
    parsed.playerNames[0] = urlParams.get('player1') as string;
  }

  if (urlParams.has('player2')) {
    parsed.playerNames[1] = urlParams.get('player2') as string;
  }

  return parsed;
}
