import { DEFAULT_POINTS } from '../lib/scoring';
import type { FoundAnswer, SynonymEntry } from '../types';

type ResultsPanelProps = {
  baseWord: string;
  score: number;
  found: FoundAnswer[];
  missed: SynonymEntry[];
  notableMissed: SynonymEntry[];
  onReplay: () => void;
};

export function ResultsPanel({
  baseWord,
  score,
  found,
  missed,
  notableMissed,
  onReplay,
}: ResultsPanelProps) {
  return (
    <section className="results-panel">
      <p className="eyebrow">Round complete</p>
      <h2>{score} pts</h2>
      <p>
        You found {found.length} / {found.length + missed.length} synonyms for{' '}
        <strong>{baseWord}</strong>.
      </p>

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
          <p>Perfect sweep! 🎉</p>
        )}
      </div>

      <button className="primary" onClick={onReplay}>
        Play again
      </button>
    </section>
  );
}
