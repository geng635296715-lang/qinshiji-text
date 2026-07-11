import React from 'react';
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const WIDTH = 1672;
const HEIGHT = 940;
const SOURCE = 'qing-shiji-source.png';
const TAU = Math.PI * 2;

type AstrolabeConfig = {
  left: number;
  top: number;
  width: number;
  height: number;
  sourceLeft: number;
  sourceTop: number;
  turns: number;
  opacity: number;
  filter: string;
};

const ASTROLABES: AstrolabeConfig[] = [
  {
    left: -220,
    top: 162,
    width: 470,
    height: 470,
    sourceLeft: 220,
    sourceTop: -162,
    turns: -1,
    opacity: 0.42,
    filter: 'brightness(1.1) contrast(1.06) saturate(1.02)',
  },
  {
    left: 570,
    top: 108,
    width: 536,
    height: 536,
    sourceLeft: -570,
    sourceTop: -108,
    turns: 1,
    opacity: 0.78,
    filter: 'brightness(1.18) contrast(1.14) saturate(1.08)',
  },
  {
    left: 1418,
    top: 184,
    width: 454,
    height: 454,
    sourceLeft: -1418,
    sourceTop: -184,
    turns: -2,
    opacity: 0.38,
    filter: 'brightness(1.08) contrast(1.04) saturate(1.02)',
  },
];

