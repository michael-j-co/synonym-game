import type { RoundPhase } from '../types';

type RoundHeaderProps = {
  baseWord: string;
  remainingMs: number;
  score: number;
  expectedAnswers: number;
  phase: RoundPhase;
};

const formatTime = (ms: number) => {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function RoundHeader({
  baseWord,
  remainingMs,
  score,
  expectedAnswers,
  phase,
}: RoundHeaderProps) {
  const timerLabel = phase === 'ready' ? 'Ready' : formatTime(remainingMs);
  return (
    <header className="round-header">
      <div className="word-column">
        <p className="eyebrow">Base word</p>
        <h1 className="word">{baseWord || '—'}</h1>
        <p className="caption">{expectedAnswers} canonical answers</p>
      </div>
      <div className="stat">
        <p className="eyebrow">Timer</p>
        <div className={`timer ${phase === 'running' ? 'active' : ''}`}>
          {timerLabel}
        </div>
      </div>
      <div className="stat">
        <p className="eyebrow">Score</p>
        <div className="score">{score}</div>
      </div>
    </header>
  );
}
