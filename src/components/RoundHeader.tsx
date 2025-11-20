import { formatDuration } from '../lib/time';
type RoundHeaderProps = {
  baseWord: string;
  elapsedMs: number;
  score: number;
  expectedAnswers: number;
};

export function RoundHeader({
  baseWord,
  elapsedMs,
  score,
  expectedAnswers,
}: RoundHeaderProps) {
  const timerLabel = formatDuration(elapsedMs);
  return (
    <header className="round-header">
      <div className="word-column">
        <p className="eyebrow">Base word</p>
        <h1 className="word">{baseWord || '—'}</h1>
        <p className="caption">{expectedAnswers} canonical answers</p>
      </div>
      <div className="stat">
        <p className="eyebrow">Elapsed time</p>
        <div className="timer">{timerLabel}</div>
      </div>
      <div className="stat">
        <p className="eyebrow">Score</p>
        <div className="score">{score}</div>
      </div>
    </header>
  );
}
