import { useRef, useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { SpinPrize } from '@/types';

interface SpinWheelProps {
  prizes: SpinPrize[];
  spinning: boolean;
  onSpinEnd: () => void;
  onStartSpin: () => void;
  disabled: boolean;
}

const BASE_SIZE = 320;
const CENTER = BASE_SIZE / 2;
const RADIUS = CENTER - 10;
const INNER_RADIUS = 30;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

function describeArcLabel(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const midAngle = (startAngle + endAngle) / 2;
  const pos = polarToCartesian(cx, cy, r * 0.65, midAngle);
  return { x: pos.x, y: pos.y, angle: midAngle };
}

export function SpinWheel({ prizes, spinning, onSpinEnd, onStartSpin, disabled }: SpinWheelProps) {
  const controls = useAnimation();
  const [rotation, setRotation] = useState(0);
  const spinRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const parentWidth = container.parentElement?.clientWidth ?? 400;
      const padding = 16;
      const available = Math.min(parentWidth - padding, 340);
      const s = Math.max(0.4, Math.min(1, available / 340));
      setScale(s);
    }
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  useEffect(() => {
    if (spinning && !spinRef.current) {
      spinRef.current = true;
      const extraSpins = 5 + Math.floor(Math.random() * 3);
      const totalRotation = rotation + extraSpins * 360 + Math.random() * 360;
      setRotation(totalRotation);
      controls.start({
        rotate: totalRotation,
        transition: {
          duration: 4,
          ease: [0.2, 0.8, 0.3, 1],
        },
      }).then(() => {
        spinRef.current = false;
        onSpinEnd();
      });
    }
  }, [spinning, controls, onSpinEnd, rotation]);

  const segmentAngle = 360 / Math.max(prizes.length, 1);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center w-full overflow-hidden" style={{ minHeight: 160 }}>
      {/* Scale container */}
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease',
        }}
        className="relative flex items-center justify-center"
      >
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent border-t-secondary drop-shadow-lg" />
        </div>

        {/* Outer glow */}
        <div className="absolute rounded-full w-[340px] h-[340px] bg-secondary/20 blur-2xl" />

        {/* Wheel */}
        <motion.div
          animate={controls}
          style={{ rotate: 0 }}
          className="relative w-[320px] h-[320px] rounded-full shadow-2xl"
        >
          <svg
            viewBox={`0 0 ${BASE_SIZE} ${BASE_SIZE}`}
            className="w-full h-full"
          >
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS + 4}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="4"
            />

            {prizes.map((prize, i) => {
              const startAngle = i * segmentAngle;
              const endAngle = (i + 1) * segmentAngle;
              const d = describeArc(CENTER, CENTER, RADIUS, startAngle, endAngle);
              const label = describeArcLabel(CENTER, CENTER, RADIUS, startAngle, endAngle);

              return (
                <g key={prize.id}>
                  <path
                    d={d}
                    fill={prize.color}
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="1.5"
                    className="drop-shadow-sm"
                  />
                  <rect
                    x={label.x - 22}
                    y={label.y - 10}
                    width={44}
                    height={20}
                    rx={10}
                    fill="rgba(0,0,0,0.35)"
                    className="backdrop-blur-sm"
                    transform={`rotate(${label.angle}, ${label.x}, ${label.y})`}
                  />
                  <text
                    x={label.x}
                    y={label.y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="text-[10px] font-bold font-cairo"
                    transform={`rotate(${label.angle}, ${label.x}, ${label.y})`}
                  >
                    {prize.label}
                  </text>
                </g>
              );
            })}

            <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS + 8} fill="white" className="drop-shadow-lg" />
            <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS + 4} fill="url(#innerGrad)" />
            <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="white" />

            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 360) / 12;
              const pos = polarToCartesian(CENTER, CENTER, INNER_RADIUS + 6, angle);
              return (
                <circle
                  key={i}
                  cx={pos.x}
                  cy={pos.y}
                  r={2}
                  fill="#2563EB"
                  opacity={0.6}
                />
              );
            })}

            <path
              d={`M ${CENTER - 12} ${CENTER + 6} L ${CENTER} ${CENTER - 12} L ${CENTER + 12} ${CENTER + 6} Z`}
              fill="#2563EB"
              className="drop-shadow"
            />
            <circle cx={CENTER} cy={CENTER} r={6} fill="#1D4ED8" />

            <defs>
              <radialGradient id="innerGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#EFF6FF" />
                <stop offset="100%" stopColor="#DBEAFE" />
              </radialGradient>
            </defs>
          </svg>
        </motion.div>

        {/* Spin button overlay */}
        {!spinning && (
          <button
            onClick={onStartSpin}
            disabled={disabled}
            className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm font-cairo transition-all duration-300 z-20 shadow-2xl disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed bg-secondary text-white cursor-pointer hover:scale-105 active:scale-95 hover:shadow-secondary/40"
          >
            {disabled ? 'غداً' : 'ابدأ'}
          </button>
        )}
      </div>
    </div>
  );
}
