const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");

const source = fs.readFileSync(new URL("../script.js", `file://${__filename}`), "utf8");
const html = fs.readFileSync(new URL("../index.html", `file://${__filename}`), "utf8");
const puzzlesSource = source.match(/const puzzles = (\[[\s\S]*?\n\]);\n\nlet currentPuzzleIndex/);
const puzzles = Function(`return ${puzzlesSource[1]}`)();
const difficulties = ["easy", "medium", "hard"];
const modes = ["all", ...difficulties];

function sourceBetween(firstName, nextName) {
  const expression = new RegExp(`function ${firstName}\\([\\s\\S]*?\\n\\}\\n\\nfunction ${nextName}`);
  return source.match(expression)[0].replace(new RegExp(`\\n\\nfunction ${nextName}$`), "");
}

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
    checkpoints: Object.fromEntries(Object.entries(puzzle.checkpoints)
      .map(([index, number]) => [transformIndex(Number(index), transform), number])
      .sort(([first], [second]) => first - second))
  })).sort()[0];
}

function emptyModeProgress() {
  return {
    currentMode: "all",
    modes: Object.fromEntries(modes.map((mode) => [mode, { played: [], currentPuzzleId: null, session: null }]))
  };
}

function createSelector(modeProgress, currentMode = "all") {
  const getPoolSource = sourceBetween("getPuzzleIndicesForMode", "createEmptyModeState");
  const selectSource = sourceBetween("selectNextPuzzle", "snapshotCurrentMode");
  return Function(
    "puzzles",
    "modeProgress",
    "currentMode",
    "saveModeProgress",
    "Math",
    `${getPoolSource}\n${selectSource}; return selectNextPuzzle;`
  )(puzzles, modeProgress, currentMode, () => {}, { floor: Math.floor, random: () => 0 });
}

test("el banco contiene exactamente 30 puzzles válidos, 10 por dificultad", () => {
  assert.equal(puzzles.length, 30);
  assert.equal(new Set(puzzles.map(({ id }) => id)).size, 30);

  difficulties.forEach((difficulty) => {
    assert.equal(puzzles.filter((puzzle) => puzzle.difficulty === difficulty).length, 10);
  });

  puzzles.forEach((puzzle) => {
    const totalCells = puzzle.size * puzzle.size;
    assert.equal(puzzle.size, 5);
    assert.match(puzzle.id, /^ruta-\d{3}$/);
    assert.equal(puzzle.solution.length, 25);
    assert.equal(new Set(puzzle.solution).size, 25);
    assert.ok(puzzle.solution.every((index) => Number.isInteger(index) && index >= 0 && index < totalCells));
    assert.ok(puzzle.solution.slice(1).every((index, order) => {
      const previous = puzzle.solution[order];
      return Math.abs(Math.floor(index / puzzle.size) - Math.floor(previous / puzzle.size))
        + Math.abs((index % puzzle.size) - (previous % puzzle.size)) === 1;
    }));

    const checkpoints = Object.entries(puzzle.checkpoints).sort(([, first], [, second]) => first - second);
    assert.deepEqual(checkpoints.map(([, number]) => number),
      Array.from({ length: checkpoints.length }, (_, index) => index + 1));
    const positions = checkpoints.map(([index]) => puzzle.solution.indexOf(Number(index)));
    assert.equal(positions[0], 0);
    assert.ok(positions.slice(1).every((position, order) => position > positions[order]));
  });
});

test("la clasificación usa una progresión documentable de checkpoints", () => {
  const checkpointCounts = { easy: 6, medium: 6, hard: 5 };
  puzzles.forEach((puzzle) => {
    assert.equal(Object.keys(puzzle.checkpoints).length, checkpointCounts[puzzle.difficulty]);
  });

  const turnCount = (puzzle) => puzzle.solution.slice(2).filter((index, order) => {
    const previous = puzzle.solution[order + 1];
    const beforePrevious = puzzle.solution[order];
    return previous - beforePrevious !== index - previous;
  }).length;
  assert.ok(puzzles.filter(({ difficulty }) => difficulty === "easy").every((puzzle) => turnCount(puzzle) <= 13));
  assert.ok(puzzles.filter(({ difficulty }) => difficulty === "medium").every((puzzle) => turnCount(puzzle) >= 15));
});

