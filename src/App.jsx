import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { generatePoints } from './utils/generatePoints';
import GamePoint from './Components/GamePoint';
import { GAME_STATES, GAME_CONFIG, GAME_STATUS } from './constants/game';

function App() {
  // State
  const [inputCount, setInputCount] = useState('');
  const [points, setPoints] = useState([]);
  const [time, setTime] = useState(0);
  const [gameState, setGameState] = useState(GAME_STATES.IDLE);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [shouldShowNext, setShouldShowNext] = useState(true);

  // Refs
  const timerRef = useRef(null);
  const playContainerRef = useRef(null);
  const timeOutClearRef = useRef([]);
  const intervalsRef = useRef(new Map());
  const autoPlayRef = useRef(null);
  const isAutoPlayRef = useRef(null);
  const currentNumberRef = useRef(1);
  const pointRefs = useRef({});

  // Effects
  useEffect(() => {
    isAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay]);

  useEffect(() => {
    return cleanup;
  }, []);

  // Helper functions
  const getContainerSize = () => {
    const el = playContainerRef.current;
    return el ? [el.offsetWidth, el.offsetHeight] : [0, 0];
  };

  const cleanup = () => {
    clearInterval(timerRef.current);
    clearInterval(autoPlayRef.current);
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current.clear();
    timeOutClearRef.current.forEach(clearTimeout);
    timeOutClearRef.current = [];
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTime(prev => Math.round((prev + GAME_CONFIG.TIME_STEP) * 10) / 10);
    }, GAME_CONFIG.TIME_INTERVAL);
  };

  const startAutoPlay = () => {
    autoPlayRef.current = setInterval(() => {
      const nextNumber = currentNumberRef.current;
      const pointExists = points.find(p => p.number === nextNumber);
      if (pointExists) {
        processPointClick(nextNumber);
      } else {
        stopAutoPlay();
      }
    }, GAME_CONFIG.AUTOPLAY_INTERVAL);
  };

  const stopAutoPlay = () => {
    clearInterval(autoPlayRef.current);
    setIsAutoPlay(false);
  };

  // Game control functions
  const handleStartGame = () => {
    const count = Number(inputCount);
    if (count <= 0) {
      alert('Please enter a valid number of points!');
      return;
    }

    const [w, h] = getContainerSize();
    const newPoints = generatePoints(count, w, h);
    setPoints(newPoints);
    setGameState(GAME_STATES.PLAYING);
    currentNumberRef.current = 1;
    setTime(0);
    setShouldShowNext(true);
    startTimer();
  };

  const handleSoftReset = () => {
    cleanup();
    setTime(0);
    currentNumberRef.current = 1;
    setPoints([]);
    handleStartGame();
  };

  const handlePlayOrReset = () => {
    if (gameState === GAME_STATES.PLAYING) {
      handleSoftReset();
    }
    else if (gameState === GAME_STATES.WINNING || gameState === GAME_STATES.GAME_OVER) {
      resetGame();
    } else {
      handleStartGame();
    }
  };

  const resetGame = () => {
    cleanup();
    setGameState(GAME_STATES.IDLE);
    setInputCount('');
    setPoints([]);
    setTime(0);
    currentNumberRef.current = 1;
    setIsAutoPlay(false);
  };

  const toggleAutoPlay = () => {
    if (isAutoPlay) {
      stopAutoPlay();
    } else {
      if (gameState !== GAME_STATES.PLAYING) return;
      setIsAutoPlay(true);
      startAutoPlay();
    }
  };

  // Point handling functions
  const triggerClickOnPoint = (number) => {
    if (!isAutoPlayRef.current) return;
    const pointRef = pointRefs.current[number];
    if (pointRef) {
      pointRef.click();
    }
  };

  const processPointClick = (number) => {
    triggerClickOnPoint(number);
    if (number === currentNumberRef.current) {
      handleCorrectPointClick(number);
    } else {
      handleWrongPointClick();
    }
  };

  const handleCorrectPointClick = (number) => {
    setPoints(prev =>
      prev.map(p =>
        p.number === number ? { ...p, isFading: true, countdown: GAME_CONFIG.COUNTDOWN_DURATION } : p
      )
    );

    if (intervalsRef.current.has(number)) {
      clearInterval(intervalsRef.current.get(number));
    }

    const fadeInterval = setInterval(() => {
      setPoints(prev =>
        prev.map(p => {
          if (p.number === number && p.isFading) {
            const newCountdown = Math.max(0, Math.round((p.countdown - GAME_CONFIG.COUNTDOWN_STEP) * 10) / 10);
            return { ...p, countdown: newCountdown };
          }
          return p;
        })
      );
    }, GAME_CONFIG.COUNTDOWN_INTERVAL);

    const winCondition = number === Number(inputCount);
    if (!winCondition) {
      currentNumberRef.current = number + 1;
    } else {
      setShouldShowNext(false);
    }

    intervalsRef.current.set(number, fadeInterval);

    const timeOut = setTimeout(() => {
      clearInterval(fadeInterval);
      intervalsRef.current.delete(number);
      setPoints(prev => prev.filter(p => p.number !== number));

      if (winCondition) {
        setGameState(GAME_STATES.WINNING);
        clearInterval(timerRef.current);
      }
    }, GAME_CONFIG.COUNTDOWN_DURATION * 1000);

    timeOutClearRef.current = [...timeOutClearRef.current, timeOut];
  };

  const handleWrongPointClick = () => {
    setGameState(GAME_STATES.GAME_OVER);
    cleanup();
  };

  const handlePointClick = (number) => {
    if (gameState !== GAME_STATES.PLAYING) return;
    if (isAutoPlay) {
      stopAutoPlay();
    }
    processPointClick(number);
  };

  // Render functions
  const renderStatus = () => {
    return <span className={`game_status ${gameState.toLowerCase()}`}>{GAME_STATUS[gameState]}</span>;
  };

  const isShowNext = shouldShowNext && gameState === GAME_STATES.PLAYING;

  return (
    <div className="container">
      <div className="game">
        {renderStatus()}
        <div className="game_input-points">
          <label htmlFor="points-input">Points</label>
          <input
            id="points-input"
            type="number"
            min="1"
            value={inputCount}
            onChange={(e) => setInputCount(e.target.value)}
            disabled={gameState === GAME_STATES.PLAYING}
            aria-label="Enter number of points"
          />
        </div>

        <div className="game_time">
          <p>Time</p>
          <p>{time.toFixed(1)}s</p>
        </div>

        <div className="game_buttons">
          <button className="_button" onClick={handlePlayOrReset}>
            {gameState === GAME_STATES.IDLE ? 'Play' : 'Resart'}
          </button>
          {gameState == GAME_STATES.PLAYING && <button className="_button" onClick={toggleAutoPlay}>
            Auto play: {isAutoPlay ? 'ON' : 'OFF'}
          </button>}
        </div>

        <div className="play-ground" ref={playContainerRef}>
          {points.map(point => (
            <GamePoint
              key={point.key}
              point={point}
              isAutoPlay={isAutoPlayRef.current}
              onClick={handlePointClick}
              ref={(el) => (pointRefs.current[point.number] = el)}
            />
          ))}
        </div>
        {isShowNext && <span className='game_recommend'>Next: {currentNumberRef.current}</span>}
      </div>
    </div>
  );
}

export default App;