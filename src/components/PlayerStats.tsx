import { formatDuration } from '../lib/time';

type PlayerStatsProps = {
  bestScore: number;
  runs: number;
  avgScore: number;
  avgTerms: number;
  avgTimeMs: number;
  fastestMs: number;
};

export function PlayerStats({
  bestScore,
  runs,
  avgScore,
  avgTerms,
  avgTimeMs,
  fastestMs,
}: PlayerStatsProps) {
  const fastestLabel =
    fastestMs > 0 ? formatDuration(fastestMs) : (runs ? '—' : '—');
  const avgTimeLabel = avgTimeMs > 0 ? formatDuration(avgTimeMs) : '—';

  return (
    <section className="player-stats">
      <div>
        <p className="eyebrow">Best score</p>
        <strong>{bestScore}</strong>
      </div>
      <div>
        <p className="eyebrow">Fastest run</p>
        <strong>{fastestLabel}</strong>
      </div>
      <div>
        <p className="eyebrow">Average score</p>
        <strong>{avgScore}</strong>
      </div>
      <div>
        <p className="eyebrow">Average terms</p>
        <strong>{avgTerms}</strong>
      </div>
      <div>
        <p className="eyebrow">Average time</p>
        <strong>{avgTimeLabel}</strong>
      </div>
      <div>
        <p className="eyebrow">Runs</p>
        <strong>{runs}</strong>
      </div>
    </section>
  );
}
