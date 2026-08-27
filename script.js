const boardElement = document.querySelector("#board");
const statusText = document.querySelector("#statusText");
const statusBar = document.querySelector(".status-bar");
const levelValue = document.querySelector("#levelValue");
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
const BEST_RECORD_STORAGE_KEY = "nexar-ruta-best-record-v1";

// Cada tablero codifica una solución conocida y sus checkpoints obligatorios.
const puzzles = [
  {
    size: 5,
    checkpoints: { 0: 1, 4: 2, 8: 3, 14: 4, 18: 5, 24: 6 },
    solution: [0, 5, 10, 15, 20, 21, 16, 11, 6, 1, 2, 3, 4, 9, 8, 7, 12, 13, 14, 19, 18, 17, 22, 23, 24]
  },
  {
    size: 5,
    checkpoints: { 20: 1, 16: 2, 12: 3, 8: 4, 4: 5, 0: 6 },
    solution: [20, 15, 10, 5, 6, 11, 16, 21, 22, 17, 12, 7, 8, 13, 18, 23, 24, 19, 14, 9, 4, 3, 2, 1, 0]
  },
  {
    size: 5,
    checkpoints: { 0: 1, 10: 2, 22: 3, 14: 4, 4: 5 },
    solution: [0, 5, 10, 15, 20, 21, 16, 11, 6, 1, 2, 3, 8, 7, 12, 13, 18, 17, 22, 23, 24, 19, 14, 9, 4]
  }
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
let bestRecord = loadBestRecord();
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

function loadBestRecord() {
  try {
    if (!window.localStorage) return null;
    const rawValue = window.localStorage.getItem(BEST_RECORD_STORAGE_KEY);
    if (!rawValue) return null;
    return normalizeRecord(JSON.parse(rawValue));
  } catch (error) {
    return null;
  }
}

function saveBestRecord(record) {
  try {
    if (!window.localStorage) return;
    window.localStorage.setItem(BEST_RECORD_STORAGE_KEY, JSON.stringify(record));
  } catch (error) {
    // El juego sigue funcionando aunque el almacenamiento local falle o no exista.
  }
}

function isBetterRecord(candidate, currentRecord) {
  if (!currentRecord) return true;
  if (candidate.score !== currentRecord.score) return candidate.score > currentRecord.score;
  if (candidate.timeSeconds !== currentRecord.timeSeconds) return candidate.timeSeconds < currentRecord.timeSeconds;
  return candidate.moves < currentRecord.moves;
}

function getRecordLabel() {
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
  levelValue.textContent = currentPuzzleIndex + 1;
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

  if (candidateRecord && isBetterRecord(candidateRecord, bestRecord)) {
    bestRecord = candidateRecord;
    saveBestRecord(bestRecord);
    renderPath();
    setStatus(`¡Excelente! Completaste Nexar Ruta con ${formatScore(finalScore)} puntos. Nuevo récord local.`, "success");
    return;
  }

  renderPath();
  setStatus(`¡Excelente! Completaste Nexar Ruta con ${formatScore(finalScore)} puntos.`, "success");
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
}

function newGame() {
  let nextIndex = currentPuzzleIndex;
  if (puzzles.length > 1) {
    while (nextIndex === currentPuzzleIndex) {
      nextIndex = Math.floor(Math.random() * puzzles.length);
    }
  }
  currentPuzzleIndex = nextIndex;
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

createBoard();
setStatus("Tablero listo. Presioná Iniciar partida.", "ready");
