const boardElement = document.querySelector("#board");
const statusText = document.querySelector("#statusText");
const statusBar = document.querySelector(".status-bar");
const cycleValue = document.querySelector("#cycleValue");
const stateValue = document.querySelector("#stateValue");
const timeValue = document.querySelector("#timeValue");
const movesValue = document.querySelector("#movesValue");
const scoreValue = document.querySelector("#scoreValue");
const bestScoreValue = document.querySelector("#bestScoreValue");
const startPauseButton = document.querySelector("#startPauseButton");
const hintButton = document.querySelector("#hintButton");
const undoButton = document.querySelector("#undoButton");
const resetButton = document.querySelector("#resetButton");
const newGameButton = document.querySelector("#newGameButton");
const difficultySelect = document.querySelector("#difficultySelect");
const puzzleDifficultyValue = document.querySelector("#puzzleDifficultyValue");

const GAME_STATES = {
  READY: "ready",
  ACTIVE: "active",
  PAUSED: "paused",
  COMPLETED: "completed"
};

const SCORE_BASE = 10000;
const SCORE_TIME_WEIGHT = 10;
const SCORE_MOVE_WEIGHT = 5;
const SCORE_HINT_WEIGHT = 500;
const PUZZLE_RECORDS_STORAGE_KEY = "nexar-ruta-puzzle-records-v1";
const LEGACY_PUZZLE_CYCLE_STORAGE_KEY = "nexar-ruta-puzzle-cycle-v1";
const MODE_PROGRESS_STORAGE_KEY = "nexar-ruta-mode-progress-v2";
const DIFFICULTIES = ["easy", "medium", "hard"];
const MODES = ["all", ...DIFFICULTIES];
const DIFFICULTY_LABELS = { easy: "Fácil", medium: "Media", hard: "Difícil" };

