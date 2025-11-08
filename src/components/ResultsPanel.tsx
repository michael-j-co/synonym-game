import { DEFAULT_POINTS } from '../lib/scoring';
import { formatDuration } from '../lib/time';
import type { FoundAnswer, SynonymEntry } from '../types';

type ResultsPanelProps = {
  baseWord: string;
  score: number;
  found: FoundAnswer[];
  missed: SynonymEntry[];
  notableMissed: SynonymEntry[];
  elapsedMs: number;
  completedAll: boolean;
  onReplay: () => void;
};

export function ResultsPanel({
  baseWord,
  score,
  found,
  missed,
  notableMissed,
  elapsedMs,
  completedAll,
  onReplay,
}: ResultsPanelProps) {
  return (
    <section className="results-panel">
      <p className="eyebrow">Round complete</p>
      <h2>{score} pts</h2>
      <p>
        {completedAll ? 'Perfect sweep!' : 'Nice run!'} You found {found.length}{' '}
        / {found.length + missed.length} synonyms for <strong>{baseWord}</strong>.
      </p>

      <div className="results-meta">
        <div>
          <p className="eyebrow">Elapsed time</p>
          <strong>{formatDuration(elapsedMs)}</strong>
        </div>
        <div>
          <p className="eyebrow">Accepted answers</p>
          <strong>{found.length}</strong>
        </div>
      </div>

      <div className="notable-missed">
        <h3>Top missed</h3>
        {notableMissed.length ? (
          <ul>
            {notableMissed.map((item) => (
              <li key={item.lemma}>
                <span>{item.term}</span>
                <span className={`tier-pill ${item.tier}`}>
                  {item.tier} • {DEFAULT_POINTS[item.tier]}pt
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>All cleared. 🎉</p>
        )}
      </div>

      <button className="primary" onClick={onReplay}>
        Play again
      </button>
    </section>
  );
}