test("no hay duplicados exactos ni equivalencias completas por rotación o reflexión", () => {
  const exact = puzzles.map((puzzle) => JSON.stringify({
    solution: puzzle.solution,
    checkpoints: puzzle.checkpoints
  }));
  assert.equal(new Set(exact).size, puzzles.length);
  assert.equal(new Set(puzzles.map(canonicalPuzzle)).size, puzzles.length);
});

test("cada modo recorre su propio banco sin repeticiones", () => {
  const progress = emptyModeProgress();
  const selectEasy = createSelector(progress, "easy");
  const selectAll = createSelector(progress, "all");
  const easyCycle = Array.from({ length: 10 }, () => selectEasy("easy"));

  assert.equal(new Set(easyCycle).size, 10);
  assert.ok(easyCycle.every((index) => puzzles[index].difficulty === "easy"));
  assert.equal(progress.modes.all.played.length, 0);

  const allCycle = Array.from({ length: 30 }, () => selectAll("all"));
  assert.equal(new Set(allCycle).size, 30);
  assert.equal(progress.modes.easy.played.length, 10);
  assert.equal(progress.modes.medium.played.length, 0);
  assert.equal(progress.modes.hard.played.length, 0);
});

test("al cambiar de ciclo no se repite inmediatamente el último puzzle", () => {
  for (const mode of modes) {
    const progress = emptyModeProgress();
    const select = createSelector(progress, mode);
    const poolSize = mode === "all" ? 30 : 10;
    const cycle = Array.from({ length: poolSize }, () => select(mode));
    const next = select(mode);

    assert.notEqual(next, cycle.at(-1));
    assert.deepEqual(progress.modes[mode].played, [puzzles[next].id]);
  }
});

test("la persistencia normaliza datos corruptos y conserva sesiones válidas por modo", () => {
  const helperSources = [
    sourceBetween("indexToRowCol", "areAdjacent"),
    sourceBetween("areAdjacent", "getExpectedCheckpointNumber"),
    sourceBetween("getPuzzleIndicesForMode", "createEmptyModeState"),
    sourceBetween("createEmptyModeState", "normalizeSession"),
    sourceBetween("normalizeSession", "normalizeModeState"),
    sourceBetween("normalizeModeState", "loadModeProgress"),
    sourceBetween("loadModeProgress", "saveModeProgress")
  ].join("\n");
  const loadFromStorage = (storedValues) => Function(
    "window",
    "puzzles",
    `const MODE_PROGRESS_STORAGE_KEY = "test";
     const LEGACY_PUZZLE_CYCLE_STORAGE_KEY = "legacy";
     const MODES = ["all", "easy", "medium", "hard"];
     const GAME_STATES = { READY: "ready", ACTIVE: "active", PAUSED: "paused", COMPLETED: "completed" };
     ${helperSources}; return loadModeProgress();`
  )({ localStorage: { getItem: (key) => storedValues[key] ?? null } }, puzzles);
  const load = (storedValue) => loadFromStorage({ test: storedValue });

  assert.deepEqual(load("{inválido"), emptyModeProgress());
  assert.deepEqual(load("null"), emptyModeProgress());

  const migrated = loadFromStorage({ legacy: JSON.stringify({ played: [0, 0, 3, 99, "2"] }) });
  assert.deepEqual(migrated.modes.all.played, ["ruta-001", "ruta-004"]);
  assert.equal(migrated.modes.all.currentPuzzleId, "ruta-004");

  const easyPuzzle = puzzles.find(({ difficulty }) => difficulty === "easy");
  const stored = {
    currentMode: "easy",
    modes: {
      all: { played: ["ruta-999", easyPuzzle.id], currentPuzzleId: easyPuzzle.id },
      easy: {
        played: [easyPuzzle.id, easyPuzzle.id, "ruta-999"],
        currentPuzzleId: easyPuzzle.id,
        session: {
          path: easyPuzzle.solution.slice(0, 4),
          hintsUsed: 1,
          elapsedMs: 1500,
          gameState: "active",
          finalScore: 0
        }
      }
    }
  };
  const normalized = load(JSON.stringify(stored));
  assert.equal(normalized.currentMode, "easy");
  assert.deepEqual(normalized.modes.easy.played, [easyPuzzle.id]);
  assert.deepEqual(normalized.modes.easy.session.path, easyPuzzle.solution.slice(0, 4));
  assert.equal(normalized.modes.easy.session.gameState, "paused");
  assert.deepEqual(normalized.modes.all, {
    played: [easyPuzzle.id],
    currentPuzzleId: easyPuzzle.id,
    session: null
  });
});

