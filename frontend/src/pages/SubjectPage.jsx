import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  FileText,
  History,
  LoaderCircle,
  Pencil,
  Play,
  PlusCircle,
  RotateCcw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import UploadPage from "./UploadPage";
import SubjectStatistics from "../components/statistics/SubjectStatistics";
import { useQuiz } from "../context/QuizContext";
import { getSubjectById } from "../services/subjectService";
import {
  deleteQuestionSetFromDatabase,
  fetchQuestionSetsBySubject,
  getOriginalFileUrl,
  saveQuestionSetToDatabase,
} from "../services/questionSetService";
import {
  deleteQuizFromDatabase,
  fetchQuizzesBySubject,
  renameQuizInDatabase,
  saveQuizToDatabase,
} from "../services/quizService";
import {
  deleteAttemptFromDatabase,
  fetchAttemptsBySubject,
} from "../services/attemptService";
import {
  buildRecoveryQuestionSet,
  getRecoveryQuestions,
} from "../services/recoveryService";

import "../styles/organization.css";

const TABS = [
  {
    id: "upload",
    label: "Încarcă grile",
    icon: UploadCloud,
  },
  {
    id: "files",
    label: "Fișiere încărcate",
    icon: FileText,
  },
  {
    id: "quizzes",
    label: "Teste create",
    icon: ClipboardList,
  },
  {
    id: "results",
    label: "Rezultate",
    icon: History,
  },
  {
    id: "statistics",
    label: "Statistici",
    icon: BarChart3,
  },
];

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatPoints(points) {
  if (Number.isInteger(points)) {
    return points.toString();
  }

  return points.toFixed(2).replace(".", ",");
}

