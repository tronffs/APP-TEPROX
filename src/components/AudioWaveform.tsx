import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  progress: number; // 0 to 1
  onSeek?: (progress: number) => void;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  progress,
  onSeek,
  barCount = 64,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Pre-generate static pseudo-random heights for a realistic audio curve
  const barHeights = React.useMemo(() => {
    const heights: number[] = [];
    for (let i = 0; i < barCount; i++) {
      // Natural speech envelope shape: lower at ends, dynamic in middle
      const x = i / barCount;
      const envelope = Math.sin(x * Math.PI);
      const rand = 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.9));
      heights.push(Math.max(0.15, Math.min(1.0, envelope * rand)));
    }
    return heights;
  }, [barCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barWidth = width / barCount;
      const gap = 2;
      const actualBarWidth = Math.max(2, barWidth - gap);

      const activeBarIndex = Math.floor(progress * barCount);

      for (let i = 0; i < barCount; i++) {
        let baseHeight = barHeights[i];

        // Animate active bars during playback
        if (isPlaying) {
          const wave = Math.sin(time * 0.08 + i * 0.3) * 0.25;
          baseHeight = Math.max(0.1, Math.min(1.0, baseHeight + wave));
        }

        const barH = baseHeight * (height * 0.85);
        const x = i * barWidth;
        const y = (height - barH) / 2;

        const isPast = i <= activeBarIndex;

        // Gradient for played vs upcoming
        if (isPast) {
          const grad = ctx.createLinearGradient(0, y, 0, y + barH);
          grad.addColorStop(0, '#818cf8'); // indigo-400
          grad.addColorStop(1, '#4f46e5'); // indigo-600
          ctx.fillStyle = grad;
        } else {
          ctx.fillStyle = '#334155'; // slate-700
        }

        // Rounded pill bar
        ctx.beginPath();
        const radius = actualBarWidth / 2;
        ctx.roundRect(x, y, actualBarWidth, barH, radius);
        ctx.fill();
      }

      time++;
      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, progress, barHeights, barCount]);

  const handleSeekFromClientX = (clientX: number) => {
    if (!onSeek || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(newProgress);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleSeekFromClientX(e.clientX);
  };

  const handleTouch = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches && e.touches.length > 0) {
      handleSeekFromClientX(e.touches[0].clientX);
    }
  };

  return (
    <div className="relative w-full h-16 sm:h-20 bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden px-3 sm:px-4 flex items-center cursor-pointer group touch-none select-none">
      <canvas
        ref={canvasRef}
        width={800}
        height={80}
        onClick={handleClick}
        onTouchStart={handleTouch}
        onTouchMove={handleTouch}
        className="w-full h-full touch-none cursor-pointer"
      />
      <div
        className="absolute top-0 bottom-0 w-1 bg-indigo-400 pointer-events-none transition-all shadow-[0_0_10px_rgba(99,102,241,0.9)]"
        style={{ left: `${progress * 100}%` }}
      />
    </div>
  );
};