test("recargar restaura el puzzle presentado sin avanzar el ciclo", () => {
  const restoreSource = sourceBetween("restoreCurrentMode", "changeDifficulty");
  assert.match(restoreSource, /storedIndex >= 0 \? storedIndex : selectNextPuzzle\(\)/);
  assert.match(source, /difficultySelect\.value = currentMode;\nrestoreCurrentMode\(\);\nsnapshotCurrentMode\(\);\s*$/);
});

test("cambiar dificultad guarda el modo saliente y restaura el entrante", () => {
  const changeSource = sourceBetween("changeDifficulty", "isBetterRecord");
  assert.match(changeSource, /snapshotCurrentMode\(\);[\s\S]*currentMode = mode;[\s\S]*restoreCurrentMode\(\);/);
  assert.match(html, /<option value="all" selected>Aleatorio<\/option>/);
  assert.match(html, /<option value="easy">Fácil<\/option>/);
  assert.match(html, /<option value="medium">Media<\/option>/);
  assert.match(html, /<option value="hard">Difícil<\/option>/);
  assert.match(html, /id="puzzleDifficultyValue"/);
});

test("los récords se normalizan por identidad única de puzzle", () => {
  const normalizeSource = sourceBetween("normalizeRecord", "validatePuzzle");
  const loadSource = sourceBetween("loadPuzzleRecords", "savePuzzleRecords");
  const load = (storedValue) => Function(
    "window",
    "puzzles",
    `const PUZZLE_RECORDS_STORAGE_KEY = "test"; ${normalizeSource}\n${loadSource}; return loadPuzzleRecords();`
  )({ localStorage: { getItem: () => storedValue } }, puzzles);
  const record = { score: 9000, timeSeconds: 20, moves: 25, hints: 1 };

  assert.deepEqual(load("{inválido"), {});
  assert.deepEqual(load(JSON.stringify({ "ruta-003": record, "ruta-999": record })), { "ruta-003": record });
  assert.deepEqual(load(JSON.stringify({ 2: record })), { "ruta-003": record });
  assert.match(source, /puzzleRecords\[currentPuzzle\.id\]/);
  assert.doesNotMatch(source, /puzzleRecords\[currentPuzzleIndex\]/);
});

test("se conservan puntaje, desempates, pistas y controles de v0.3.0", () => {
  const scoreSource = sourceBetween("calculateScore", "getDisplayedScore");
  const calculateScore = Function(
    `const SCORE_BASE = 10000;
     const SCORE_TIME_WEIGHT = 10;
     const SCORE_MOVE_WEIGHT = 5;
     const SCORE_HINT_WEIGHT = 500;
     ${scoreSource}; return calculateScore;`
  )();
  const recordSource = sourceBetween("isBetterRecord", "getRecordLabel");
  const isBetterRecord = Function(`${recordSource}; return isBetterRecord;`)();
  const current = { score: 9000, timeSeconds: 30, moves: 25, hints: 1 };

  assert.equal(calculateScore(20, 25, 1), 9175);
  assert.equal(isBetterRecord({ ...current, score: 9001 }, current), true);
  assert.equal(isBetterRecord({ ...current, timeSeconds: 29 }, current), true);
  assert.equal(isBetterRecord({ ...current, moves: 24 }, current), true);
  assert.equal(isBetterRecord({ ...current, hints: 0 }, current), false);
  assert.match(source, /function getHintIndex\(\)/);
  assert.match(source, /function undoMove\(\)/);
  assert.match(source, /function resetGame\(/);
  assert.match(source, /function pauseGame\(/);
  assert.match(source, /function newGame\(\) \{\n  currentPuzzleIndex = selectNextPuzzle\(\);/);
});
