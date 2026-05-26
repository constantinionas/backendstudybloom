import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  FolderOpen,
  GraduationCap,
  LoaderCircle,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  createSubject,
  deleteSubject,
  listSubjects,
} from "../services/subjectService";

import { fetchQuestionSetsBySubject } from "../services/questionSetService";
import { fetchQuizzesBySubject } from "../services/quizService";
import { fetchAttemptsBySubject } from "../services/attemptService";

import {
  getHomeWelcomeMessage,
  getSecretMessage,
  saveCurrentVisit,
} from "../services/experienceService";

import "../styles/organization.css";

function SubjectsPage() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);
  const [subjectStatistics, setSubjectStatistics] = useState({});
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [pageError, setPageError] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [error, setError] = useState("");
  const [isCreatingSubject, setIsCreatingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState(null);

  const [welcomeMessage] = useState(() => getHomeWelcomeMessage());
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [secretMessage, setSecretMessage] = useState("");

  useEffect(() => {
    saveCurrentVisit();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSubjects() {
      setIsLoadingSubjects(true);
      setPageError("");

      try {
                const savedSubjects = await listSubjects();

        const statisticsEntries = await Promise.all(
          savedSubjects.map(async (subject) => {
            const [questionSets, quizzes, attempts] = await Promise.all([
              fetchQuestionSetsBySubject(subject.id),
              fetchQuizzesBySubject(subject.id),
              fetchAttemptsBySubject(subject.id),
            ]);

            return [
              subject.id,
              {
                questionSetsCount: questionSets.length,
                quizzesCount: quizzes.length,
                attemptsCount: attempts.length,
              },
            ];
          })
        );

        if (isActive) {
          setSubjects(savedSubjects);
          setSubjectStatistics(Object.fromEntries(statisticsEntries));
        }
      } catch (loadError) {
        if (isActive) {
          setPageError(loadError.message);
        }
      } finally {
        if (isActive) {
          setIsLoadingSubjects(false);
        }
      }
    }

    loadSubjects();

    return () => {
      isActive = false;
    };
  }, []);

  const totals = useMemo(() => {
    return subjects.reduce(
      (currentTotals, subject) => {
        const statistics = subjectStatistics[subject.id] || {
          questionSetsCount: 0,
          quizzesCount: 0,
          attemptsCount: 0,
        };

        return {
          subjects: currentTotals.subjects + 1,
          files: currentTotals.files + statistics.questionSetsCount,
          attempts: currentTotals.attempts + statistics.attemptsCount,
        };
      },
      {
        subjects: 0,
        files: 0,
        attempts: 0,
      }
    );
  }, [subjects, subjectStatistics]);

  function openModal() {
    setSubjectName("");
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (isCreatingSubject) {
      return;
    }

    setIsModalOpen(false);
    setError("");
  }

  function handleLogoClick() {
    const nextClickCount = logoClickCount + 1;

    if (nextClickCount >= 5) {
      setSecretMessage(getSecretMessage());
      setLogoClickCount(0);
      return;
    }

    setLogoClickCount(nextClickCount);
  }

  function closeSecretMessage() {
    setSecretMessage("");
  }

  async function handleCreateSubject(event) {
    event.preventDefault();

    setIsCreatingSubject(true);
    setError("");

    try {
      const newSubject = await createSubject(subjectName);

      setSubjects((currentSubjects) => [newSubject, ...currentSubjects]);
      setIsModalOpen(false);
      navigate(`/subjects/${newSubject.id}`);
    } catch (creationError) {
      setError(creationError.message);
    } finally {
      setIsCreatingSubject(false);
    }
  }

  async function handleDeleteSubject(event, subjectId) {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Ștergi materia și toate datele asociate acesteia?"
    );

    if (!confirmed) {
      return;
    }

    setDeletingSubjectId(subjectId);
    setPageError("");

    try {
      await deleteSubject(subjectId);

      setSubjectStatistics((currentStatistics) => {
        const updatedStatistics = { ...currentStatistics };
        delete updatedStatistics[subjectId];
        return updatedStatistics;
      });
    } catch (deleteError) {
      setPageError(deleteError.message);
    } finally {
      setDeletingSubjectId(null);
    }
  }

  return (
    <main className="subjects-page">
      <header className="subjects-header">
        <div className="brand-title">
          <span>
            <GraduationCap size={28} />
          </span>

          <button
            className="brand-secret-button"
            type="button"
            onClick={handleLogoClick}
            aria-label="StudyBloom"
          >
            <h1>StudyBloom</h1>
            <p>Organizează grilele pe materii și repetă eficient</p>
          </button>
        </div>

        <button
          className="create-subject-button"
          type="button"
          onClick={openModal}
        >
          <Plus size={19} />
          Materie nouă
        </button>
      </header>

      <section className="subjects-welcome-card">
        <div>
          <span className="welcome-label">
            <Sparkles size={15} />
            Spațiul tău de studiu
          </span>

          <h2>Ce materie repetăm astăzi?</h2>

          <p className="personal-welcome-message">
            {welcomeMessage}
          </p>

          <p className="welcome-helper-text">
            Creează o materie, adaugă fișierele cu grile și generează teste
            personalizate.
          </p>
        </div>

        <div className="subjects-totals">
          <article>
            <strong>{totals.subjects}</strong>
            <span>Materii</span>
          </article>

          <article>
            <strong>{totals.files}</strong>
            <span>Fișiere</span>
          </article>

          <article>
            <strong>{totals.attempts}</strong>
            <span>Teste rezolvate</span>
          </article>
        </div>
      </section>

      {pageError && (
        <div className="subjects-page-error">
          <p>{pageError}</p>
        </div>
      )}

      <section className="subjects-section">
        <div className="section-heading">
          <h2>Materiile mele</h2>

          {subjects.length > 0 && (
            <button type="button" onClick={openModal}>
              <Plus size={18} />
              Adaugă
            </button>
          )}
        </div>

        {isLoadingSubjects ? (
          <div className="subjects-loading">
            <LoaderCircle className="subjects-loader-icon" size={29} />
            <p>Se încarcă materiile...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty-subjects">
            <span>
              <BookOpen size={37} />
            </span>

            <h3>Nu ai creat încă nicio materie</h3>
            <p>
              Începe cu o materie, de exemplu Anatomie, Etică sau Nutriție.
            </p>

            <button type="button" onClick={openModal}>
              <Plus size={19} />
              Creează prima materie
            </button>
          </div>
        ) : (
          <div className="subjects-grid">
            {subjects.map((subject) => {
              const statistics = subjectStatistics[subject.id] || {
                questionSetsCount: 0,
                quizzesCount: 0,
                attemptsCount: 0,
              };
              const isDeleting = deletingSubjectId === subject.id;

              return (
                <article
                  className="subject-card"
                  key={subject.id}
                  onClick={() => navigate(`/subjects/${subject.id}`)}
                >
                  <div className="subject-card-top">
                    <span className="subject-icon">
                      <FolderOpen size={25} />
                    </span>

                    <button
                      className="remove-subject-button"
                      type="button"
                      onClick={(event) =>
                        handleDeleteSubject(event, subject.id)
                      }
                      disabled={isDeleting}
                      aria-label="Șterge materia"
                    >
                      {isDeleting ? (
                        <LoaderCircle
                          className="subjects-loader-icon"
                          size={17}
                        />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>

                  <h3>{subject.name}</h3>

                  <div className="subject-stats">
                    <span>{statistics.questionSetsCount} fișiere</span>
                    <span>{statistics.quizzesCount} teste</span>
                    <span>{statistics.attemptsCount} rezultate</span>
                  </div>

                  <button className="open-subject-button" type="button">
                    Deschide materia
                    <ArrowRight size={17} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {secretMessage && (
        <div className="modal-overlay" onClick={closeSecretMessage}>
          <section
            className="secret-message-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="secret-close-button"
              type="button"
              onClick={closeSecretMessage}
              aria-label="Închide mesajul"
            >
              <X size={19} />
            </button>

            <span className="secret-decoration">
              <Sparkles size={27} />
            </span>

            <p>Ai găsit un mesaj secret</p>
            <h2>{secretMessage}</h2>

            <button
              className="secret-confirm-button"
              type="button"
              onClick={closeSecretMessage}
            >
              Păstrez secretul
            </button>
          </section>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <form
            className="subject-modal"
            onSubmit={handleCreateSubject}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Materie nouă</h2>

              <button
                type="button"
                onClick={closeModal}
                disabled={isCreatingSubject}
                aria-label="Închide"
              >
                <X size={20} />
              </button>
            </div>

            <label>
              Numele materiei
              <input
                autoFocus
                type="text"
                value={subjectName}
                onChange={(event) => setSubjectName(event.target.value)}
                placeholder="Exemplu: Anatomie"
                maxLength={70}
                disabled={isCreatingSubject}
              />
            </label>

            {error && <p className="modal-error">{error}</p>}

            <button
              className="save-subject-button"
              type="submit"
              disabled={isCreatingSubject}
            >
              {isCreatingSubject ? (
                <>
                  <LoaderCircle className="subjects-loader-icon" size={19} />
                  Se salvează...
                </>
              ) : (
                <>
                  <Plus size={19} />
                  Creează materia
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

export default SubjectsPage;