// La dificultad se apoya en una regla intencionalmente simple: easy conserva
// 6 checkpoints y recorridos de hasta 13 giros; medium mantiene 6 checkpoints
// pero usa rutas de 15 a 19 giros; hard ofrece solo 5 checkpoints, con tramos
// más largos. Cada tablero conserva una solución explícita conocida.
const puzzles = [
  { id: "ruta-001", size: 5, difficulty: "medium", checkpoints: { 0: 6, 2: 2, 8: 1, 14: 3, 16: 5, 17: 4 }, solution: [8, 9, 4, 3, 2, 7, 12, 13, 14, 19, 24, 23, 18, 17, 22, 21, 20, 15, 16, 11, 10, 5, 6, 1, 0] },
  { id: "ruta-002", size: 5, difficulty: "easy", checkpoints: { 0: 1, 4: 2, 6: 3, 13: 4, 16: 6, 18: 5 }, solution: [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 10, 11, 12, 13, 14, 19, 24, 23, 18, 17, 22, 21, 20, 15, 16] },
  { id: "ruta-003", size: 5, difficulty: "medium", checkpoints: { 2: 5, 6: 6, 9: 4, 16: 1, 18: 3, 22: 2 }, solution: [16, 15, 20, 21, 22, 23, 24, 19, 18, 17, 12, 13, 14, 9, 4, 3, 8, 7, 2, 1, 0, 5, 10, 11, 6] },
  { id: "ruta-004", size: 5, difficulty: "medium", checkpoints: { 0: 6, 4: 2, 12: 1, 14: 3, 16: 5, 17: 4 }, solution: [12, 7, 2, 3, 4, 9, 8, 13, 14, 19, 24, 23, 18, 17, 22, 21, 20, 15, 16, 11, 10, 5, 6, 1, 0] },
  { id: "ruta-005", size: 5, difficulty: "medium", checkpoints: { 2: 3, 8: 2, 11: 4, 14: 1, 16: 5, 18: 6 }, solution: [14, 9, 4, 3, 8, 13, 12, 7, 2, 1, 0, 5, 6, 11, 10, 15, 20, 21, 16, 17, 22, 23, 24, 19, 18] },
  { id: "ruta-006", size: 5, difficulty: "easy", checkpoints: { 3: 4, 8: 5, 10: 3, 16: 6, 18: 1, 22: 2 }, solution: [18, 19, 24, 23, 22, 21, 20, 15, 10, 5, 0, 1, 2, 3, 4, 9, 14, 13, 8, 7, 6, 11, 12, 17, 16] },
  { id: "ruta-007", size: 5, difficulty: "easy", checkpoints: { 0: 6, 4: 3, 12: 5, 17: 4, 20: 1, 24: 2 }, solution: [20, 21, 22, 23, 24, 19, 14, 9, 4, 3, 8, 13, 18, 17, 16, 15, 10, 11, 12, 7, 2, 1, 6, 5, 0] },
  { id: "ruta-008", size: 5, difficulty: "easy", checkpoints: { 2: 2, 8: 1, 10: 3, 11: 4, 14: 5, 22: 6 }, solution: [8, 9, 4, 3, 2, 1, 0, 5, 10, 15, 20, 21, 16, 11, 6, 7, 12, 13, 14, 19, 24, 23, 18, 17, 22] },
  { id: "ruta-009", size: 5, difficulty: "easy", checkpoints: { 2: 1, 6: 6, 14: 2, 16: 5, 17: 4, 18: 3 }, solution: [2, 3, 4, 9, 14, 19, 24, 23, 18, 13, 8, 7, 12, 17, 22, 21, 20, 15, 16, 11, 10, 5, 0, 1, 6] },
  { id: "ruta-010", size: 5, difficulty: "medium", checkpoints: { 2: 2, 6: 1, 8: 3, 15: 4, 18: 6, 22: 5 }, solution: [6, 5, 0, 1, 2, 3, 4, 9, 8, 7, 12, 11, 10, 15, 20, 21, 16, 17, 22, 23, 24, 19, 14, 13, 18] },
  { id: "ruta-011", size: 5, difficulty: "easy", checkpoints: { 2: 2, 6: 1, 13: 4, 14: 3, 16: 6, 22: 5 }, solution: [6, 5, 0, 1, 2, 3, 4, 9, 14, 19, 24, 23, 18, 13, 8, 7, 12, 17, 22, 21, 20, 15, 10, 11, 16] },
  { id: "ruta-012", size: 5, difficulty: "medium", checkpoints: { 4: 6, 6: 5, 11: 4, 16: 1, 22: 2, 24: 3 }, solution: [16, 15, 20, 21, 22, 17, 18, 23, 24, 19, 14, 13, 12, 11, 10, 5, 0, 1, 6, 7, 2, 3, 8, 9, 4] },
  { id: "ruta-013", size: 5, difficulty: "easy", checkpoints: { 0: 2, 2: 6, 14: 5, 16: 3, 19: 4, 20: 1 }, solution: [20, 15, 10, 5, 0, 1, 6, 11, 16, 21, 22, 23, 24, 19, 18, 17, 12, 13, 14, 9, 4, 3, 8, 7, 2] },
  { id: "ruta-014", size: 5, difficulty: "medium", checkpoints: { 2: 5, 9: 4, 10: 6, 16: 3, 18: 1, 22: 2 }, solution: [18, 19, 24, 23, 22, 21, 20, 15, 16, 17, 12, 13, 14, 9, 4, 3, 8, 7, 2, 1, 0, 5, 6, 11, 10] },
  { id: "ruta-015", size: 5, difficulty: "easy", checkpoints: { 0: 4, 4: 1, 12: 6, 18: 5, 19: 2, 21: 3 }, solution: [4, 9, 14, 19, 24, 23, 22, 21, 20, 15, 10, 5, 0, 1, 2, 3, 8, 13, 18, 17, 16, 11, 6, 7, 12] },
  { id: "ruta-016", size: 5, difficulty: "medium", checkpoints: { 0: 6, 8: 5, 10: 1, 13: 4, 16: 2, 22: 3 }, solution: [10, 15, 20, 21, 16, 11, 12, 17, 22, 23, 24, 19, 18, 13, 14, 9, 4, 3, 8, 7, 2, 1, 6, 5, 0] },
  { id: "ruta-017", size: 5, difficulty: "easy", checkpoints: { 6: 1, 8: 5, 9: 4, 10: 2, 12: 6, 22: 3 }, solution: [6, 1, 0, 5, 10, 15, 20, 21, 22, 23, 24, 19, 14, 9, 4, 3, 2, 7, 8, 13, 18, 17, 16, 11, 12] },
  { id: "ruta-018", size: 5, difficulty: "easy", checkpoints: { 0: 6, 8: 5, 12: 4, 17: 3, 20: 1, 23: 2 }, solution: [20, 21, 22, 23, 24, 19, 18, 17, 16, 15, 10, 11, 12, 13, 14, 9, 4, 3, 8, 7, 2, 1, 6, 5, 0] },
  { id: "ruta-019", size: 5, difficulty: "medium", checkpoints: { 2: 4, 8: 1, 9: 2, 10: 5, 22: 6, 23: 3 }, solution: [8, 3, 4, 9, 14, 19, 24, 23, 18, 13, 12, 7, 2, 1, 0, 5, 6, 11, 10, 15, 20, 21, 16, 17, 22] },
  { id: "ruta-020", size: 5, difficulty: "medium", checkpoints: { 4: 3, 6: 6, 14: 2, 16: 5, 17: 4, 18: 1 }, solution: [18, 23, 24, 19, 14, 13, 8, 9, 4, 3, 2, 7, 12, 17, 22, 21, 20, 15, 16, 11, 10, 5, 0, 1, 6] },
  { id: "ruta-021", size: 5, difficulty: "hard", checkpoints: { 0: 1, 8: 2, 12: 3, 18: 5, 22: 4 }, solution: [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 10, 11, 12, 13, 14, 19, 24, 23, 22, 21, 20, 15, 16, 17, 18] },
  { id: "ruta-022", size: 5, difficulty: "hard", checkpoints: { 4: 1, 8: 3, 10: 2, 18: 4, 22: 5 }, solution: [4, 3, 2, 1, 0, 5, 10, 11, 6, 7, 12, 13, 8, 9, 14, 19, 24, 23, 18, 17, 16, 15, 20, 21, 22] },
  { id: "ruta-023", size: 5, difficulty: "hard", checkpoints: { 4: 2, 6: 4, 10: 5, 18: 1, 22: 3 }, solution: [18, 23, 24, 19, 14, 9, 4, 3, 8, 13, 12, 17, 22, 21, 20, 15, 16, 11, 6, 7, 2, 1, 0, 5, 10] },
  { id: "ruta-024", size: 5, difficulty: "hard", checkpoints: { 2: 4, 6: 1, 20: 3, 22: 2, 24: 5 }, solution: [6, 7, 8, 13, 18, 23, 22, 17, 12, 11, 16, 21, 20, 15, 10, 5, 0, 1, 2, 3, 4, 9, 14, 19, 24] },
  { id: "ruta-025", size: 5, difficulty: "hard", checkpoints: { 4: 3, 6: 1, 10: 2, 18: 5, 22: 4 }, solution: [6, 11, 16, 21, 20, 15, 10, 5, 0, 1, 2, 3, 4, 9, 8, 7, 12, 17, 22, 23, 24, 19, 14, 13, 18] },
  { id: "ruta-026", size: 5, difficulty: "hard", checkpoints: { 2: 2, 10: 3, 12: 1, 18: 5, 22: 4 }, solution: [12, 7, 8, 9, 4, 3, 2, 1, 0, 5, 6, 11, 10, 15, 20, 21, 16, 17, 22, 23, 24, 19, 14, 13, 18] },
  { id: "ruta-027", size: 5, difficulty: "hard", checkpoints: { 0: 1, 4: 5, 8: 3, 16: 2, 24: 4 }, solution: [0, 5, 10, 15, 20, 21, 16, 11, 6, 1, 2, 3, 8, 7, 12, 17, 22, 23, 24, 19, 18, 13, 14, 9, 4] },
  { id: "ruta-028", size: 5, difficulty: "hard", checkpoints: { 0: 3, 8: 2, 16: 4, 22: 5, 24: 1 }, solution: [24, 23, 18, 19, 14, 13, 8, 9, 4, 3, 2, 1, 0, 5, 10, 15, 20, 21, 16, 11, 6, 7, 12, 17, 22] },
  { id: "ruta-029", size: 5, difficulty: "hard", checkpoints: { 2: 3, 8: 1, 12: 4, 16: 5, 24: 2 }, solution: [8, 13, 18, 17, 22, 23, 24, 19, 14, 9, 4, 3, 2, 1, 0, 5, 6, 7, 12, 11, 10, 15, 20, 21, 16] },
  { id: "ruta-030", size: 5, difficulty: "hard", checkpoints: { 0: 3, 8: 1, 10: 4, 14: 2, 16: 5 }, solution: [8, 13, 18, 23, 24, 19, 14, 9, 4, 3, 2, 1, 0, 5, 6, 7, 12, 11, 10, 15, 20, 21, 22, 17, 16] }
];

