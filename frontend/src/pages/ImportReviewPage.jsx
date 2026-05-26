import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  Save,
} from "lucide-react";

import "../styles/importReview.css";

function cloneQuestions(questions) {
  return JSON.parse(JSON.stringify(questions));
}

function ImportReviewPage({
  importResult,
  subjectName,
  onConfirm,
  onCancel,
}) {
  const [questions, setQuestions] = useState(() =>
    cloneQuestions(importResult.questions || [])
  );
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [showOnlyUncertain, setShowOnlyUncertain] = useState(false);
  const [error, setError] = useState("");

  const questionsWithoutCorrectAnswer = useMemo(
    () =>
      questions.filter(
        (question) => !question.answers.some((answer) => answer.correct)
      ),
    [questions]
  );

  const correctAnswersCount = useMemo(
    () =>
      questions.reduce(
        (total, question) =>
          total +
          question.answers.filter((answer) => answer.correct).length,
        0
      ),
    [questions]
  );

  const visibleQuestions = useMemo(() => {
    if (!showOnlyUncertain) {
      return questions.map((question, index) => ({
        question,
        originalIndex: index,
      }));
    }

    return questions
      .map((question, index) => ({
        question,
        originalIndex: index,
      }))
      .filter(({ question }) =>
        question.answers.every((answer) => !answer.correct)
      );
  }, [questions, showOnlyUncertain]);

  const activeQuestion = questions[activeQuestionIndex];

  function toggleCorrectAnswer(answerLabel) {
    setQuestions((currentQuestions) =>
      currentQuestions.map((question, questionIndex) => {
        if (questionIndex !== activeQuestionIndex) {
          return question;
        }

        return {
          ...question,
          answers: question.answers.map((answer) =>
            answer.label === answerLabel
              ? {
                  ...answer,
                  correct: !answer.correct,
                }
              : answer
          ),
        };
      })
    );

    setError("");
  }

  function handleSaveReview() {
    if (questionsWithoutCorrectAnswer.length > 0) {
      const firstIncompleteQuestion = questions.findIndex(
        (question) =>
          !question.answers.some((answer) => answer.correct)
      );

      setActiveQuestionIndex(firstIncompleteQuestion);
      setError(
        `Mai există ${questionsWithoutCorrectAnswer.length} întrebări fără niciun răspuns corect selectat. Completează-le înainte de salvare.`
      );
      return;
    }

    onConfirm({
      ...importResult,
      questions,
      questions_count: questions.length,
      correct_answers_count: correctAnswersCount,
    });
  }

  return (
    <main className="review-page">
      <header className="review-header">
        <button
          className="review-back-button"
          type="button"
          onClick={onCancel}
        >
          <ArrowLeft size={19} />
          Înapoi
        </button>

        <div>
          <p>Verificare import</p>
          <h1>{subjectName || "Set de grile"}</h1>
          <span>{importResult.filename}</span>
        </div>

        <button
          className="save-review-button"
          type="button"
          onClick={handleSaveReview}
        >
          <Save size={19} />
          Salvează setul
        </button>
      </header>

      <section className="review-summary">
        <article>
          <FileText size={21} />
          <div>
            <strong>{questions.length}</strong>
            <span>Întrebări</span>
          </div>
        </article>

        <article>
          <CheckCircle2 size={21} />
          <div>
            <strong>{correctAnswersCount}</strong>
            <span>Răspunsuri corecte</span>
          </div>
        </article>

        <article
          className={
            questionsWithoutCorrectAnswer.length > 0
              ? "review-warning-stat"
              : "review-success-stat"
          }
        >
          <AlertCircle size={21} />
          <div>
            <strong>{questionsWithoutCorrectAnswer.length}</strong>
            <span>De verificat</span>
          </div>
        </article>
      </section>

      {error && (
        <div className="review-error">
          <AlertCircle size={19} />
          <p>{error}</p>
        </div>
      )}

      <section className="review-workspace">
        <aside className="review-question-sidebar">
          <div className="review-sidebar-header">
            <h2>Întrebări</h2>

            <label>
              <input
                type="checkbox"
                checked={showOnlyUncertain}
                onChange={(event) =>
                  setShowOnlyUncertain(event.target.checked)
                }
              />
              Doar nesigure
            </label>
          </div>

          {visibleQuestions.length === 0 ? (
            <div className="no-uncertain-questions">
              <CheckCircle2 size={24} />
              <p>Toate întrebările au răspuns corect selectat.</p>
            </div>
          ) : (
            <div className="review-question-list">
              {visibleQuestions.map(({ question, originalIndex }) => {
                const hasCorrectAnswer = question.answers.some(
                  (answer) => answer.correct
                );

                return (
                  <button
                    className={
                      originalIndex === activeQuestionIndex
                        ? "active"
                        : ""
                    }
                    key={`${question.number}-${originalIndex}`}
                    type="button"
                    onClick={() => setActiveQuestionIndex(originalIndex)}
                  >
                    <span>{question.number}</span>

                    <p>{question.text}</p>

                    <i
                      className={
                        hasCorrectAnswer
                          ? "question-reviewed"
                          : "question-needs-review"
                      }
                    />
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {activeQuestion && (
          <article className="review-current-question">
            <header>
              <span>Întrebarea {activeQuestion.number}</span>

              {activeQuestion.source_pages?.length > 0 && (
                <small>
                  Pagina {activeQuestion.source_pages.join(", ")}
                </small>
              )}
            </header>

            <h2>{activeQuestion.text}</h2>

            <p className="review-instruction">
              Bifează toate variantele care trebuie considerate corecte.
            </p>

            <div className="review-answer-options">
              {activeQuestion.answers.map((answer) => (
                <label
                  className={answer.correct ? "answer-marked-correct" : ""}
                  key={answer.label}
                >
                  <input
                    type="checkbox"
                    checked={answer.correct}
                    onChange={() => toggleCorrectAnswer(answer.label)}
                  />

                  <span className="review-answer-letter">
                    {answer.label.toUpperCase()}
                  </span>

                  <span className="review-answer-text">
                    {answer.text}
                  </span>

                  {answer.correct && (
                    <Check className="review-answer-check" size={19} />
                  )}
                </label>
              ))}
            </div>
          </article>
        )}
      </section>

      <footer className="review-mobile-actions">
        <button type="button" onClick={onCancel}>
          Renunță
        </button>

        <button type="button" onClick={handleSaveReview}>
          <Save size={18} />
          Salvează setul
        </button>
      </footer>
    </main>
  );
}

export default ImportReviewPage;