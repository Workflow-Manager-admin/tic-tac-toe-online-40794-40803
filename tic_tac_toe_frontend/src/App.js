import React, { useState } from "react";
import "./App.css";

/**
 * Color palette for inline use (matches requirements)
 * --primary: #2196F3  (blue)
 * --secondary: #4CAF50 (green)
 * --accent: #FFC107   (yellow)
 */

/** Square component for Tic Tac Toe board */
function Square({ value, onClick, isWinning, disabled }) {
  return (
    <button
      className={`ttt-square${isWinning ? " ttt-square-win" : ""}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={value ? `Square ${value}` : "Empty square"}
      style={{
        color: value === "X" ? "var(--primary-color)" : value === "O" ? "var(--secondary-color)" : undefined,
        background: isWinning ? "var(--accent-color)" : undefined,
      }}
    >
      {value}
    </button>
  );
}

/** Board grid component */
function Board({ squares, onSquareClick, winningLine, disabled }) {
  return (
    <div className="ttt-board">
      {squares.map((val, idx) => (
        <Square
          key={idx}
          value={val}
          onClick={() => onSquareClick(idx)}
          isWinning={winningLine && winningLine.includes(idx)}
          disabled={disabled || Boolean(val)}
        />
      ))}
    </div>
  );
}

/** Detect winner: returns [winner, winningLineIndexes] */
function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let arr of lines) {
    const [a, b, c] = arr;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return [squares[a], arr];
    }
  }
  return [null, null];
}

/** Dumb AI for Tic Tac Toe (uses first empty spot, or blocks/wins if possible) */
function getAIMove(squares, aiMark = "O", humanMark = "X") {
  // Try to win
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      let copy = squares.slice();
      copy[i] = aiMark;
      const [winner] = calculateWinner(copy);
      if (winner === aiMark) return i;
    }
  }
  // Try to block opponent
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      let copy = squares.slice();
      copy[i] = humanMark;
      const [winner] = calculateWinner(copy);
      if (winner === humanMark) return i;
    }
  }
  // Take center, corners, sides in this order
  const order = [4, 0, 2, 6, 8, 1, 3, 5, 7];
  for (let i of order) if (!squares[i]) return i;
  return null;
}

// PUBLIC_INTERFACE
function App() {
  // 'human' or 'ai' mode (ai=player X v AI O, hh=2 players)
  const [mode, setMode] = useState("ai"); // default: vs AI
  // Array of 9 squares
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  // X/O score count
  const [score, setScore] = useState({ X: 0, O: 0, draw: 0 });
  // For showing recent result
  const [lastWinner, setLastWinner] = useState(null);

  // Calculate winner & win line
  const [winner, winningLine] = calculateWinner(squares);
  const isDraw = !winner && squares.every(Boolean);

  // Handle a single move
  function handleSquareClick(idx) {
    if (winner || squares[idx]) return;
    const nextSquares = squares.slice();
    nextSquares[idx] = xIsNext ? "X" : "O";
    setSquares(nextSquares);
    setXIsNext((prev) => !prev);
  }

  // AI move (if it's O's turn and in AI mode, after human X moves)
  React.useEffect(() => {
    if (
      mode === "ai" &&
      !winner &&
      !isDraw &&
      !xIsNext // O's turn (AI)
    ) {
      const aiMove = getAIMove(squares, "O", "X");
      if (typeof aiMove === "number") {
        setTimeout(() => {
          // Make sure still AI's turn
          setSquares((prevSquares) => {
            // If already completed, skip
            if (calculateWinner(prevSquares)[0] || prevSquares[aiMove]) return prevSquares;
            const copy = prevSquares.slice();
            copy[aiMove] = "O";
            return copy;
          });
          setXIsNext(true);
        }, 450);
      }
    }
    // eslint-disable-next-line
  }, [mode, xIsNext, winner, isDraw, squares]);

  // On game end, update score/display
  React.useEffect(() => {
    if (winner) {
      setLastWinner(winner);
      setScore((prev) => ({ ...prev, [winner]: prev[winner] + 1 }));
    }
    if (isDraw && !winner) {
      setLastWinner("draw");
      setScore((prev) => ({ ...prev, draw: prev.draw + 1 }));
    }
    // eslint-disable-next-line
  }, [winner, isDraw]);

  // Start new clean game, optionally changing mode
  function startNewGame(newMode) {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setLastWinner(null);
    if (newMode && newMode !== mode) {
      setMode(newMode);
      setScore({ X: 0, O: 0, draw: 0 });
    }
  }

  // Reset just the board, keep score
  function resetBoard() {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setLastWinner(null);
  }

  // Status message
  let statusMessage = "";
  if (winner) statusMessage = `Winner: ${winner}`;
  else if (isDraw) statusMessage = "Draw!";
  else statusMessage = `Next: ${xIsNext ? "X" : "O"}${mode === "ai" && !xIsNext ? " (AI)" : ""}`;

  return (
    <div className="App" style={{ minHeight: "100vh", background: "var(--ttt-bg, #fff)" }}>
      <div className="ttt-main-container">
        <div className="ttt-scorebar">
          <span className="ttt-score">X: {score.X}</span>
          <span className="ttt-score ttt-score-center">{statusMessage}</span>
          <span className="ttt-score">O: {score.O}</span>
          <span className="ttt-score ttt-score-draw">Draws: {score.draw}</span>
        </div>
        <Board
          squares={squares}
          onSquareClick={(idx) => {
            if (!winner && !isDraw && (mode === "hh" || (mode === "ai" && xIsNext))) handleSquareClick(idx);
          }}
          winningLine={winningLine}
          disabled={Boolean(winner) || Boolean(isDraw)}
        />

        <div className="ttt-controls">
          <button
            className={`ttt-btn${mode === "ai" ? " ttt-btn-active" : ""}`}
            onClick={() => startNewGame("ai")}
            aria-pressed={mode === "ai"}
          >
            Player vs AI
          </button>
          <button
            className={`ttt-btn${mode === "hh" ? " ttt-btn-active" : ""}`}
            onClick={() => startNewGame("hh")}
            aria-pressed={mode === "hh"}
          >
            2 Players
          </button>
          <button className="ttt-btn" onClick={resetBoard}>
            Restart
          </button>
        </div>
        <div className="ttt-credits" style={{ marginTop: 24, color: "var(--ttt-muted)" }}>
          <span>
            Minimal Tic Tac Toe &mdash; <b style={{ color: "var(--primary-color)" }}>X</b>/<b style={{ color: "var(--secondary-color)" }}>O</b> : React &middot; KAVIA
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