let currentPuzzleIndex = 0;
let currentPuzzle = puzzles[currentPuzzleIndex];
let gameState = GAME_STATES.READY;
let path = [];
let moves = 0;
let hintsUsed = 0;
let highlightedHintIndex = null;
let elapsedMs = 0;
let timerStartedAt = 0;
let timerIntervalId = null;
let finalScore = 0;
let puzzleRecords = loadPuzzleRecords();
let modeProgress = loadModeProgress();
let currentMode = modeProgress.currentMode;
let dragState = { active: false, pointerId: null };

function indexToRowCol(index, size) {
  return { row: Math.floor(index / size), col: index % size };
}

function areAdjacent(first, second, size) {
  const a = indexToRowCol(first, size);
  const b = indexToRowCol(second, size);
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

function getExpectedCheckpointNumber() {
  const usedCheckpointNumbers = path.map((index) => currentPuzzle.checkpoints[index]).filter(Boolean);
  return usedCheckpointNumbers.length === 0 ? 1 : Math.max(...usedCheckpointNumbers) + 1;
}

function setStatus(message, type = "normal") {
  statusText.textContent = message;
  statusBar.classList.remove("ready", "paused", "success", "error");

  if (type === "ready") statusBar.classList.add("ready");
  if (type === "paused") statusBar.classList.add("paused");
  if (type === "success") statusBar.classList.add("success");
  if (type === "error") statusBar.classList.add("error");
}

function formatTime(totalMs) {
  const totalSeconds = Math.floor(totalMs / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatScore(score) {
  return new Intl.NumberFormat("es-AR").format(score);
}

function getElapsedMs() {
  if (gameState !== GAME_STATES.ACTIVE) return elapsedMs;
  return elapsedMs + (Date.now() - timerStartedAt);
}

function getElapsedSeconds() {
  return Math.floor(getElapsedMs() / 1000);
}

function calculateScore(seconds, totalMoves, usedHints) {
  return Math.max(
    0,
    SCORE_BASE - (seconds * SCORE_TIME_WEIGHT) - (totalMoves * SCORE_MOVE_WEIGHT) - (usedHints * SCORE_HINT_WEIGHT)
  );
}

function getDisplayedScore() {
  return gameState === GAME_STATES.COMPLETED
    ? finalScore
    : calculateScore(getElapsedSeconds(), moves, hintsUsed);
}

function normalizeRecord(candidate) {
  const isValid = candidate
    && Number.isFinite(candidate.score)
    && Number.isFinite(candidate.timeSeconds)
    && Number.isFinite(candidate.moves)
    && Number.isFinite(candidate.hints)
    && candidate.score >= 0
    && candidate.timeSeconds >= 0
    && candidate.moves >= 0
    && candidate.hints >= 0;

  if (!isValid) return null;

  return {
    score: Math.floor(candidate.score),
    timeSeconds: Math.floor(candidate.timeSeconds),
    moves: Math.floor(candidate.moves),
    hints: Math.floor(candidate.hints)
  };
}

function validatePuzzle(puzzle, puzzleIndex) {
  const totalCells = puzzle.size * puzzle.size;
  const { solution, checkpoints } = puzzle;
  const checkpointEntries = Object.entries(checkpoints).map(([index, number]) => ({ index: Number(index), number }));

  if (!/^ruta-\d{3}$/.test(puzzle.id) || !DIFFICULTIES.includes(puzzle.difficulty)) {
    throw new Error(`Puzzle ${puzzleIndex + 1}: identidad o dificultad inválida.`);
  }
  if (solution.length !== totalCells) throw new Error(`Puzzle ${puzzleIndex + 1}: longitud inválida.`);
  if (solution.some((index) => !Number.isInteger(index) || index < 0 || index >= totalCells)) {
    throw new Error(`Puzzle ${puzzleIndex + 1}: índice inválido.`);
  }
  if (new Set(solution).size !== totalCells) throw new Error(`Puzzle ${puzzleIndex + 1}: hay casillas repetidas.`);
  if (solution.slice(1).some((index, order) => !areAdjacent(solution[order], index, puzzle.size))) {
    throw new Error(`Puzzle ${puzzleIndex + 1}: hay pasos no ortogonales.`);
  }

  const checkpointOrder = checkpointEntries
    .sort((a, b) => a.number - b.number)
    .map(({ index, number }, order) => {
      if (!Number.isInteger(index) || index < 0 || index >= totalCells || number !== order + 1) {
        throw new Error(`Puzzle ${puzzleIndex + 1}: checkpoints inválidos.`);
      }
      return solution.indexOf(index);
    });

  if (checkpointOrder.length === 0 || checkpointOrder[0] !== 0) {
    throw new Error(`Puzzle ${puzzleIndex + 1}: la solución debe comenzar en el checkpoint 1.`);
  }
  if (checkpointOrder.some((position, order) => position === -1 || (order > 0 && position <= checkpointOrder[order - 1]))) {
    throw new Error(`Puzzle ${puzzleIndex + 1}: checkpoints fuera de orden.`);
  }
}

function validatePuzzles() {
  if (puzzles.length !== 30) throw new Error("El banco debe contener exactamente 30 puzzles.");
  if (new Set(puzzles.map(({ id }) => id)).size !== puzzles.length) throw new Error("Hay identidades de puzzle repetidas.");
  DIFFICULTIES.forEach((difficulty) => {
    if (puzzles.filter((puzzle) => puzzle.difficulty === difficulty).length !== 10) {
      throw new Error(`La dificultad ${difficulty} debe contener exactamente 10 puzzles.`);
    }
  });
  puzzles.forEach(validatePuzzle);
}

function loadPuzzleRecords() {
  try {
    if (!window.localStorage) return {};
    const storedRecords = JSON.parse(window.localStorage.getItem(PUZZLE_RECORDS_STORAGE_KEY) || "{}");
    if (!storedRecords || typeof storedRecords !== "object" || Array.isArray(storedRecords)) return {};
    let hasLegacyRecords = false;
    const normalizedRecords = {};

    Object.entries(storedRecords).forEach(([storedId, candidate]) => {
      const legacyIndex = Number(storedId);
      const isLegacyId = /^(0|[1-9]\d*)$/.test(storedId)
        && Number.isInteger(legacyIndex)
        && legacyIndex >= 0
        && legacyIndex < 20;
      const puzzleId = puzzles.some(({ id }) => id === storedId)
        ? storedId
        : (isLegacyId ? puzzles[legacyIndex].id : null);
      const record = normalizeRecord(candidate);

      if (isLegacyId) hasLegacyRecords = true;
      if (puzzleId && record && isBetterRecord(record, normalizedRecords[puzzleId])) {
        normalizedRecords[puzzleId] = record;
      }
    });

    if (hasLegacyRecords) {
      try {
        window.localStorage.setItem(PUZZLE_RECORDS_STORAGE_KEY, JSON.stringify(normalizedRecords));
      } catch (error) {
        // La lectura sigue siendo válida aunque la migración no pueda persistirse.
      }
    }
    return normalizedRecords;
  } catch (error) {
    return {};
  }
}

function savePuzzleRecords() {
  try {
    if (!window.localStorage) return;
    window.localStorage.setItem(PUZZLE_RECORDS_STORAGE_KEY, JSON.stringify(puzzleRecords));
  } catch (error) {
    // El juego sigue funcionando aunque el almacenamiento local falle o no exista.
  }
}

function getPuzzleIndicesForMode(mode) {
  return puzzles
    .map((puzzle, index) => ({ puzzle, index }))
    .filter(({ puzzle }) => mode === "all" || puzzle.difficulty === mode)
    .map(({ index }) => index);
}

function createEmptyModeState() {
  return { played: [], currentPuzzleId: null, session: null };
}

function normalizeSession(candidate, puzzle) {
  if (!candidate || typeof candidate !== "object" || !puzzle) return null;
  const candidatePath = Array.isArray(candidate.path) ? candidate.path : [];
  let expectedCheckpoint = 1;
  const validPath = candidatePath.length <= puzzle.solution.length
    && new Set(candidatePath).size === candidatePath.length
    && candidatePath.every((index, order) => {
      if (!Number.isInteger(index) || index < 0 || index >= puzzle.solution.length) return false;
      if (order > 0 && !areAdjacent(candidatePath[order - 1], index, puzzle.size)) return false;
      const checkpoint = puzzle.checkpoints[index];
      if (checkpoint && checkpoint !== expectedCheckpoint) return false;
      if (checkpoint) expectedCheckpoint += 1;
      return true;
    });
  if (!validPath || (candidatePath.length > 0 && puzzle.checkpoints[candidatePath[0]] !== 1)) return null;

  const storedState = Object.values(GAME_STATES).includes(candidate.gameState) ? candidate.gameState : GAME_STATES.READY;
  const completed = storedState === GAME_STATES.COMPLETED && candidatePath.length === puzzle.solution.length;
  const hintsUsed = Number.isInteger(candidate.hintsUsed) && candidate.hintsUsed >= 0 ? candidate.hintsUsed : 0;
  const elapsedMs = Number.isFinite(candidate.elapsedMs) && candidate.elapsedMs >= 0 ? Math.floor(candidate.elapsedMs) : 0;
  return {
    path: [...candidatePath],
    hintsUsed,
    elapsedMs,
    gameState: completed
      ? GAME_STATES.COMPLETED
      : (storedState === GAME_STATES.READY && candidatePath.length === 0 ? GAME_STATES.READY : GAME_STATES.PAUSED),
    finalScore: completed
      ? calculateScore(Math.floor(elapsedMs / 1000), candidatePath.length, hintsUsed)
      : 0
  };
}

function normalizeModeState(candidate, mode) {
  const poolIds = getPuzzleIndicesForMode(mode).map((index) => puzzles[index].id);
  let played = Array.isArray(candidate?.played)
    ? [...new Set(candidate.played.filter((id) => poolIds.includes(id)))]
    : [];
  const currentPuzzleId = poolIds.includes(candidate?.currentPuzzleId) ? candidate.currentPuzzleId : null;
  if (currentPuzzleId) played = [...played.filter((id) => id !== currentPuzzleId), currentPuzzleId];
  const puzzle = puzzles.find(({ id }) => id === currentPuzzleId);
  return {
    played,
    currentPuzzleId,
    session: normalizeSession(candidate?.session, puzzle)
  };
}

function loadModeProgress() {
  try {
    const emptyModes = Object.fromEntries(MODES.map((mode) => [mode, createEmptyModeState()]));
    if (!window.localStorage) return { currentMode: "all", modes: emptyModes };
    const storedValue = window.localStorage.getItem(MODE_PROGRESS_STORAGE_KEY);
    if (!storedValue) {
      const legacyProgress = JSON.parse(window.localStorage.getItem(LEGACY_PUZZLE_CYCLE_STORAGE_KEY) || "{}");
      const played = Array.isArray(legacyProgress.played)
        ? [...new Set(legacyProgress.played
          .filter((index) => Number.isInteger(index) && index >= 0 && index < 20)
          .map((index) => puzzles[index].id))]
        : [];
      emptyModes.all = {
        played,
        currentPuzzleId: played.at(-1) ?? null,
        session: null
      };
      return { currentMode: "all", modes: emptyModes };
    }

    const storedProgress = JSON.parse(storedValue);
    const currentMode = MODES.includes(storedProgress?.currentMode) ? storedProgress.currentMode : "all";
    return {
      currentMode,
      modes: Object.fromEntries(MODES.map((mode) => [mode, normalizeModeState(storedProgress?.modes?.[mode], mode)]))
    };
  } catch (error) {
    return {
      currentMode: "all",
      modes: Object.fromEntries(MODES.map((mode) => [mode, createEmptyModeState()]))
    };
  }
}

function saveModeProgress() {
  try {
    if (!window.localStorage) return;
    window.localStorage.setItem(MODE_PROGRESS_STORAGE_KEY, JSON.stringify(modeProgress));
  } catch (error) {
    // El juego sigue funcionando aunque el almacenamiento local falle o no exista.
  }
}

function getCurrentModeState() {
  return modeProgress.modes[currentMode];
}

function selectNextPuzzle(mode = currentMode) {
  const modeState = modeProgress.modes[mode];
  const poolIndices = getPuzzleIndicesForMode(mode);
  const poolIds = poolIndices.map((index) => puzzles[index].id);
  const previousPuzzleId = modeState.played.at(-1) ?? null;
  if (modeState.played.length >= poolIds.length) modeState.played = [];

  let available = poolIndices.filter((index) => !modeState.played.includes(puzzles[index].id));
  if (modeState.played.length === 0 && poolIds.length > 1 && previousPuzzleId !== null) {
    available = available.filter((index) => puzzles[index].id !== previousPuzzleId);
  }

  const nextIndex = available[Math.floor(Math.random() * available.length)];
  modeState.played.push(puzzles[nextIndex].id);
  modeState.currentPuzzleId = puzzles[nextIndex].id;
  modeState.session = null;
  saveModeProgress();
  return nextIndex;
}

function snapshotCurrentMode() {
  const modeState = getCurrentModeState();
  modeState.currentPuzzleId = currentPuzzle.id;
  modeState.session = {
    path: [...path],
    hintsUsed,
    elapsedMs: getElapsedMs(),
    gameState: gameState === GAME_STATES.ACTIVE ? GAME_STATES.PAUSED : gameState
  };
  modeProgress.currentMode = currentMode;
  saveModeProgress();
}

function restoreCurrentMode() {
  const modeState = getCurrentModeState();
  const storedIndex = puzzles.findIndex(({ id }) => id === modeState.currentPuzzleId);
  currentPuzzleIndex = storedIndex >= 0 ? storedIndex : selectNextPuzzle();
  currentPuzzle = puzzles[currentPuzzleIndex];

  const session = normalizeSession(modeState.session, currentPuzzle);
  path = session?.path ?? [];
  moves = path.length;
  hintsUsed = session?.hintsUsed ?? 0;
  elapsedMs = session?.elapsedMs ?? 0;
  gameState = session?.gameState ?? GAME_STATES.READY;
  finalScore = session?.finalScore ?? 0;
  highlightedHintIndex = null;
  timerStartedAt = 0;
  stopTimer();
  stopDragging();
  createBoard();

  if (gameState === GAME_STATES.COMPLETED) {
    setStatus("Puzzle completado. Podés iniciar una nueva partida.", "success");
  } else if (gameState === GAME_STATES.PAUSED) {
    setStatus("Progreso restaurado. Presioná Reanudar para seguir.", "paused");
  } else {
    setStatus("Tablero listo. Presioná Iniciar partida.", "ready");
  }
}

function changeDifficulty(mode) {
  if (!MODES.includes(mode) || mode === currentMode) return;
  if (gameState === GAME_STATES.ACTIVE) pauseGame();
  snapshotCurrentMode();
  currentMode = mode;
  modeProgress.currentMode = mode;
  difficultySelect.value = mode;
  restoreCurrentMode();
  snapshotCurrentMode();
}

function isBetterRecord(candidate, currentRecord) {
  if (!currentRecord) return true;
  if (candidate.score !== currentRecord.score) return candidate.score > currentRecord.score;
  if (candidate.timeSeconds !== currentRecord.timeSeconds) return candidate.timeSeconds < currentRecord.timeSeconds;
  return candidate.moves < currentRecord.moves;
}

function getRecordLabel() {
  const bestRecord = puzzleRecords[currentPuzzle.id];
  if (!bestRecord) return "Sin récord";
  return `${formatScore(bestRecord.score)} pts · ${formatTime(bestRecord.timeSeconds * 1000)} · ${bestRecord.moves} mov`;
}

function getStateLabel() {
  if (gameState === GAME_STATES.ACTIVE) return "Activa";
  if (gameState === GAME_STATES.PAUSED) return "Pausada";
  if (gameState === GAME_STATES.COMPLETED) return "Terminada";
  return "Lista";
}

function updateStats() {
  const poolSize = getPuzzleIndicesForMode(currentMode).length;
  cycleValue.textContent = `Puzzle ${getCurrentModeState().played.length} de ${poolSize}`;
  puzzleDifficultyValue.textContent = DIFFICULTY_LABELS[currentPuzzle.difficulty];
  stateValue.textContent = getStateLabel();
  timeValue.textContent = formatTime(getElapsedMs());
  movesValue.textContent = moves;
  scoreValue.textContent = formatScore(getDisplayedScore());
  bestScoreValue.textContent = getRecordLabel();
}

function updateControls() {
  const isActive = gameState === GAME_STATES.ACTIVE;
  const isPaused = gameState === GAME_STATES.PAUSED;
  const isCompleted = gameState === GAME_STATES.COMPLETED;

  startPauseButton.textContent = isActive
    ? "Pausar"
    : (isPaused ? "Reanudar" : "Iniciar partida");
  startPauseButton.disabled = isCompleted;
  hintButton.disabled = !isActive;
  undoButton.disabled = !isActive || path.length === 0;

  boardElement.querySelectorAll(".cell").forEach((cell) => {
    cell.disabled = !isActive;
  });
}

function renderPath() {
  const cells = boardElement.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.classList.remove("path", "head", "hinted");
    const orderMarker = cell.querySelector(".cell-order");
    if (orderMarker) orderMarker.remove();
  });

  path.forEach((index, order) => {
    const cell = cells[index];
    cell.classList.add("path");
    const marker = document.createElement("span");
    marker.className = "cell-order";
    marker.textContent = order + 1;
    marker.setAttribute("aria-hidden", "true");
    cell.appendChild(marker);
  });

  if (path.length > 0) {
    cells[path[path.length - 1]].classList.add("head");
  }

  if (highlightedHintIndex !== null && cells[highlightedHintIndex]) {
    cells[highlightedHintIndex].classList.add("hinted");
  }

  updateStats();
  updateControls();
}

function createBoard() {
  boardElement.innerHTML = "";
  boardElement.style.setProperty("--size", currentPuzzle.size);
  const totalCells = currentPuzzle.size * currentPuzzle.size;

  for (let index = 0; index < totalCells; index += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = String(index);
    cell.setAttribute("role", "gridcell");
    const checkpoint = currentPuzzle.checkpoints[index];

    if (checkpoint) {
      cell.classList.add("fixed");
      cell.innerHTML = `<span class="cell-number">${checkpoint}</span>`;
      cell.setAttribute("aria-label", `Casilla ${index + 1}, número ${checkpoint}`);
    } else {
      cell.innerHTML = '<span class="cell-number" aria-hidden="true"></span>';
      cell.setAttribute("aria-label", `Casilla ${index + 1}`);
    }

    cell.addEventListener("click", (event) => {
      if (event.detail !== 0) return;
      handleCellInteraction(index);
    });
    cell.addEventListener("pointerdown", (event) => handlePointerDown(event, index));
    cell.addEventListener("pointerenter", (event) => handlePointerEnter(event, index));
    boardElement.appendChild(cell);
  }

  renderPath();
}

function flashInvalid(index, message) {
  const cell = boardElement.querySelector(`[data-index="${index}"]`);
  if (cell) {
    cell.classList.remove("wrong");
    void cell.offsetWidth;
    cell.classList.add("wrong");
  }
  setStatus(message, "error");
}

function canVisitCheckpoint(index) {
  const checkpointNumber = currentPuzzle.checkpoints[index];
  return !checkpointNumber || checkpointNumber === getExpectedCheckpointNumber();
}

function clearHint() {
  highlightedHintIndex = null;
}

function syncMoveCount() {
  moves = path.length;
}

function isPathAlignedWithSolution() {
  return path.every((index, order) => currentPuzzle.solution[order] === index);
}

function isValidForwardStep(index) {
  if (path.length === 0) {
    return currentPuzzle.checkpoints[index] === 1;
  }

  const lastIndex = path[path.length - 1];
  if (index === lastIndex || path.includes(index)) return false;
  if (!areAdjacent(lastIndex, index, currentPuzzle.size)) return false;
  return canVisitCheckpoint(index);
}

function getHintIndex() {
  if (!isPathAlignedWithSolution()) return null;

  const hintIndex = currentPuzzle.solution[path.length];
  if (hintIndex === undefined) return null;
  return isValidForwardStep(hintIndex) ? hintIndex : null;
}

function handleCellInteraction(index) {
  if (gameState !== GAME_STATES.ACTIVE) return false;

  if (path.length === 0) {
    if (!isValidForwardStep(index)) {
      flashInvalid(index, "La ruta debe comenzar en el número 1.");
      return false;
    }

    clearHint();
    path.push(index);
    syncMoveCount();
    renderPath();
    setStatus("Bien. Continuá hacia una casilla vecina.");
    snapshotCurrentMode();
    return true;
  }

  const lastIndex = path[path.length - 1];
  if (index === lastIndex) return false;

  const previousIndex = path[path.length - 2];
  if (index === previousIndex) {
    undoMove();
    return true;
  }

  if (path.includes(index)) {
    flashInvalid(index, "No podés pasar dos veces por la misma casilla.");
    return false;
  }

  if (!areAdjacent(lastIndex, index, currentPuzzle.size)) {
    flashInvalid(index, "Solo podés avanzar a una casilla vecina.");
    return false;
  }

  if (!canVisitCheckpoint(index)) {
    flashInvalid(index, `Antes tenés que llegar al número ${getExpectedCheckpointNumber()}.`);
    return false;
  }

  clearHint();
  path.push(index);
  syncMoveCount();
  renderPath();
  validateProgress();
  snapshotCurrentMode();
  return true;
}

function validateProgress() {
  const totalCells = currentPuzzle.size * currentPuzzle.size;

  if (path.length !== totalCells) {
    const nextCheckpoint = getExpectedCheckpointNumber();
    const checkpointCount = Object.keys(currentPuzzle.checkpoints).length;
    setStatus(
      nextCheckpoint <= checkpointCount
        ? `Buscá el número ${nextCheckpoint} sin cortar la ruta.`
        : "Ya pasaste todos los números. Completá las casillas restantes."
    );
    return;
  }

  const checkpointCount = Object.keys(currentPuzzle.checkpoints).length;
  if (getExpectedCheckpointNumber() !== checkpointCount + 1) {
    setStatus("La grilla está completa, pero faltó respetar el orden de los números.", "error");
    return;
  }

  completeGame();
}

function stopTimer() {
  if (timerIntervalId !== null) {
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
}

function startTimer() {
  stopTimer();
  timerStartedAt = Date.now();
  timerIntervalId = window.setInterval(() => {
    updateStats();
  }, 250);
}

function stopDragging() {
  dragState.active = false;
  dragState.pointerId = null;
}

function pauseGame(reason = "manual") {
  if (gameState !== GAME_STATES.ACTIVE) return;

  elapsedMs += Date.now() - timerStartedAt;
  timerStartedAt = 0;
  stopTimer();
  stopDragging();
  gameState = GAME_STATES.PAUSED;
  renderPath();
  setStatus(
    reason === "auto"
      ? "Partida pausada automáticamente. Presioná Reanudar para seguir."
      : "Partida pausada. Presioná Reanudar para seguir.",
    "paused"
  );
  snapshotCurrentMode();
}

function startGame() {
  if (gameState !== GAME_STATES.READY && gameState !== GAME_STATES.PAUSED) return;

  gameState = GAME_STATES.ACTIVE;
  startTimer();
  renderPath();
  setStatus(
    path.length === 0
      ? "Partida en curso. Seleccioná el número 1 para comenzar."
      : "Partida reanudada. Continuá el recorrido."
  );
  snapshotCurrentMode();
}

function completeGame() {
  if (gameState === GAME_STATES.COMPLETED) return;

  elapsedMs += Date.now() - timerStartedAt;
  timerStartedAt = 0;
  stopTimer();
  stopDragging();
  gameState = GAME_STATES.COMPLETED;
  finalScore = calculateScore(getElapsedSeconds(), moves, hintsUsed);

  const candidateRecord = normalizeRecord({
    score: finalScore,
    timeSeconds: getElapsedSeconds(),
    moves,
    hints: hintsUsed
  });

  const currentRecord = puzzleRecords[currentPuzzle.id];
  if (candidateRecord && isBetterRecord(candidateRecord, currentRecord)) {
    puzzleRecords[currentPuzzle.id] = candidateRecord;
    savePuzzleRecords();
    renderPath();
    setStatus(`¡Excelente! Completaste Nexar Ruta con ${formatScore(finalScore)} puntos. Nuevo récord local.`, "success");
    snapshotCurrentMode();
    return;
  }

  renderPath();
  setStatus(`¡Excelente! Completaste Nexar Ruta con ${formatScore(finalScore)} puntos.`, "success");
  snapshotCurrentMode();
}

function undoMove() {
  if (gameState !== GAME_STATES.ACTIVE || path.length === 0) return;

  path.pop();
  clearHint();
  syncMoveCount();
  renderPath();
  setStatus(
    path.length === 0
      ? "Volviste al inicio. Elegí el número 1 para continuar."
      : "Movimiento deshecho. Continuá desde la última casilla."
  );
  snapshotCurrentMode();
}

function resetGame(message = "Tablero listo. Presioná Iniciar partida.") {
  stopTimer();
  stopDragging();
  currentPuzzle = puzzles[currentPuzzleIndex];
  gameState = GAME_STATES.READY;
  path = [];
  moves = 0;
  hintsUsed = 0;
  highlightedHintIndex = null;
  elapsedMs = 0;
  timerStartedAt = 0;
  finalScore = 0;
  createBoard();
  setStatus(message, "ready");
  snapshotCurrentMode();
}

function newGame() {
  currentPuzzleIndex = selectNextPuzzle();
  resetGame("Nuevo tablero listo. Presioná Iniciar partida.");
}

function applyHint() {
  if (gameState !== GAME_STATES.ACTIVE) return;

  const hintIndex = getHintIndex();
  if (hintIndex === null) {
    setStatus(
      "La pista solo puede sugerir el siguiente paso si tu recorrido coincide con la solución conocida. Deshacé o reiniciá para alinearte.",
      "error"
    );
    return;
  }

  highlightedHintIndex = hintIndex;
  hintsUsed += 1;
  renderPath();
  setStatus("Pista aplicada. La siguiente casilla sugerida quedó resaltada.");
  snapshotCurrentMode();
}

function handleStartPauseAction() {
  if (gameState === GAME_STATES.ACTIVE) {
    pauseGame();
    return;
  }

  if (gameState === GAME_STATES.READY || gameState === GAME_STATES.PAUSED) {
    startGame();
  }
}

function handlePointerDown(event, index) {
  if (gameState !== GAME_STATES.ACTIVE) return;
  if (event.pointerType !== "touch" && event.button !== 0) return;

  event.preventDefault();
  dragState.active = true;
  dragState.pointerId = event.pointerId;
  handleCellInteraction(index);
}

function handlePointerEnter(event, index) {
  if (!dragState.active || dragState.pointerId !== event.pointerId) return;

  if (event.pointerType !== "touch" && event.buttons === 0) {
    stopDragging();
    return;
  }

  handleCellInteraction(index);
}

function handleBoardPointerMove(event) {
  if (!dragState.active || dragState.pointerId !== event.pointerId) return;

  if (event.pointerType !== "touch" && event.buttons === 0) {
    stopDragging();
    return;
  }

  const targetCell = document.elementFromPoint(event.clientX, event.clientY)?.closest(".cell");
  if (!targetCell || !boardElement.contains(targetCell)) return;
  handleCellInteraction(Number(targetCell.dataset.index));
}

startPauseButton.addEventListener("click", handleStartPauseAction);
hintButton.addEventListener("click", applyHint);
undoButton.addEventListener("click", undoMove);
resetButton.addEventListener("click", () => resetGame());
newGameButton.addEventListener("click", newGame);
difficultySelect.addEventListener("change", (event) => changeDifficulty(event.target.value));
boardElement.addEventListener("pointermove", handleBoardPointerMove);

window.addEventListener("pointerup", stopDragging);
window.addEventListener("pointercancel", stopDragging);
window.addEventListener("blur", () => {
  stopDragging();
  pauseGame("auto");
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") {
    stopDragging();
    pauseGame("auto");
  }
});

window.addEventListener("beforeunload", snapshotCurrentMode);

validatePuzzles();
difficultySelect.value = currentMode;
restoreCurrentMode();
snapshotCurrentMode();
