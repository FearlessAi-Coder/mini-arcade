import { useEffect, useMemo, useState } from 'react';

type GameKey = 'snake' | 'tictactoe' | 'memory' | 'whack' | 'rps' | 'guess';

type GameResult = {
  title: string;
  description: string;
  status: 'win' | 'lose' | 'draw';
};

type MemoryCard = {
  id: number;
  value: number;
  matched: boolean;
  flipped: boolean;
};

const gameMeta: Record<GameKey, { title: string; description: string }> = {
  snake: { title: 'Snake', description: 'Eat food. Don’t hit the wall or yourself.' },
  tictactoe: { title: 'Tic-Tac-Toe', description: 'Classic 3-in-a-row challenge.' },
  memory: { title: 'Memory Match', description: 'Flip cards and match pairs.' },
  whack: { title: 'Whack-a-Mole', description: 'Hit the mole as many times as possible.' },
  rps: { title: 'Rock Paper Scissors', description: 'Beat the computer in a best-of-5 round.' },
  guess: { title: 'Number Guess', description: 'Guess the hidden number from 1 to 100.' },
};

const INITIAL_SNAKE = [
  { x: 5, y: 5 },
  { x: 4, y: 5 },
  { x: 3, y: 5 },
];

function App() {
  const [activeGame, setActiveGame] = useState<GameKey>('snake');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const playTone = (frequency: number, duration = 140) => {
    if (!soundEnabled || typeof window === 'undefined' || !('AudioContext' in window || 'webkitAudioContext' in window)) return;

    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    const audio = new AudioCtor();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();

    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.03;

    oscillator.connect(gain);
    gain.connect(audio.destination);

    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      audio.close();
    }, duration);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-wrap">
          <div className="logo">A</div>
          <div>
            <p className="eyebrow">Games</p>
            <h1>Mini Arcade</h1>
          </div>
        </div>

        <button className="sound-toggle" onClick={() => setSoundEnabled((prev) => !prev)}>
          {soundEnabled ? '🔊 Sound on' : '🔇 Sound off'}
        </button>

        <div className="nav-panel">
          {Object.entries(gameMeta).map(([key, meta]) => (
            <button
              key={key}
              className={`nav-btn ${activeGame === key ? 'active' : ''}`}
              onClick={() => setActiveGame(key as GameKey)}
            >
              <span>{meta.title}</span>
              <small>{meta.description}</small>
            </button>
          ))}
        </div>
      </aside>

      <main className="game-panel">
        <div className="game-header">
          <div>
            <p className="eyebrow">Arcade</p>
            <h2>{gameMeta[activeGame].title}</h2>
          </div>
          {gameResult && (
            <div className={`result-pill ${gameResult.status}`}>
              {gameResult.title}
            </div>
          )}
        </div>

        <div className="game-body">
          {activeGame === 'snake' && <SnakeGame setGameResult={setGameResult} playTone={playTone} />}
          {activeGame === 'tictactoe' && <TicTacToeGame setGameResult={setGameResult} playTone={playTone} />}
          {activeGame === 'memory' && <MemoryGame setGameResult={setGameResult} playTone={playTone} />}
          {activeGame === 'whack' && <WhackGame setGameResult={setGameResult} playTone={playTone} />}
          {activeGame === 'rps' && <RpsGame setGameResult={setGameResult} playTone={playTone} />}
          {activeGame === 'guess' && <GuessGame setGameResult={setGameResult} playTone={playTone} />}
        </div>
      </main>
    </div>
  );
}

