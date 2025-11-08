import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnswerList } from './components/AnswerList';
import { PlayerStats } from './components/PlayerStats';
import { ResultsPanel } from './components/ResultsPanel';
import { RoundHeader } from './components/RoundHeader';
import { useRound } from './hooks/useRound';
import { DEFAULT_POINTS } from './lib/scoring';
import { useLocalStore } from './state/useLocalStore';
import type { RarityTier } from './types';
import './styles/app.css';

function getStatusTone(status: string | undefined) {
  if (!status) return 'muted';
  if (status === 'error') return 'error';
  if (status === 'accepted') return 'success';
  if (status === 'invalid' || status === 'duplicate' || status === 'multi') {
    return 'warning';
  }
  if (status === 'empty') {
    return 'muted';
  }
  return 'muted';
}

function App() {
  const {
    roundId,
    phase,
    baseWord,
    submitAnswer,
    found,
    score,
    lastFeedback,
    playAgain,
    isLoading,
    error,
    remainingMs,
    missed,
    notableMissed,
    expectedAnswers,
  } = useRound();

  const { bestScore, runs, avgScore, avgTerms, registerRun } = useLocalStore();
  const [inputValue, setInputValue] = useState('');
  const recordedRef = useRef<number | null>(null);

  useEffect(() => {
    if (phase === 'ended' && roundId !== recordedRef.current) {
      registerRun(score, found.length);
      recordedRef.current = roundId;
    }
  }, [found.length, phase, registerRun, roundId, score]);

  useEffect(() => {
    setInputValue('');
    recordedRef.current = null;
  }, [roundId]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'ended') return;
    const feedback = submitAnswer(inputValue);
    if (feedback.status === 'accepted') {
      setInputValue('');
    }
  };

  const statusMessage = error
    ? error
    : lastFeedback?.message ??
      (phase === 'ready'
        ? 'Timer starts on your first correct answer.'
        : 'Keep going!');

  const statusTone = getStatusTone(
    error ? 'error' : lastFeedback?.status ?? undefined,
  );

  const isInputDisabled = isLoading || Boolean(error) || phase === 'ended';

  const tierLegend = useMemo(
    () =>
      Object.entries(DEFAULT_POINTS).map(([tier, value]) => ({
        tier: tier as RarityTier,
        value: `${value} pt${value > 1 ? 's' : ''}`,
      })),
    [],
  );

  return (
    <div className="app-shell">
      <main className="game-shell">
        <RoundHeader
          baseWord={baseWord}
          remainingMs={remainingMs}
          score={score}
          expectedAnswers={expectedAnswers}
          phase={phase}
        />

        <form className="submission-form" onSubmit={handleSubmit}>
          <label htmlFor="synonym-input" className="eyebrow">
            Enter a synonym
          </label>
          <div className="input-row">
            <input
              id="synonym-input"
              type="text"
              placeholder={
                phase === 'ready'
                  ? 'glad, cheerful, ecstatic…'
                  : 'keep them coming…'
              }
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              disabled={isInputDisabled}
              autoComplete="off"
            />
            <button type="submit" disabled={isInputDisabled}>
              Submit
            </button>
          </div>
          <p className={`status ${statusTone}`}>{statusMessage}</p>
        </form>

        <section>
          <div className="section-heading">
            <h2>Accepted answers ({found.length})</h2>
            <div className="legend">
              {tierLegend.map((item) => (
                <span key={item.tier} className={`tier-pill ${item.tier}`}>
                  {item.tier} • {item.value}
                </span>
              ))}
            </div>
          </div>
          <AnswerList answers={found} />
        </section>

        {phase === 'ended' && (
          <ResultsPanel
            baseWord={baseWord}
            score={score}
            found={found}
            missed={missed}
            notableMissed={notableMissed}
            onReplay={playAgain}
          />
        )}
      </main>

      <aside>
        <PlayerStats
          bestScore={bestScore}
          runs={runs}
          avgScore={avgScore}
          avgTerms={avgTerms}
        />
      </aside>
    </div>
  );
}

export default App;
