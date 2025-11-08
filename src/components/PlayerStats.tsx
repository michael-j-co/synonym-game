type PlayerStatsProps = {
  bestScore: number;
  runs: number;
  avgScore: number;
  avgTerms: number;
};

export function PlayerStats({
  bestScore,
  runs,
  avgScore,
  avgTerms,
}: PlayerStatsProps) {
  return (
    <section className="player-stats">
      <div>
        <p className="eyebrow">Best score</p>
        <strong>{bestScore}</strong>
      </div>
      <div>
        <p className="eyebrow">Runs</p>
        <strong>{runs}</strong>
      </div>
      <div>
        <p className="eyebrow">Avg score</p>
        <strong>{avgScore}</strong>
      </div>
      <div>
        <p className="eyebrow">Avg terms</p>
        <strong>{avgTerms}</strong>
      </div>
    </section>
  );
}