function SnakeGame({ setGameResult, playTone }: { setGameResult: (result: GameResult) => void; playTone: (frequency: number, duration?: number) => void }) {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({ x: 8, y: 3 });
  const [dir, setDir] = useState({ x: 1, y: 0 });
  const [isRunning, setIsRunning] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const map: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -1 },
        ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
      };

      const nextDir = map[event.key];
      if (!nextDir) return;
      setDir((current) => {
        if (Math.abs(current.x + nextDir.x) === 0 && Math.abs(current.y + nextDir.y) === 0) {
          return current;
        }
        return nextDir;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setSnake((current) => {
        const head = current[0];
        const nextHead = { x: head.x + dir.x, y: head.y + dir.y };
        const hitsWall = nextHead.x < 0 || nextHead.y < 0 || nextHead.x > 12 || nextHead.y > 12;
        const hitsSelf = current.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

        if (hitsWall || hitsSelf) {
          setIsRunning(false);
          setGameResult({ title: 'Game Over', description: `You scored ${score}.`, status: 'lose' });
          playTone(120, 220);
          return current;
        }

        const nextSnake = [nextHead, ...current];

        if (nextHead.x === food.x && nextHead.y === food.y) {
          setScore((s) => s + 10);
          playTone(420, 80);
          setFood({
            x: Math.floor(Math.random() * 12),
            y: Math.floor(Math.random() * 12),
          });
        } else {
          nextSnake.pop();
        }

        return nextSnake;
      });
    }, 180);

    return () => clearInterval(timer);
  }, [dir, food, isRunning, score, setGameResult, playTone]);

  const reset = () => {
    setSnake(INITIAL_SNAKE);
    setFood({ x: 8, y: 3 });
    setDir({ x: 1, y: 0 });
    setIsRunning(true);
    setScore(0);
    setGameResult(null);
  };

  return (
    <GameCard title="Snake" subtitle={`Score: ${score}`} action={<button onClick={reset}>Reset</button>}>
      <div className="snake-grid">
        {Array.from({ length: 13 * 13 }, (_, index) => {
          const x = index % 13;
          const y = Math.floor(index / 13);
          const isHead = snake[0]?.x === x && snake[0]?.y === y;
          const isBody = snake.some((segment) => segment.x === x && segment.y === y && !(snake[0]?.x === x && snake[0]?.y === y));
          const isFood = food.x === x && food.y === y;

          return (
            <div
              key={`${x}-${y}`}
              className={`snake-cell ${isHead ? 'head' : isBody ? 'body' : ''} ${isFood ? 'food' : ''}`}
            />
          );
        })}
      </div>
    </GameCard>
  );
}

