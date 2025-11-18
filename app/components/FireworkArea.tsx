'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import confetti from 'canvas-confetti';

export interface FireworkAreaHandle {
  triggerFirework: () => void;
}

interface FireworkAreaProps {
  className?: string;
}

const FireworkArea = forwardRef<FireworkAreaHandle, FireworkAreaProps>(({ className = '' }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const myConfettiRef = useRef<confetti.CreateTypes | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    myConfettiRef.current = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    return () => {
      myConfettiRef.current?.reset();
    };
  }, []);

  // 暴露触发礼花的方法给父组件
  useImperativeHandle(ref, () => ({
    triggerFirework: () => {
      if (!myConfettiRef.current) return;

      // 从底部中间喷出一次礼花
      myConfettiRef.current({
        particleCount: 100,
        startVelocity: 50,    // 初速度（越大喷更高）
        spread: 70,           // 扩散角度
        origin: { 
          x: 0.5,             // 居中（0~1）
          y: 1                // 从底部发射
        }
      });
    }
  }), []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 999
      }}
    />
  );
});

FireworkArea.displayName = 'FireworkArea';

export default FireworkArea;

