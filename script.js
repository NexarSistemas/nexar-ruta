const boardElement = document.querySelector("#board");
const statusText = document.querySelector("#statusText");
const statusBar = document.querySelector(".status-bar");
const movesValue = document.querySelector("#movesValue");
const levelValue = document.querySelector("#levelValue");
const undoButton = document.querySelector("#undoButton");
const resetButton = document.querySelector("#resetButton");
const newGameButton = document.querySelector("#newGameButton");

// MVP: tableros 5x5 con una solución garantizada.
// Cada tablero contiene una ruta Hamiltoniana completa.
// Los números visibles actúan como checkpoints obligatorios.
const puzzles = [
  {
    size: 5,
    checkpoints: { 0: 1, 4: 2, 8: 3, 14: 4, 18: 5, 24: 6 },
    solution: [0, 1, 2, 3, 4, 9, 8, 7, 6, 5, 10, 11, 12, 13, 14, 19, 18, 17, 16, 15, 20, 21, 22, 23, 24]
  },
  {
    size: 5,
    checkpoints: { 20: 1, 16: 2, 12: 3, 8: 4, 4: 5, 0: 6 },
    solution: [20, 21, 22, 23, 24, 19, 18, 17, 16, 15, 10, 11, 12, 13, 14, 9, 8, 7, 6, 5, 0, 1, 2, 3, 4]
  },
  {
    size: 5,
    checkpoints: { 0: 1, 10: 2, 22: 3, 14: 4, 4: 5 },
    solution: [0, 5, 10, 15, 20, 21, 16, 11, 6, 1, 2, 7, 12, 17, 22, 23, 18, 13, 8, 3, 4, 9, 14, 19, 24]
  }
];

let currentPuzzleIndex = 0;
let currentPuzzle = puzzles[currentPuzzleIndex];
let path = [];
let moves = 0;
let completed = false;

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
  statusBar.classList.remove("success", "error");
  if (type === "success") statusBar.classList.add("success");
  if (type === "error") statusBar.classList.add("error");
}

function createBoard() {
  boardElement.innerHTML = "";
  boardElement.style.setProperty("--size", currentPuzzle.size);
  const totalCells = currentPuzzle.size * currentPuzzle.size;

  for (let index = 0; index < totalCells; index += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.dataset.index = index;
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

    cell.addEventListener("click", () => handleCellClick(index));
    boardElement.appendChild(cell);
  }

  renderPath();
}

function renderPath() {
  const cells = boardElement.querySelectorAll(".cell");
  cells.forEach((cell) => {
    cell.classList.remove("path", "head");
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

  if (path.length > 0) cells[path[path.length - 1]].classList.add("head");
  movesValue.textContent = moves;
  undoButton.disabled = path.length === 0 || completed;
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

function handleCellClick(index) {
  if (completed) return;

  if (path.length === 0) {
    if (currentPuzzle.checkpoints[index] !== 1) {
      flashInvalid(index, "La ruta debe comenzar en el número 1.");
      return;
    }
    path.push(index);
    moves += 1;
    setStatus("Bien. Continuá hacia una casilla vecina.");
    renderPath();
    return;
  }

  const lastIndex = path[path.length - 1];
  if (index === lastIndex) return;

  const previousIndex = path[path.length - 2];
  if (index === previousIndex) {
    undoMove();
    return;
  }

  if (path.includes(index)) {
    flashInvalid(index, "No podés pasar dos veces por la misma casilla.");
    return;
  }

  if (!areAdjacent(lastIndex, index, currentPuzzle.size)) {
    flashInvalid(index, "Solo podés avanzar a una casilla vecina.");
    return;
  }

  if (!canVisitCheckpoint(index)) {
    flashInvalid(index, `Antes tenés que llegar al número ${getExpectedCheckpointNumber()}.`);
    return;
  }

  path.push(index);
  moves += 1;
  renderPath();
  validateProgress();
}

function validateProgress() {
  const totalCells = currentPuzzle.size * currentPuzzle.size;

  if (path.length !== totalCells) {
    const nextCheckpoint = getExpectedCheckpointNumber();
    const checkpointCount = Object.keys(currentPuzzle.checkpoints).length;
    setStatus(nextCheckpoint <= checkpointCount
      ? `Buscá el número ${nextCheckpoint} sin cortar la ruta.`
      : "Ya pasaste todos los números. Completá las casillas restantes.");
    return;
  }

  const checkpointCount = Object.keys(currentPuzzle.checkpoints).length;
  if (getExpectedCheckpointNumber() !== checkpointCount + 1) {
    setStatus("La grilla está completa, pero faltó respetar el orden de los números.", "error");
    return;
  }

  completed = true;
  renderPath();
  setStatus("¡Excelente! Completaste Nexar Ruta 🎉", "success");
}

function undoMove() {
  if (path.length === 0 || completed) return;
  path.pop();
  moves += 1;
  renderPath();
  setStatus(path.length === 0
    ? "Seleccioná el número 1 para comenzar."
    : "Movimiento deshecho. Continuá desde la última casilla.");
}

function resetGame() {
  path = [];
  moves = 0;
  completed = false;
  createBoard();
  setStatus("Seleccioná el número 1 para comenzar.");
}

function newGame() {
  let nextIndex = currentPuzzleIndex;
  if (puzzles.length > 1) {
    while (nextIndex === currentPuzzleIndex) nextIndex = Math.floor(Math.random() * puzzles.length);
  }
  currentPuzzleIndex = nextIndex;
  currentPuzzle = puzzles[currentPuzzleIndex];
  levelValue.textContent = currentPuzzleIndex + 1;
  resetGame();
}

undoButton.addEventListener("click", undoMove);
resetButton.addEventListener("click", resetGame);
newGameButton.addEventListener("click", newGame);

levelValue.textContent = currentPuzzleIndex + 1;
createBoard();
