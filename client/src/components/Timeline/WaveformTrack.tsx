import React, { useEffect, useRef } from 'react';

interface WaveformTrackProps {
  peaks: number[];
  duration: number;
  zoom: number; // 1 to 5
  currentTime: number;
  width: number;
}

export const WaveformTrack: React.FC<WaveformTrackProps> = ({
  peaks,
  duration,
  zoom,
  currentTime,
  width
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const trackWidth = Math.max(width, width * zoom);
    const trackHeight = 60;
    canvas.width = trackWidth;
    canvas.height = trackHeight;

    ctx.clearRect(0, 0, trackWidth, trackHeight);

    const numBars = Math.min(peaks.length, Math.floor(trackWidth / 3));
    const barWidth = trackWidth / numBars;
    const centerY = trackHeight / 2;

    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const progressX = trackWidth * progressRatio;

    for (let i = 0; i < numBars; i++) {
      const peakIndex = Math.floor((i / numBars) * peaks.length);
      const val = peaks[peakIndex] || 0.1;
      const barHeight = Math.max(4, val * (trackHeight - 8));
      const x = i * barWidth;
      const y = centerY - barHeight / 2;

      // Color based on whether it is past current time or ahead
      if (x <= progressX) {
        ctx.fillStyle = '#0f172a'; // Played (Crisp dark charcoal)
      } else {
        ctx.fillStyle = '#cbd5e1'; // Upcoming (Clean light slate)
      }

      ctx.beginPath();
      ctx.roundRect(x + 0.5, y, Math.max(1.5, barWidth - 1), barHeight, 2);
      ctx.fill();
    }
  }, [peaks, duration, zoom, currentTime, width]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full pointer-events-none"
    />
  );
};
