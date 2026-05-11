const SIZE = 3;
const board = document.getElementById('board');
const message = document.getElementById('message');
const statusLabel = document.getElementById('status');
const toleranceControl = document.getElementById('tolerance');
const shuffleBtn = document.getElementById('shuffle');
const startTrackingBtn = document.getElementById('startTracking');

let pieces = [];
let selectedPiece = null;
let tracking = false;
let gaze = { x: 0, y: 0 };
let snapTolerance = Number(toleranceControl.value);

const image = new Image();
image.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=80';
image.onload = () => {
  createPieces();
  shufflePieces();
};

function createPieces() {
  board.innerHTML = '';
  pieces = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const piece = document.createElement('button');
      piece.className = 'piece';
      piece.setAttribute('aria-label', `Piece ${row * SIZE + col + 1}`);
      piece.dataset.correctX = String(col);
      piece.dataset.correctY = String(row);
      piece.style.backgroundImage = `url(${image.src})`;
      piece.style.backgroundSize = `${SIZE * 100}% ${SIZE * 100}%`;
      piece.style.backgroundPosition = `${(col / (SIZE - 1)) * 100}% ${(row / (SIZE - 1)) * 100}%`;
      piece.addEventListener('click', () => selectOrDropPiece(piece));
      board.appendChild(piece);
      pieces.push(piece);
    }
  }
}

function pieceSizePx() {
  return board.clientWidth / SIZE;
}

function shufflePieces() {
  const pieceSize = pieceSizePx();
  for (const piece of pieces) {
    const x = Math.random() * (board.clientWidth - pieceSize);
    const y = Math.random() * (board.clientHeight - pieceSize);
    setPiecePosition(piece, x, y);
  }
  message.textContent = '';
}

function setPiecePosition(piece, x, y) {
  const pieceSize = pieceSizePx();
  const boundedX = Math.max(0, Math.min(x, board.clientWidth - pieceSize));
  const boundedY = Math.max(0, Math.min(y, board.clientHeight - pieceSize));
  piece.style.left = `${boundedX}px`;
  piece.style.top = `${boundedY}px`;
}

function selectOrDropPiece(piece) {
  if (selectedPiece === piece) {
    dropSelectedPiece();
    return;
  }
  if (selectedPiece) selectedPiece.classList.remove('selected');
  selectedPiece = piece;
  piece.classList.add('selected');
}

function dropSelectedPiece() {
  if (!selectedPiece) return;
  selectedPiece.classList.remove('selected');
  maybeSnap(selectedPiece);
  selectedPiece = null;
  if (isSolved()) {
    message.textContent = 'Solved 🎉 Great eye control!';
  }
}

function maybeSnap(piece) {
  const pieceSize = pieceSizePx();
  const targetX = Number(piece.dataset.correctX) * pieceSize;
  const targetY = Number(piece.dataset.correctY) * pieceSize;
  const curX = parseFloat(piece.style.left || '0');
  const curY = parseFloat(piece.style.top || '0');
  const dist = Math.hypot(targetX - curX, targetY - curY);
  if (dist <= snapTolerance) setPiecePosition(piece, targetX, targetY);
}

function isSolved() {
  const pieceSize = pieceSizePx();
  return pieces.every(piece => {
    const x = parseFloat(piece.style.left || '0');
    const y = parseFloat(piece.style.top || '0');
    const tx = Number(piece.dataset.correctX) * pieceSize;
    const ty = Number(piece.dataset.correctY) * pieceSize;
    return Math.hypot(tx - x, ty - y) < 1;
  });
}

function startTracking() {
  if (tracking) return;
  tracking = true;
  statusLabel.textContent = 'Tracking: Calibrating...';
  webgazer
    .setGazeListener((data) => {
      if (!data) return;
      gaze.x = data.x;
      gaze.y = data.y;
      if (selectedPiece) moveSelectedPieceWithGaze();
    })
    .begin()
    .then(() => {
      statusLabel.textContent = 'Tracking: On';
      message.textContent = 'Tip: click around the screen for 10 seconds so tracking improves.';
      webgazer.showPredictionPoints(false);
    })
    .catch(() => {
      tracking = false;
      statusLabel.textContent = 'Tracking: Failed';
      message.textContent = 'Camera/permission issue: eye tracking could not start.';
    });
}

function moveSelectedPieceWithGaze() {
  const rect = board.getBoundingClientRect();
  const x = gaze.x - rect.left - pieceSizePx() / 2;
  const y = gaze.y - rect.top - pieceSizePx() / 2;
  setPiecePosition(selectedPiece, x, y);
}

toleranceControl.addEventListener('input', () => {
  snapTolerance = Number(toleranceControl.value);
});

shuffleBtn.addEventListener('click', shufflePieces);
startTrackingBtn.addEventListener('click', startTracking);
window.addEventListener('resize', () => {
  for (const piece of pieces) maybeSnap(piece);
});