function TicTacToeGame({ setGameResult, playTone }: { setGameResult: (result: GameResult) => void; playTone: (frequency: number, duration?: number) => void }) {
  const [board, setBoard] = useState<string[]>(Array(9).fill(''));
  const [isXTurn, setIsXTurn] = useState(true);

  const winner = useMemo(() => {
    const combos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    for (const combo of combos) {
      const [a, b, c] = combo;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }, [board]);

  useEffect(() => {
    if (!winner && board.some((cell) => cell === '')) return;
    if (!winner) {
      setGameResult({ title: 'Draw', description: 'No winner this round.', status: 'draw' });
      playTone(250, 150);
      return;
    }

    if (winner === 'X') {
      setGameResult({ title: 'You win!', description: 'You completed a line.', status: 'win' });
      playTone(540, 160);
    } else {
      setGameResult({ title: 'You lose!', description: 'The computer wins this round.', status: 'lose' });
      playTone(180, 220);
    }
  }, [winner, board, setGameResult, playTone]);

  const makeMove = (index: number) => {
    if (board[index] || winner) return;
    const nextBoard = [...board];
    nextBoard[index] = 'X';
    setBoard(nextBoard);
    setIsXTurn(false);
    playTone(370, 110);

    if (winningLine(nextBoard, 'X')) {
      return;
    }

    window.setTimeout(() => {
      const available = nextBoard
        .map((cell, i) => (cell ? null : i))
        .filter((cell) => cell !== null) as number[];
      if (!available.length) return;

      const move = available[Math.floor(Math.random() * available.length)];
      const finalBoard = [...nextBoard];
      finalBoard[move] = 'O';
      setBoard(finalBoard);
      setIsXTurn(true);
      playTone(280, 100);
    }, 300);
  };

  const reset = () => {
    setBoard(Array(9).fill(''));
    setIsXTurn(true);
    setGameResult(null);
  };

  return (
    <GameCard title="Tic-Tac-Toe" subtitle={winner ? `Winner: ${winner}` : isXTurn ? 'Your turn' : 'Computer thinking...'} action={<button onClick={reset}>Reset</button>}>
      <div className="ttt-grid">
        {board.map((cell, index) => (
          <button key={index} className="ttt-cell" onClick={() => makeMove(index)}>
            {cell}
          </button>
        ))}
      </div>
    </GameCard>
  );
}

function winningLine(board: string[], player: string) {
  const combos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  return combos.some((combo) => combo.every((index) => board[index] === player));
}

function MemoryGame({ setGameResult, playTone }: { setGameResult: (result: GameResult) => void; playTone: (frequency: number, duration?: number) => void }) {
  const [cards, setCards] = useState<MemoryCard[]>(() =>
    Array.from({ length: 8 }, (_, index) => ({
      id: index,
      value: index % 4,
      matched: false,
      flipped: false,
    })).sort(() => Math.random() - 0.5),
  );
  const [flipped, setFlipped] = useState<number[]>([]);

  useEffect(() => {
    if (flipped.length !== 2) return;

    const [first, second] = flipped;
    const firstCard = cards[first];
    const secondCard = cards[second];

    if (firstCard.value === secondCard.value) {
      setCards((current) =>
        current.map((card) =>
          card.id === firstCard.id || card.id === secondCard.id ? { ...card, matched: true, flipped: true } : card,
        ),
      );
      playTone(520, 100);
      setFlipped([]);
    } else {
      const timeout = setTimeout(() => {
        setCards((current) =>
          current.map((card) =>
            card.id === firstCard.id || card.id === secondCard.id ? { ...card, flipped: false } : card,
          ),
        );
        setFlipped([]);
        playTone(180, 130);
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [flipped, cards, playTone]);

  useEffect(() => {
    const isComplete = cards.every((card) => card.matched);
    if (isComplete && cards.length) {
      setGameResult({ title: 'You win!', description: 'All pairs matched.', status: 'win' });
      playTone(640, 180);
    }
  }, [cards, setGameResult, playTone]);

  const handleCardClick = (index: number) => {
    if (cards[index].matched || cards[index].flipped || flipped.length === 2) return;

    const nextCards = cards.map((card, cardIndex) =>
      cardIndex === index ? { ...card, flipped: true } : card,
    );

    setCards(nextCards);
    setFlipped((current) => [...current, index]);
    playTone(360, 90);
  };

  const reset = () => {
    setCards(
      Array.from({ length: 8 }, (_, index) => ({
        id: index,
        value: index % 4,
        matched: false,
        flipped: false,
      })).sort(() => Math.random() - 0.5),
    );
    setFlipped([]);
    setGameResult(null);
  };

  return (
    <GameCard title="Memory Match" subtitle="Match all pairs" action={<button onClick={reset}>Reset</button>}>
      <div className="memory-grid">
        {cards.map((card, index) => (
          <button key={`${card.id}-${index}`} className="memory-card" onClick={() => handleCardClick(index)}>
            {card.flipped || card.matched ? card.value : '?'}
          </button>
        ))}
      </div>
    </GameCard>
  );
}

function WhackGame({ setGameResult, playTone }: { setGameResult: (result: GameResult) => void; playTone: (frequency: number, duration?: number) => void }) {
  const [moleIndex, setMoleIndex] = useState<number>(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      setMoleIndex(Math.floor(Math.random() * 9));
    }, 600);

    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const clock = setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setActive(false);
          const finalStatus = score >= 10 ? 'win' : 'lose';
          const finalTitle = score >= 10 ? 'You win!' : 'Time Up!';
          setGameResult({ title: finalTitle, description: `You scored ${score}.`, status: finalStatus as 'win' | 'lose' });
          playTone(finalStatus === 'win' ? 500 : 180, 180);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(clock);
  }, [active, score, setGameResult, playTone]);

  const hitMole = (index: number) => {
    if (!active || index !== moleIndex) return;
    setScore((s) => s + 1);
    setMoleIndex(-1);
    playTone(620, 90);
  };

  const reset = () => {
    setScore(0);
    setTimeLeft(15);
    setMoleIndex(0);
    setActive(true);
    setGameResult(null);
  };

  return (
    <GameCard title="Whack-a-Mole" subtitle={`Time: ${timeLeft}s | Score: ${score}`} action={<button onClick={reset}>Reset</button>}>
      <div className="mole-grid">
        {Array.from({ length: 9 }, (_, index) => (
          <button key={index} className={`mole-hole ${moleIndex === index ? 'active' : ''}`} onClick={() => hitMole(index)}>
            {moleIndex === index ? '🐹' : ''}
          </button>
        ))}
      </div>
    </GameCard>
  );
}

function RpsGame({ setGameResult, playTone }: { setGameResult: (result: GameResult) => void; playTone: (frequency: number, duration?: number) => void }) {
  const [playerPick, setPlayerPick] = useState<string>('');
  const [computerPick, setComputerPick] = useState<string>('');
  const [score, setScore] = useState({ player: 0, computer: 0 });

  const picks = ['rock', 'paper', 'scissors'];

  const play = (pick: string) => {
    const computer = picks[Math.floor(Math.random() * picks.length)];
    setPlayerPick(pick);
    setComputerPick(computer);
    playTone(420, 100);

    if (pick === computer) {
      setGameResult({ title: 'Draw', description: 'Same choice. No points.', status: 'draw' });
      return;
    }

    const win =
      (pick === 'rock' && computer === 'scissors') ||
      (pick === 'paper' && computer === 'rock') ||
      (pick === 'scissors' && computer === 'paper');

    if (win) {
      setScore((current) => ({ ...current, player: current.player + 1 }));
      setGameResult({ title: 'You win!', description: `You picked ${pick} and beat ${computer}.`, status: 'win' });
      playTone(560, 120);
    } else {
      setScore((current) => ({ ...current, computer: current.computer + 1 }));
      setGameResult({ title: 'You lose!', description: `Computer picked ${computer}.`, status: 'lose' });
      playTone(200, 150);
    }
  };

  const reset = () => {
    setPlayerPick('');
    setComputerPick('');
    setScore({ player: 0, computer: 0 });
    setGameResult(null);
  };

  return (
    <GameCard title="Rock Paper Scissors" subtitle={`Player ${score.player} - ${score.computer} Computer`} action={<button onClick={reset}>Reset</button>}>
      <div className="rps-panel">
        <div className="rps-choices">
          {picks.map((pick) => (
            <button key={pick} className="rps-button" onClick={() => play(pick)}>
              {pick}
            </button>
          ))}
        </div>
        <div className="rps-result">
          <div><strong>You:</strong> {playerPick || '—'}</div>
          <div><strong>Computer:</strong> {computerPick || '—'}</div>
        </div>
      </div>
    </GameCard>
  );
}

function GuessGame({ setGameResult, playTone }: { setGameResult: (result: GameResult) => void; playTone: (frequency: number, duration?: number) => void }) {
  const [target, setTarget] = useState(Math.floor(Math.random() * 100) + 1);
  const [guess, setGuess] = useState('');
  const [message, setMessage] = useState('');

  const submit = () => {
    const value = Number(guess);
    if (!value || value < 1 || value > 100) {
      setMessage('Pick a number from 1 to 100.');
      return;
    }

    if (value === target) {
      setGameResult({ title: 'You win!', description: `Correct! The number was ${target}.`, status: 'win' });
      setMessage('Correct!');
      playTone(620, 180);
      return;
    }

    setMessage(value < target ? 'Too low!' : 'Too high!');
    setGameResult({ title: 'Keep guessing', description: 'Not quite yet.', status: 'lose' });
    playTone(value < target ? 220 : 180, 100);
  };

  const reset = () => {
    setTarget(Math.floor(Math.random() * 100) + 1);
    setGuess('');
    setMessage('');
    setGameResult(null);
  };

  return (
    <GameCard title="Number Guess" subtitle="Guess the hidden number" action={<button onClick={reset}>Reset</button>}>
      <div className="guess-panel">
        <input value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Enter a number" />
        <button className="guess-button" onClick={submit}>Submit guess</button>
        <p>{message || 'No clue yet...'}</p>
      </div>
    </GameCard>
  );
}

function GameCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className="game-card">
      <div className="game-card-head">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export default App;
