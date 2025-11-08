import type { FoundAnswer } from '../types';

type AnswerListProps = {
  answers: FoundAnswer[];
};

export function AnswerList({ answers }: AnswerListProps) {
  if (!answers.length) {
    return (
      <div className="answers-placeholder">
        <p>Accepted answers show up here.</p>
      </div>
    );
  }

  return (
    <ul className="answers-list">
      {answers.map((answer) => (
        <li key={answer.lemma} className="answer-row">
          <span className="term">{answer.term}</span>
          <span className={`tier-pill ${answer.tier}`}>
            {answer.tier} • {answer.points}pt
          </span>
        </li>
      ))}
    </ul>
  );
}