function SubjectPage() {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const { startQuiz } = useQuiz();

  const [subject, setSubject] = useState(null);
  const [isSubjectLoading, setIsSubjectLoading] = useState(true);
  const [subjectLoadError, setSubjectLoadError] = useState("");
  const [activeTab, setActiveTab] = useState("upload");
  const [questionSets, setQuestionSets] = useState([]);

  const [isLoadingQuestionSets, setIsLoadingQuestionSets] = useState(true);
  const [questionSetsError, setQuestionSetsError] = useState("");

  const [quizzes, setQuizzes] = useState([]);
  const [attempts, setAttempts] = useState([]);

  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const [selectedQuestionSet, setSelectedQuestionSet] = useState(null);
  const [questionSetForQuiz, setQuestionSetForQuiz] = useState(null);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editedQuizTitle, setEditedQuizTitle] = useState("");
  const [quizRenameError, setQuizRenameError] = useState("");
  const [recoveryError, setRecoveryError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadSubject() {
      setIsSubjectLoading(true);
      setSubjectLoadError("");

      try {
        const savedSubject = await getSubjectById(subjectId);

        if (isActive) {
          setSubject(savedSubject);
        }
      } catch (loadError) {
        if (isActive) {
          setSubjectLoadError(loadError.message);
        }
      } finally {
        if (isActive) {
          setIsSubjectLoading(false);
        }
      }
    }

    loadSubject();

    return () => {
      isActive = false;
    };
  }, [subjectId]);

  useEffect(() => {
    let isActive = true;

    async function loadSubjectData() {
      setIsLoadingQuestionSets(true);
      setIsLoadingHistory(true);
      setQuestionSetsError("");
      setHistoryError("");

      try {
        const [savedQuestionSets, savedQuizzes, savedAttempts] =
          await Promise.all([
            fetchQuestionSetsBySubject(subjectId),
            fetchQuizzesBySubject(subjectId),
            fetchAttemptsBySubject(subjectId),
          ]);

        if (!isActive) {
          return;
        }

        setQuestionSets(savedQuestionSets);
        setQuizzes(savedQuizzes);
        setAttempts(savedAttempts);
      } catch (loadError) {
        if (isActive) {
          setQuestionSetsError(loadError.message);
          setHistoryError(loadError.message);
        }
      } finally {
        if (isActive) {
          setIsLoadingQuestionSets(false);
          setIsLoadingHistory(false);
        }
      }
    }

    loadSubjectData();

    return () => {
      isActive = false;
    };
  }, [subjectId]);

  const recoverySummary = useMemo(
    () => ({
      all: getRecoveryQuestions(attempts, questionSets, "all").length,
      wrong: getRecoveryQuestions(attempts, questionSets, "wrong").length,
      repeated: getRecoveryQuestions(
        attempts,
        questionSets,
        "repeated"
      ).length,
    }),
    [attempts, questionSets]
  );

  if (isSubjectLoading) {
    return (
      <main className="missing-subject-page">
        <LoaderCircle className="subjects-loader-icon" size={34} />
        <p>Se încarcă materia...</p>
      </main>
    );
  }

  if (subjectLoadError) {
    return (
      <main className="missing-subject-page">
        <h1>Materia nu a putut fi încărcată</h1>
        <p>{subjectLoadError}</p>

        <button type="button" onClick={() => navigate("/")}>
          Înapoi la materii
        </button>
      </main>
    );
  }

  if (!subject) {
    return (
      <main className="missing-subject-page">
        <h1>Materia nu a fost găsită</h1>

        <button type="button" onClick={() => navigate("/")}>
          Înapoi la materii
        </button>
      </main>
    );
  }

  async function handleImportCompleted(importResult, originalFile) {
    const savedQuestionSet = await saveQuestionSetToDatabase(
      subject.id,
      importResult,
      originalFile
    );

    setQuestionSets((currentSets) => [savedQuestionSet, ...currentSets]);

    return savedQuestionSet;
  }

  async function handleQuizCreated(quizData) {
    const savedQuiz = await saveQuizToDatabase(quizData);

    setQuizzes((currentQuizzes) => [savedQuiz, ...currentQuizzes]);

    return savedQuiz;
  }

  async function handleDeleteQuestionSet(questionSetId) {
    const confirmed = window.confirm(
      "Ștergi acest fișier importat? Testele și rezultatele deja salvate vor rămâne."
    );

    if (!confirmed) {
      return;
    }

    setQuestionSetsError("");

    try {
      await deleteQuestionSetFromDatabase(questionSetId);

      setQuestionSets((currentSets) =>
        currentSets.filter((questionSet) => questionSet.id !== questionSetId)
      );

      if (selectedQuestionSet?.id === questionSetId) {
        setSelectedQuestionSet(null);
      }
    } catch (deleteError) {
      setQuestionSetsError(deleteError.message);
    }
  }

  async function handleDeleteQuiz(quizId) {
    const confirmed = window.confirm(
      "Ștergi acest test și rezultatele salvate pentru el?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteQuizFromDatabase(quizId);

      setQuizzes((currentQuizzes) =>
        currentQuizzes.filter((quiz) => quiz.id !== quizId)
      );

      setAttempts((currentAttempts) =>
        currentAttempts.filter((attempt) => attempt.quizId !== quizId)
      );
    } catch (deleteError) {
      setHistoryError(deleteError.message);
    }
  }

  function startRenamingQuiz(quiz) {
    setEditingQuizId(quiz.id);
    setEditedQuizTitle(quiz.title);
    setQuizRenameError("");
  }

  function cancelRenamingQuiz() {
    setEditingQuizId(null);
    setEditedQuizTitle("");
    setQuizRenameError("");
  }

  async function handleRenameQuiz(quizId) {
    try {
      const updatedQuiz = await renameQuizInDatabase(
        quizId,
        editedQuizTitle
      );

      setQuizzes((currentQuizzes) =>
        currentQuizzes.map((quiz) =>
          quiz.id === quizId ? updatedQuiz : quiz
        )
      );

      setAttempts((currentAttempts) =>
        currentAttempts.map((attempt) =>
          attempt.quizId === quizId
            ? {
                ...attempt,
                quizTitle: updatedQuiz.title,
              }
            : attempt
        )
      );

      cancelRenamingQuiz();
    } catch (renameError) {
      setQuizRenameError(renameError.message);
    }
  }

  async function handleDeleteAttempt(attemptId) {
    const confirmed = window.confirm("Ștergi acest rezultat din istoric?");

    if (!confirmed) {
      return;
    }

    try {
      await deleteAttemptFromDatabase(attemptId);

      setAttempts((currentAttempts) =>
        currentAttempts.filter((attempt) => attempt.id !== attemptId)
      );

      if (selectedAttempt?.id === attemptId) {
        setSelectedAttempt(null);
      }
    } catch (deleteError) {
      setHistoryError(deleteError.message);
    }
  }

  function createQuizFromQuestionSet(questionSet) {
    setQuestionSetForQuiz(questionSet);
    setActiveTab("upload");
  }

  function solveSavedQuiz(quiz) {
    startQuiz(quiz);
    navigate("/quiz");
  }

  function changeTab(tabId) {
    setSelectedQuestionSet(null);
    setSelectedAttempt(null);

    if (tabId !== "upload") {
      setQuestionSetForQuiz(null);
    }

    setActiveTab(tabId);
  }

  function createRecoveryQuiz(mode) {
    const recoveryQuestionSet = buildRecoveryQuestionSet(
      subject.id,
      attempts,
      questionSets,
      mode
    );

    if (recoveryQuestionSet.questionsCount === 0) {
      setRecoveryError(
        "Nu există întrebări disponibile pentru acest tip de test."
      );
      return;
    }

    setRecoveryError("");
    setQuestionSetForQuiz(recoveryQuestionSet);
    setSelectedAttempt(null);
    setActiveTab("upload");
  }


  function openAttemptFromStatistics(attempt) {
    setSelectedAttempt(attempt);
    setActiveTab("results");
  }

  function renderFilesTab() {
    if (isLoadingQuestionSets) {
      return (
        <section className="tab-empty-state">
          <LoaderCircle className="subjects-loader-icon" size={34} />
          <p>Se încarcă fișierele...</p>
        </section>
      );
    }

    if (questionSetsError) {
      return (
        <section className="tab-empty-state">
          <h2>Fișierele nu au putut fi încărcate</h2>
          <p>{questionSetsError}</p>
        </section>
      );
    }
    if (selectedQuestionSet) {
      return (
        <section className="question-set-details">
          <button
            className="return-to-list-button"
            type="button"
            onClick={() => setSelectedQuestionSet(null)}
          >
            <ArrowLeft size={18} />
            Înapoi la fișiere
          </button>

          <header className="question-set-details-header">
            <div>
              <span className="file-detail-icon">
                <FileText size={26} />
              </span>

              <div>
                <h2>{selectedQuestionSet.filename}</h2>
                <p>Importat la {formatDate(selectedQuestionSet.importedAt)}</p>
              </div>
            </div>

            <div className="question-set-summary">
              <span>
                <strong>{selectedQuestionSet.questionsCount}</strong>
                întrebări
              </span>

              <span>
                <strong>{selectedQuestionSet.correctAnswersCount}</strong>
                răspunsuri corecte
              </span>
            </div>
          </header>

          <button
            className="create-test-from-file-button"
            type="button"
            onClick={() => createQuizFromQuestionSet(selectedQuestionSet)}
          >
            <PlusCircle size={19} />
            Creează test din acest fișier
          </button>

          {selectedQuestionSet.storagePath && (
            <a
              className="open-original-file-button"
              href={getOriginalFileUrl(selectedQuestionSet.id)}
              target="_blank"
              rel="noreferrer"
            >
              <FileText size={18} />
              Deschide fișierul original
            </a>
          )}

          <div className="imported-questions-list">
            {selectedQuestionSet.questions.map((question) => (
              <details className="imported-question" key={question.number}>
                <summary>
                  <span>Întrebarea {question.number}</span>
                  {question.text}
                </summary>

                <div className="imported-answers">
                  {question.answers.map((answer) => (
                    <p
                      key={answer.label}
                      className={answer.correct ? "correct-imported-answer" : ""}
                    >
                      <span>{answer.label.toUpperCase()}</span>
                      {answer.text}

                      {answer.correct && <CheckCircle2 size={18} />}
                    </p>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </section>
      );
    }

    if (questionSets.length === 0) {
      return (
        <section className="tab-empty-state">
          <FileText size={38} />
          <h2>Nu există fișiere încărcate</h2>
          <p>Încarcă primul fișier PDF sau DOCX pentru această materie.</p>

          <button type="button" onClick={() => setActiveTab("upload")}>
            Încarcă grile
          </button>
        </section>
      );
    }

    return (
      <section className="saved-files-section">
        <div className="saved-items-grid">
          {questionSets.map((questionSet) => (
            <article className="saved-file-card" key={questionSet.id}>
              <span className="saved-file-icon">
                <FileText size={27} />
              </span>

              <div className="saved-file-content">
                <h3>{questionSet.filename}</h3>
                <p>{formatDate(questionSet.importedAt)}</p>

                <div>
                  <span>{questionSet.questionsCount} întrebări</span>
                  <span>{questionSet.correctAnswersCount} corecte</span>
                </div>
              </div>

              <div className="saved-file-actions">
                <button
                  className="create-file-quiz-button"
                  type="button"
                  onClick={() => createQuizFromQuestionSet(questionSet)}
                >
                  <PlusCircle size={16} />
                  Test
                </button>

                <button
                  className="view-file-button"
                  type="button"
                  onClick={() => setSelectedQuestionSet(questionSet)}
                >
                  Vezi
                </button>

                <button
                  className="delete-file-button"
                  type="button"
                  onClick={() => handleDeleteQuestionSet(questionSet.id)}
                  aria-label="Șterge fișierul"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    );
  }

  function renderQuizzesTab() {
    if (isLoadingHistory) {
      return (
        <section className="tab-empty-state">
          <LoaderCircle className="subjects-loader-icon" size={34} />
          <p>Se încarcă testele...</p>
        </section>
      );
    }

    if (historyError) {
      return (
        <section className="tab-empty-state">
          <h2>Testele nu au putut fi încărcate</h2>
          <p>{historyError}</p>
        </section>
      );
    }
    if (quizzes.length === 0) {
      return (
        <section className="tab-empty-state">
          <ClipboardList size={38} />
          <h2>Nu ai salvat încă teste</h2>
          <p>
            Creează un test dintr-un fișier importat, iar acesta va apărea
            aici.
          </p>
        </section>
      );
    }

    return (
      <section className="saved-items-grid">
        {quizzes.map((quiz) => {
          const isEditing = editingQuizId === quiz.id;

          return (
            <article className="saved-quiz-card" key={quiz.id}>
              <span className="saved-quiz-icon">
                <ClipboardList size={27} />
              </span>

              <div className="saved-quiz-content">
                {isEditing ? (
                  <>
                    <div className="quiz-title-edit-row">
                      <input
                        autoFocus
                        type="text"
                        value={editedQuizTitle}
                        onChange={(event) =>
                          setEditedQuizTitle(event.target.value)
                        }
                        maxLength={100}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            handleRenameQuiz(quiz.id);
                          }

                          if (event.key === "Escape") {
                            cancelRenamingQuiz();
                          }
                        }}
                      />

                      <button
                        className="save-name-button"
                        type="button"
                        onClick={() => handleRenameQuiz(quiz.id)}
                        aria-label="Salvează numele"
                      >
                        <Save size={17} />
                      </button>

                      <button
                        className="cancel-name-button"
                        type="button"
                        onClick={cancelRenamingQuiz}
                        aria-label="Anulează"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    {quizRenameError && (
                      <p className="quiz-rename-error">{quizRenameError}</p>
                    )}
                  </>
                ) : (
                  <div className="quiz-title-row">
                    <h3>{quiz.title}</h3>

                    <button
                      className="rename-quiz-button"
                      type="button"
                      onClick={() => startRenamingQuiz(quiz)}
                      aria-label="Redenumește testul"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                )}

                <p>Creat la {formatDate(quiz.createdAt)}</p>

                <div className="quiz-tags">
                  <span>{quiz.questions.length} întrebări</span>

                  <span>
                    {quiz.settings.answersPerQuestion === "all"
                      ? "Toate variantele"
                      : `${quiz.settings.answersPerQuestion} variante`}
                  </span>

                  <span>
                    {quiz.settings.randomizeQuestions
                      ? "Întrebări amestecate"
                      : "Ordine originală"}
                  </span>
                </div>
              </div>

              <div className="saved-quiz-actions">
                <button type="button" onClick={() => solveSavedQuiz(quiz)}>
                  <Play size={17} />
                  Rezolvă
                </button>

                <button
                  className="delete-file-button"
                  type="button"
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  aria-label="Șterge testul"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </section>
    );
  }

  function renderAttemptDetails() {
    if (!selectedAttempt) {
      return null;
    }

    return (
      <section className="attempt-details">
        <button
          className="return-to-list-button"
          type="button"
          onClick={() => setSelectedAttempt(null)}
        >
          <ArrowLeft size={18} />
          Înapoi la rezultate
        </button>

        <header className="attempt-details-header">
          <div>
            <h2>{selectedAttempt.quizTitle}</h2>
            <p>Finalizat la {formatDate(selectedAttempt.completedAt)}</p>
          </div>

          <div className="attempt-score-large">
            <strong>{selectedAttempt.percentage}%</strong>
            <span>
              {formatPoints(selectedAttempt.earnedPoints)} /{" "}
              {selectedAttempt.totalQuestions} puncte
            </span>
          </div>
        </header>

        <p className="saved-result-message">{selectedAttempt.resultMessage}</p>

        {selectedAttempt.progressMessage && (
          <p className="saved-progress-message">
            {selectedAttempt.progressMessage}
          </p>
        )}

        <div className="attempt-question-list">
          {selectedAttempt.questionResults.map((result, index) => (
            <details className="attempt-question-result" key={`${result.questionNumber}-${index}`}>
              <summary>
                <span
                  className={
                    result.fullyCorrect
                      ? "attempt-complete"
                      : result.points > 0
                      ? "attempt-partial"
                      : "attempt-wrong"
                  }
                >
                  {formatPoints(result.points)} / 1
                </span>

                Întrebarea {result.questionNumber}
              </summary>

              <div className="attempt-answer-summary">
                <p>
                  <strong>Corecte selectate:</strong>{" "}
                  {result.correctSelected.length > 0
                    ? result.correctSelected.map((answer) => answer.toUpperCase()).join(", ")
                    : "Niciuna"}
                </p>

                <p>
                  <strong>Greșite selectate:</strong>{" "}
                  {result.wrongSelected.length > 0
                    ? result.wrongSelected.map((answer) => answer.toUpperCase()).join(", ")
                    : "Niciuna"}
                </p>

                <p>
                  <strong>Corecte ratate:</strong>{" "}
                  {result.missedCorrect.length > 0
                    ? result.missedCorrect.map((answer) => answer.toUpperCase()).join(", ")
                    : "Niciuna"}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>
    );
  }

  function renderResultsTab() {
    if (isLoadingHistory) {
      return (
        <section className="tab-empty-state">
          <LoaderCircle className="subjects-loader-icon" size={34} />
          <p>Se încarcă rezultatele...</p>
        </section>
      );
    }

    if (historyError) {
      return (
        <section className="tab-empty-state">
          <h2>Rezultatele nu au putut fi încărcate</h2>
          <p>{historyError}</p>
        </section>
      );
    }
    if (selectedAttempt) {
      return renderAttemptDetails();
    }

    if (attempts.length === 0) {
      return (
        <section className="tab-empty-state">
          <History size={38} />
          <h2>Nu există rezultate salvate</h2>
          <p>
            După ce finalizezi un test, punctajul și răspunsurile vor apărea
            aici.
          </p>
        </section>
      );
    }

    return (
      <>
        <section className="recovery-card">
          <div className="recovery-card-heading">
            <span className="recovery-card-icon">
              <RotateCcw size={25} />
            </span>

            <div>
              <h2>Întrebări de repetat</h2>
              <p>
                Le mai dăm o șansă întrebărilor care ți-au făcut probleme?
              </p>
            </div>
          </div>

          <div className="recovery-options">
            <article>
              <strong>{recoverySummary.all}</strong>
              <span>Greșite sau parțiale</span>

              <button
                type="button"
                disabled={recoverySummary.all === 0}
                onClick={() => createRecoveryQuiz("all")}
              >
                Creează test
              </button>
            </article>

            <article>
              <strong>{recoverySummary.wrong}</strong>
              <span>Greșite complet</span>

              <button
                type="button"
                disabled={recoverySummary.wrong === 0}
                onClick={() => createRecoveryQuiz("wrong")}
              >
                Creează test
              </button>
            </article>

            <article>
              <strong>{recoverySummary.repeated}</strong>
              <span>Greșite de minimum 2 ori</span>

              <button
                type="button"
                disabled={recoverySummary.repeated === 0}
                onClick={() => createRecoveryQuiz("repeated")}
              >
                Creează test
              </button>
            </article>
          </div>

          {recoveryError && (
            <p className="recovery-error">{recoveryError}</p>
          )}
        </section>

        <section className="attempts-list">
          {attempts.map((attempt) => (
            <article className="attempt-card" key={attempt.id}>
              <div className="attempt-percentage">
                <strong>{attempt.percentage}%</strong>
                <span>
                  {formatPoints(attempt.earnedPoints)} / {attempt.totalQuestions}
                </span>
              </div>

              <div className="attempt-content">
                <h3>{attempt.quizTitle}</h3>
                <p className="attempt-message">{attempt.resultMessage}</p>

                {attempt.progressMessage && (
                  <p className="attempt-progress-note">
                    {attempt.progressMessage}
                  </p>
                )}

                <small>{formatDate(attempt.completedAt)}</small>
              </div>

              <div className="attempt-actions">
                <button
                  className="view-file-button"
                  type="button"
                  onClick={() => setSelectedAttempt(attempt)}
                >
                  Detalii
                </button>

                <button
                  className="delete-file-button"
                  type="button"
                  onClick={() => handleDeleteAttempt(attempt.id)}
                  aria-label="Șterge rezultatul"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </section>
      </>
    );
  }

  return (
    <main className="subject-page">
      <header className="subject-workspace-header">
        <button type="button" onClick={() => navigate("/")}>
          <ArrowLeft size={20} />
          Materii
        </button>

        <div>
          <p>Materia curentă</p>
          <h1>{subject.name}</h1>
        </div>
      </header>

      <nav className="subject-tabs">
        {TABS.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              className={activeTab === tab.id ? "active" : ""}
              key={tab.id}
              type="button"
              onClick={() => changeTab(tab.id)}
            >
              <Icon size={19} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <section className="subject-tab-content">
        {activeTab === "upload" && (
          <UploadPage
            key={questionSetForQuiz?.id || "new-import"}
            embedded
            subject={subject}
            initialQuestionSet={questionSetForQuiz}
            onImportCompleted={handleImportCompleted}
            onQuizCreated={handleQuizCreated}
          />
        )}

        {activeTab === "files" && renderFilesTab()}

        {activeTab === "quizzes" && renderQuizzesTab()}

        {activeTab === "results" && renderResultsTab()}

        {activeTab === "statistics" &&
          (isLoadingHistory ? (
            <section className="tab-empty-state">
              <LoaderCircle className="subjects-loader-icon" size={34} />
              <p>Se încarcă statisticile...</p>
            </section>
          ) : historyError ? (
            <section className="tab-empty-state">
              <h2>Statisticile nu au putut fi încărcate</h2>
              <p>{historyError}</p>
            </section>
          ) : (
            <SubjectStatistics
              attempts={attempts}
              onOpenAttempt={openAttemptFromStatistics}
            />
          ))}
      </section>
    </main>
  );
}

export default SubjectPage;