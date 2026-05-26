import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Gift,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useQuiz } from "../context/QuizContext";
import {
  getCorrectStreakMessage,
  getProgressMessage,
  getQuizStartMessage,
  getRecoveredQuestionMessage,
  getSpecialRewardMessage,
} from "../services/experienceService";

import {
  fetchAttemptsBySubject,
  saveAttemptToDatabase,
} from "../services/attemptService";

import {
  calculateQuizSummary,
  evaluateQuestion,
  formatPoints,
} from "../utils/calculateScore";
import { getResultMessage } from "../utils/resultMessages";

import "../styles/quiz.css";

function CelebrationParticles() {
  return (
    <div className="celebration-particles" aria-hidden="true">
      {Array.from({ length: 14 }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function QuizPage() {
  const navigate = useNavigate();
  const { activeQuiz, clearQuiz } = useQuiz();

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [isChecked, setIsChecked] = useState(false);
  const [questionResults, setQuestionResults] = useState([]);
  const [currentResult, setCurrentResult] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [hasStartedQuiz, setHasStartedQuiz] = useState(false);

  const [correctStreak, setCorrectStreak] = useState(0);
  const [questionMomentMessage, setQuestionMomentMessage] = useState("");
  const [showSpecialReward, setShowSpecialReward] = useState(false);

  const [previousAttempts, setPreviousAttempts] = useState([]);
  const [isAttemptHistoryReady, setIsAttemptHistoryReady] = useState(false);
  const [attemptSaveError, setAttemptSaveError] = useState("");

  const [quizStartMessage] = useState(() => getQuizStartMessage());
  const [specialRewardMessage] = useState(() => getSpecialRewardMessage());

  const savedAttemptRef = useRef(false);

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];
  const totalQuestions = activeQuiz?.questions.length || 0;

  useEffect(() => {
    let isActive = true;

    async function loadPreviousAttempts() {
      if (!activeQuiz?.subjectId) {
        setIsAttemptHistoryReady(true);
        return;
      }

      try {
        const savedAttempts = await fetchAttemptsBySubject(
          activeQuiz.subjectId
        );

        if (isActive) {
          setPreviousAttempts(savedAttempts);
        }
      } catch {
        if (isActive) {
          setPreviousAttempts([]);
        }
      } finally {
        if (isActive) {
          setIsAttemptHistoryReady(true);
        }
      }
    }

    loadPreviousAttempts();

    return () => {
      isActive = false;
    };
  }, [activeQuiz?.subjectId]);

  const summary = useMemo(() => {
    if (!activeQuiz) {
      return null;
    }

    return calculateQuizSummary(questionResults, activeQuiz.questions.length);
  }, [questionResults, activeQuiz]);

  const resultMessage = useMemo(() => {
    if (!isFinished || !summary) {
      return "";
    }

    return getResultMessage(summary.percentage);
  }, [isFinished, summary]);

  const progressComparison = useMemo(() => {
    if (
      !isFinished ||
      !summary ||
      !activeQuiz?.subjectId ||
      !isAttemptHistoryReady
    ) {
      return null;
    }

    const sameQuizAttempt = activeQuiz.id
      ? previousAttempts.find(
          (attempt) => attempt.quizId === activeQuiz.id
        )
      : null;

    const previousAttempt = sameQuizAttempt || previousAttempts[0];

    if (!previousAttempt) {
      return null;
    }

    const difference = summary.percentage - previousAttempt.percentage;

    if (difference < 15) {
      return null;
    }

    return {
      difference,
      previousPercentage: previousAttempt.percentage,
      message: getProgressMessage(difference),
    };
  }, [
    activeQuiz,
    isAttemptHistoryReady,
    isFinished,
    previousAttempts,
    summary,
  ]);

  const hasSpecialReward =
    isFinished &&
    summary &&
    totalQuestions >= 10 &&
    summary.percentage >= 90;

  const questionsToReview = useMemo(() => {
    if (!activeQuiz || !isFinished) {
      return [];
    }

    return questionResults
      .map((result, index) => ({
        result,
        question: activeQuiz.questions[index],
      }))
      .filter(({ result }) => !result.fullyCorrect);
  }, [activeQuiz, isFinished, questionResults]);

  useEffect(() => {
    if (
      !isFinished ||
      !summary ||
      !activeQuiz?.subjectId ||
      !isAttemptHistoryReady ||
      savedAttemptRef.current
    ) {
      return;
    }

    savedAttemptRef.current = true;
    setAttemptSaveError("");

    async function persistAttempt() {
      try {
        await saveAttemptToDatabase({
          subjectId: activeQuiz.subjectId,
          questionSetId: activeQuiz.questionSetId,
          quizId: activeQuiz.id || null,
          quizTitle: activeQuiz.title,
          sourceFilename: activeQuiz.sourceFilename,
          settings: activeQuiz.settings,
          totalQuestions,
          earnedPoints: summary.earnedPoints,
          percentage: summary.percentage,
          fullyCorrectCount: summary.fullyCorrectCount,
          partiallyCorrectCount: summary.partiallyCorrectCount,
          wrongCount: summary.wrongCount,
          resultMessage,
          progressMessage: progressComparison?.message || "",
          progressDifference: progressComparison?.difference || null,
          specialRewardUnlocked: Boolean(hasSpecialReward),
          questionResults,
          questions: activeQuiz.questions,
        });
      } catch (saveError) {
        savedAttemptRef.current = false;
        setAttemptSaveError(saveError.message);
      }
    }

    persistAttempt();
  }, [
    activeQuiz,
    hasSpecialReward,
    isAttemptHistoryReady,
    isFinished,
    progressComparison,
    questionResults,
    resultMessage,
    summary,
    totalQuestions,
  ]);

  if (!activeQuiz || !currentQuestion) {
    return (
      <main className="empty-quiz-page">
        <h1>Nu există un quiz activ</h1>
        <p>Încarcă un set de grile și generează un test nou.</p>

        <button type="button" onClick={() => navigate("/")}>
          Înapoi la materii
        </button>
      </main>
    );
  }

  const progressPercent = Math.round(
    ((currentQuestionIndex + 1) / totalQuestions) * 100
  );

  function toggleAnswer(answerLabel) {
    if (isChecked) {
      return;
    }

    setSelectedAnswers((currentAnswers) => {
      if (currentAnswers.includes(answerLabel)) {
        return currentAnswers.filter((label) => label !== answerLabel);
      }

      return [...currentAnswers, answerLabel];
    });
  }

  function verifyAnswer() {
    if (selectedAnswers.length === 0) {
      return;
    }

    const result = evaluateQuestion(currentQuestion, selectedAnswers);

    let momentMessages = [];

    if (result.fullyCorrect) {
      const newStreak = correctStreak + 1;

      setCorrectStreak(newStreak);

      const streakMessage = getCorrectStreakMessage(newStreak);

      if (streakMessage) {
        momentMessages.push(streakMessage);
      }

      if (currentQuestion.recoveryStats) {
        momentMessages.push(getRecoveredQuestionMessage());
      }
    } else {
      setCorrectStreak(0);
    }

    setQuestionMomentMessage(momentMessages.join(" "));
    setCurrentResult(result);
    setQuestionResults((currentResults) => [...currentResults, result]);
    setIsChecked(true);
  }

  function goToNextQuestion() {
    if (currentQuestionIndex === totalQuestions - 1) {
      setIsFinished(true);
      return;
    }

    setCurrentQuestionIndex((currentIndex) => currentIndex + 1);
    setSelectedAnswers([]);
    setCurrentResult(null);
    setQuestionMomentMessage("");
    setIsChecked(false);
  }

  function getAnswerClass(answer) {
    const isSelected = selectedAnswers.includes(answer.label);

    if (!isChecked) {
      return isSelected ? "selected" : "";
    }

    if (isSelected && answer.correct) {
      return "correct-selected";
    }

    if (isSelected && !answer.correct) {
      return "wrong-selected";
    }

    if (!isSelected && answer.correct) {
      return "correct-missed";
    }

    return "inactive-after-check";
  }

  function restartQuiz() {
    savedAttemptRef.current = false;
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setIsChecked(false);
    setQuestionResults([]);
    setCurrentResult(null);
    setIsFinished(false);
    setShowMistakes(false);
    setHasStartedQuiz(false);
    setCorrectStreak(0);
    setQuestionMomentMessage("");
    setShowSpecialReward(false);
  }

  function exitQuiz() {
    const returnPath = activeQuiz.subjectId
      ? `/subjects/${activeQuiz.subjectId}`
      : "/";

    clearQuiz();
    navigate(returnPath);
  }

  if (!hasStartedQuiz) {
    return (
      <main className="quiz-intro-page">
        <section className="quiz-intro-card">
          <span className="quiz-intro-decoration">
            <Sparkles size={29} />
          </span>

          <p className="quiz-intro-label">Ești gata?</p>

          <h1>{activeQuiz.title}</h1>

          <p className="quiz-intro-message">{quizStartMessage}</p>

          <div className="quiz-intro-details">
            <span>{totalQuestions} întrebări</span>

            <span>
              {activeQuiz.settings?.answersPerQuestion === "all"
                ? "Toate variantele"
                : `${activeQuiz.settings?.answersPerQuestion || "-"} variante`}
            </span>

            {activeQuiz.questions.some((question) => question.recoveryStats) && (
              <span>Test de recuperare</span>
            )}
          </div>

          <div className="quiz-intro-actions">
            <button
              className="secondary-quiz-button"
              type="button"
              onClick={exitQuiz}
            >
              <ArrowLeft size={19} />
              Înapoi
            </button>

            <button
              className="primary-quiz-button"
              type="button"
              onClick={() => setHasStartedQuiz(true)}
            >
              Începe testul
              <ArrowRight size={20} />
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (isFinished && summary) {
    return (
      <main className="quiz-result-page">
        {hasSpecialReward && <CelebrationParticles />}

        <section
          className={`final-result-card ${
            hasSpecialReward ? "special-result-card" : ""
          }`}
        >
          <span className="result-decoration">
            <Sparkles size={27} />
          </span>

          <h1>Quiz finalizat</h1>
          <p>{activeQuiz.title}</p>

          <div className="final-score">
            <strong>{summary.percentage}%</strong>
            <span>
              {formatPoints(summary.earnedPoints)} / {totalQuestions} puncte
            </span>
          </div>

          <p className="motivational-message">{resultMessage}</p>
            {attemptSaveError && (
            <p className="attempt-save-error">
              {attemptSaveError}
            </p>
          )}

          {progressComparison && (
            <p className="progress-result-message">
              {progressComparison.message}
            </p>
          )}

          {hasSpecialReward && (
            <section className="special-reward-section">
              <button
                className="special-reward-button"
                type="button"
                onClick={() =>
                  setShowSpecialReward((currentValue) => !currentValue)
                }
              >
                <Gift size={19} />
                {showSpecialReward
                  ? "Ascunde surpriza"
                  : "Deschide surpriza"}
              </button>

              {showSpecialReward && (
                <p className="special-reward-message">
                  {specialRewardMessage}
                </p>
              )}
            </section>
          )}

          <div className="result-statistics result-statistics-four">
            <div>
              <strong>{totalQuestions}</strong>
              <span>Întrebări</span>
            </div>

            <div className="positive-result">
              <strong>{summary.fullyCorrectCount}</strong>
              <span>Complete</span>
            </div>

            <div className="partial-result">
              <strong>{summary.partiallyCorrectCount}</strong>
              <span>Parțiale</span>
            </div>

            <div className="negative-result">
              <strong>{summary.wrongCount}</strong>
              <span>Greșite</span>
            </div>
          </div>

          {questionsToReview.length > 0 && (
            <>
              <button
                className="review-mistakes-button"
                type="button"
                onClick={() => setShowMistakes((currentValue) => !currentValue)}
              >
                {showMistakes
                  ? "Ascunde întrebările de repetat"
                  : "Vezi întrebările de repetat"}

                <span>{questionsToReview.length}</span>
              </button>

              {showMistakes && (
                <section className="final-mistakes-section">
                  {questionsToReview.map(({ question, result }, index) => (
                    <article
                      className="final-mistake-card"
                      key={`${question.number}-${index}`}
                    >
                      <header>
                        <span
                          className={
                            result.points > 0
                              ? "mistake-partial-score"
                              : "mistake-zero-score"
                          }
                        >
                          {formatPoints(result.points)} / 1
                        </span>

                        <strong>Întrebarea {question.number}</strong>
                      </header>

                      <h3>{question.text}</h3>

                      <div className="review-answer-list">
                        {question.answers.map((answer) => {
                          const wasSelected = result.selectedAnswers.includes(
                            answer.label
                          );

                          let answerClass = "review-answer";

                          if (wasSelected && answer.correct) {
                            answerClass += " review-correct-selected";
                          } else if (wasSelected && !answer.correct) {
                            answerClass += " review-wrong-selected";
                          } else if (!wasSelected && answer.correct) {
                            answerClass += " review-correct-missed";
                          }

                          return (
                            <p className={answerClass} key={answer.label}>
                              <span>{answer.label.toUpperCase()}</span>
                              {answer.text}

                              {wasSelected && answer.correct && (
                                <small>Corect ales</small>
                              )}

                              {wasSelected && !answer.correct && (
                                <small>Greșit ales</small>
                              )}

                              {!wasSelected && answer.correct && (
                                <small>Corect ratat</small>
                              )}
                            </p>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </section>
              )}
            </>
          )}

          <div className="result-buttons">
            <button
              className="secondary-quiz-button"
              type="button"
              onClick={exitQuiz}
            >
              <ArrowLeft size={19} />
              Înapoi
            </button>

            <button
              className="primary-quiz-button"
              type="button"
              onClick={restartQuiz}
            >
              <RotateCcw size={19} />
              Repetă testul
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="quiz-page">
      <header className="quiz-header">
        <button
          className="quiz-back-button"
          type="button"
          onClick={exitQuiz}
          aria-label="Înapoi"
        >
          <ArrowLeft size={22} />
        </button>

        <div>
          <h1>{activeQuiz.title}</h1>
          <p>
            Întrebarea {currentQuestionIndex + 1} din {totalQuestions}
          </p>
        </div>

        <strong>{progressPercent}%</strong>
      </header>

      <div className="quiz-progress-bar">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <section className="question-container">
        <h2>{currentQuestion.text}</h2>

        <div className="answers-list">
          {currentQuestion.answers.map((answer) => (
            <button
              className={`answer-choice ${getAnswerClass(answer)}`}
              key={answer.label}
              type="button"
              onClick={() => toggleAnswer(answer.label)}
            >
              <span className="answer-letter">
                {answer.label.toUpperCase()}
              </span>

              <span className="answer-text">{answer.text}</span>

              {isChecked &&
                selectedAnswers.includes(answer.label) &&
                answer.correct && (
                  <CheckCircle2 className="answer-status" />
                )}

              {isChecked &&
                selectedAnswers.includes(answer.label) &&
                !answer.correct && (
                  <XCircle className="answer-status" />
                )}

              {isChecked &&
                !selectedAnswers.includes(answer.label) &&
                answer.correct && (
                  <CheckCircle2 className="answer-status missed-status" />
                )}
            </button>
          ))}
        </div>

        {isChecked && currentResult && (
          <div
            className={`question-feedback ${
              currentResult.fullyCorrect
                ? "feedback-correct"
                : currentResult.points > 0
                ? "feedback-partial"
                : "feedback-wrong"
            }`}
          >
            <strong>
              Punctaj: {formatPoints(currentResult.points)} / 1
            </strong>

            {currentResult.fullyCorrect && (
              <p>Ai selectat toate variantele corecte.</p>
            )}

            {!currentResult.fullyCorrect && currentResult.points > 0 && (
              <p>
                Ai selectat {currentResult.correctSelected.length} variante
                corecte, ai ratat {currentResult.missedCorrect.length} și ai
                bifat greșit {currentResult.wrongSelected.length}.
              </p>
            )}

            {currentResult.points === 0 && (
              <p>
                Răspunsul nu primește punctaj. Variantele corecte sunt marcate
                distinct mai sus.
              </p>
            )}
          </div>
        )}

        {isChecked && questionMomentMessage && (
          <p className="question-moment-message">
            <Sparkles size={18} />
            {questionMomentMessage}
          </p>
        )}
      </section>

      <footer className="quiz-actions">
        {!isChecked ? (
          <button
            className="primary-quiz-button"
            type="button"
            onClick={verifyAnswer}
            disabled={selectedAnswers.length === 0}
          >
            Verifică răspunsul
            <CheckCircle2 size={20} />
          </button>
        ) : (
          <button
            className="primary-quiz-button"
            type="button"
            onClick={goToNextQuestion}
          >
            {currentQuestionIndex === totalQuestions - 1
              ? "Vezi rezultatul"
              : "Următoarea"}
            <ArrowRight size={20} />
          </button>
        )}
      </footer>
    </main>
  );
}

export default QuizPage;