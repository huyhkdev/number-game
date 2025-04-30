import React, { useEffect, forwardRef, memo } from 'react';
const GamePoint = forwardRef(({ point, onClick, isAutoPlay }, ref) => {
  const [clicked, setClicked] = React.useState(false);

  useEffect(() => {
    setClicked(false);
  }, [point.key]);

  const handleClicked = (number) => {
    if (isAutoPlay) {
      setClicked(true);
      return;
    }
    setClicked(true);
    onClick(number);
  };

  return (
    <div
      ref={ref}
      key={point.key}
      className={`point ${clicked ? 'clicked' : ''} ${point.isFading ? 'fading' : ''}`}
      style={{ left: `${point.left}px`, top: `${point.top}px` }}
      onClick={() => handleClicked(point.number)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(point.number)}
      aria-label={`Point ${point.number}`}
    >
      {point.isFading ? point.countdown.toFixed(1) + 's' : point.number}
    </div>
  );
});

export default  memo(GamePoint);