const makeWavePath = (
  baseline: number,
  amplitude: number,
  phase: number,
  cycles: number,
  lift = 0,
) => {
  const points = Array.from({length: 73}, (_, index) => {
    const x = (WIDTH / 72) * index;
    const y =
      baseline +
      lift +
      Math.sin((index / 72) * TAU * cycles + phase) * amplitude +
      Math.sin((index / 72) * TAU * (cycles * 0.5) + phase * 2.1) * (amplitude * 0.25);

    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return points.join(' ');
};

const SourceImage: React.FC<{
  opacity?: number;
  transform?: string;
  filter?: string;
  mixBlendMode?: React.CSSProperties['mixBlendMode'];
}> = ({opacity = 1, transform, filter, mixBlendMode}) => (
  <Img
    src={staticFile(SOURCE)}
    style={{
      position: 'absolute',
      inset: 0,
      width: WIDTH,
      height: HEIGHT,
      objectFit: 'cover',
      opacity,
      transform,
      filter,
      mixBlendMode,
    }}
  />
);

const StaticBase: React.FC = () => {
  return (
    <>
      <SourceImage />
      <div
        style={{
          position: 'absolute',
          left: 496,
          top: 52,
          width: 684,
          height: 684,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(3, 3, 2, 0.98) 0%, rgba(3, 3, 2, 0.95) 42%, rgba(3, 3, 2, 0.82) 60%, rgba(3, 3, 2, 0.38) 78%, rgba(3, 3, 2, 0) 100%)',
          filter: 'blur(4px)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
};

const RotatingAstrolabe: React.FC<{progress: number; config: AstrolabeConfig}> = ({
  progress,
  config,
}) => {
  const spin = progress * 360 * config.turns;

  return (
    <div
      style={{
        position: 'absolute',
        left: config.left,
        top: config.top,
        width: config.width,
        height: config.height,
        borderRadius: '50%',
        overflow: 'hidden',
        opacity: config.opacity,
        mixBlendMode: 'screen',
        transform: `rotate(${spin}deg)`,
        transformOrigin: '50% 50%',
        filter: `${config.filter} drop-shadow(0 0 10px rgba(218, 164, 70, 0.12))`,
      }}
    >
      <Img
        src={staticFile(SOURCE)}
        style={{
          position: 'absolute',
          left: config.sourceLeft,
          top: config.sourceTop,
          width: WIDTH,
          height: HEIGHT,
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

const FlowingSea: React.FC<{progress: number}> = ({progress}) => {
  const phase = progress * TAU;
  const slowDrift = Math.sin(phase) * 42;
  const counterDrift = Math.sin(phase + Math.PI * 0.7) * 31;
  const fineDrift = Math.sin(phase * 2) * 18;
  const rise = Math.cos(phase) * 12;
  const shimmer = 0.46 + Math.sin(phase * 2) * 0.09;

  return (
    <AbsoluteFill
      style={{
        top: 620,
        height: HEIGHT - 620,
        overflow: 'hidden',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.74) 14%, black 28%, black 100%)',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.74) 14%, black 28%, black 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: -72,
          top: -645 + rise,
          width: WIDTH + 144,
          height: HEIGHT + 84,
          opacity: 0.58,
          transform: `translateX(${slowDrift}px) scale(1.07)`,
          filter: 'brightness(1.24) contrast(1.14) blur(0.45px)',
          mixBlendMode: 'screen',
          clipPath:
            'polygon(0 58%, 9% 49%, 19% 55%, 28% 46%, 39% 52%, 49% 44%, 61% 54%, 72% 46%, 83% 53%, 92% 47%, 100% 53%, 100% 100%, 0 100%)',
        }}
      >
        <SourceImage />
      </div>

      <div
        style={{
          position: 'absolute',
          left: -54,
          top: -632 - rise * 0.7,
          width: WIDTH + 108,
          height: HEIGHT + 74,
          opacity: 0.34,
          transform: `translateX(${counterDrift}px) scale(1.055)`,
          filter: 'brightness(1.13) contrast(1.22) blur(1px)',
          mixBlendMode: 'lighten',
          clipPath:
            'polygon(0 39%, 12% 47%, 24% 36%, 36% 45%, 48% 38%, 60% 48%, 72% 40%, 84% 47%, 100% 39%, 100% 100%, 0 100%)',
        }}
      >
        <SourceImage />
      </div>

      <div
        style={{
          position: 'absolute',
          left: -36,
          top: -618 + rise * 0.45,
          width: WIDTH + 72,
          height: HEIGHT + 50,
          opacity: 0.24,
          transform: `translateX(${fineDrift}px) scale(1.03)`,
          filter: 'brightness(1.32) contrast(1.18) blur(1.4px)',
          mixBlendMode: 'screen',
          clipPath:
            'polygon(0 70%, 10% 64%, 21% 73%, 33% 62%, 44% 70%, 58% 60%, 71% 68%, 86% 59%, 100% 66%, 100% 100%, 0 100%)',
        }}
      >
        <SourceImage />
      </div>

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT - 620}`}
        width={WIDTH}
        height={HEIGHT - 620}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: shimmer,
          mixBlendMode: 'screen',
        }}
      >
        <path
          d={makeWavePath(214, 18, phase, 3)}
          fill="none"
          stroke="rgba(238, 185, 82, 0.86)"
          strokeWidth="2.1"
        />
        <path
          d={makeWavePath(244, 14, phase + 1.7, 4)}
          fill="none"
          stroke="rgba(255, 218, 131, 0.48)"
          strokeWidth="1.3"
        />
        <path
          d={makeWavePath(178, 10, phase + 3.1, 2)}
          fill="none"
          stroke="rgba(207, 151, 56, 0.32)"
          strokeWidth="1"
        />
      </svg>
    </AbsoluteFill>
  );
};

export const QingShijiLoop: React.FC = () => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress =
    frame === durationInFrames - 1
      ? 0
      : interpolate(frame, [0, durationInFrames - 1], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#030302',
        overflow: 'hidden',
      }}
    >
      <StaticBase />
      {ASTROLABES.map((config) => (
        <RotatingAstrolabe
          key={`${config.left}-${config.top}-${config.turns}`}
          progress={progress}
          config={config}
        />
      ))}
      <FlowingSea progress={progress} />
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(circle at 50% 36%, rgba(247, 190, 78, 0.055), transparent 30%), linear-gradient(to bottom, rgba(0, 0, 0, 0.06), rgba(0, 0, 0, 0.22))',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
