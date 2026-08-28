const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const source = fs.readFileSync(new URL("../script.js", `file://${__filename}`), "utf8");
const puzzlesSource = source.match(/const puzzles = (\[[\s\S]*?\n\]);\n\nlet currentPuzzleIndex/);
const puzzles = Function(`return ${puzzlesSource[1]}`)();

function transformIndex(index, transform) {
  const row = Math.floor(index / 5);
  const col = index % 5;
  const [nextRow, nextCol] = transform(row, col);
  return (nextRow * 5) + nextCol;
}

function canonicalPuzzle(puzzle) {
  const transforms = [
    (row, col) => [row, col],
    (row, col) => [col, 4 - row],
    (row, col) => [4 - row, 4 - col],
    (row, col) => [4 - col, row],
    (row, col) => [row, 4 - col],
    (row, col) => [4 - row, col],
    (row, col) => [col, row],
    (row, col) => [4 - col, 4 - row]
  ];

  return transforms.map((transform) => JSON.stringify({
    solution: puzzle.solution.map((index) => transformIndex(index, transform)),
    checkpoints: Object.fromEntries(
      Object.entries(puzzle.checkpoints)
        .map(([index, number]) => [transformIndex(Number(index), transform), number])
        .sort(([first], [second]) => first - second)
    )
  })).sort()[0];
}

test("el banco contiene 20 puzzles válidos y funcionalmente distintos", () => {
  assert.equal(puzzles.length, 20);

  puzzles.forEach((puzzle) => {
    const totalCells = puzzle.size * puzzle.size;
    assert.equal(puzzle.solution.length, totalCells);
    assert.equal(new Set(puzzle.solution).size, totalCells);
    assert.ok(puzzle.solution.every((index) => Number.isInteger(index) && index >= 0 && index < totalCells));
    assert.ok(puzzle.solution.slice(1).every((index, order) => {
      const previous = puzzle.solution[order];
      return Math.abs(Math.floor(index / puzzle.size) - Math.floor(previous / puzzle.size))
        + Math.abs((index % puzzle.size) - (previous % puzzle.size)) === 1;
    }));

    const checkpoints = Object.entries(puzzle.checkpoints).sort(([, first], [, second]) => first - second);
    assert.deepEqual(checkpoints.map(([, number]) => number), [1, 2, 3, 4, 5, 6]);
    const positions = checkpoints.map(([index]) => puzzle.solution.indexOf(Number(index)));
    assert.equal(positions[0], 0);
    assert.ok(positions.slice(1).every((position, order) => position > positions[order]));
  });

  assert.equal(new Set(puzzles.map(canonicalPuzzle)).size, puzzles.length);
});

test("la selección recorre un ciclo completo y no repite en el límite", () => {
  const functionSource = source.match(/function selectNextPuzzle\(\) \{[\s\S]*?\n\}\n\nfunction isBetterRecord/)[0]
    .replace(/\n\nfunction isBetterRecord$/, "");
  const cycleProgress = { played: [] };
  const selectNextPuzzle = Function(
    "puzzles",
    "cycleProgress",
    "saveCycleProgress",
    "Math",
    `${functionSource}; return selectNextPuzzle;`
  )(puzzles, cycleProgress, () => {}, { floor: Math.floor, random: () => 0 });

  const firstCycle = Array.from({ length: puzzles.length }, () => selectNextPuzzle());
  assert.equal(new Set(firstCycle).size, puzzles.length);

  const previousPuzzle = firstCycle.at(-1);
  const firstPuzzleOfNextCycle = selectNextPuzzle();
  assert.notEqual(firstPuzzleOfNextCycle, previousPuzzle);
  assert.deepEqual(cycleProgress.played, [firstPuzzleOfNextCycle]);
});

test("el arranque restaura el último puzzle presentado", () => {
  assert.match(source, /currentPuzzleIndex = cycleProgress\.played\.at\(-1\) \?\? selectNextPuzzle\(\);/);
});

test("el historial corrupto o con índices obsoletos se normaliza", () => {
  const functionSource = source.match(/function loadCycleProgress\(\) \{[\s\S]*?\n\}\n\nfunction saveCycleProgress/)[0]
    .replace(/\n\nfunction saveCycleProgress$/, "");
  const load = (storedValue) => Function(
    "window",
    "puzzles",
    `const PUZZLE_CYCLE_STORAGE_KEY = "test-cycle"; ${functionSource}; return loadCycleProgress();`
  )({ localStorage: { getItem: () => storedValue } }, puzzles);

  assert.deepEqual(load("{valor inválido"), { played: [] });
  assert.deepEqual(load("null"), { played: [] });
  assert.deepEqual(load(JSON.stringify({ played: [0, 0, 3, 99, -1, "2"] })), { played: [0, 3] });
});

test("los récords corruptos y de puzzles inexistentes se ignoran", () => {
  const normalizeSource = source.match(/function normalizeRecord\(candidate\) \{[\s\S]*?\n\}\n\nfunction validatePuzzle/)[0]
    .replace(/\n\nfunction validatePuzzle$/, "");
  const loadSource = source.match(/function loadPuzzleRecords\(\) \{[\s\S]*?\n\}\n\nfunction savePuzzleRecords/)[0]
    .replace(/\n\nfunction savePuzzleRecords$/, "");
  const load = (storedValue) => Function(
    "window",
    "puzzles",
    `const PUZZLE_RECORDS_STORAGE_KEY = "test-records"; ${normalizeSource}\n${loadSource}; return loadPuzzleRecords();`
  )({ localStorage: { getItem: () => storedValue } }, puzzles);
  const record = { score: 9000, timeSeconds: 20, moves: 25, hints: 1 };

  assert.deepEqual(load("{valor inválido"), {});
  assert.deepEqual(load(JSON.stringify({ 2: record, 99: record, 3: { score: "malo" } })), { 2: record });
});

test("los desempates del récord mantienen puntaje, tiempo y movimientos", () => {
  const functionSource = source.match(/function isBetterRecord\(candidate, currentRecord\) \{[\s\S]*?\n\}/)[0];
  const isBetterRecord = Function(`${functionSource}; return isBetterRecord;`)();
  const current = { score: 9000, timeSeconds: 30, moves: 25, hints: 1 };

  assert.equal(isBetterRecord({ ...current, score: 9001 }, current), true);
  assert.equal(isBetterRecord({ ...current, timeSeconds: 29 }, current), true);
  assert.equal(isBetterRecord({ ...current, moves: 24 }, current), true);
  assert.equal(isBetterRecord({ ...current, hints: 0 }, current), false);
});
