import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  HelpCircle,
  ListChecks,
  LoaderCircle,
  Sparkles,
  Trash2,
  UploadCloud,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

import ImportReviewPage from "./ImportReviewPage";
import { useAppSettings } from "../context/AppSettingsContext";

import { useNavigate } from "react-router-dom";

import { useQuiz } from "../context/QuizContext";
import { generateQuiz } from "../utils/generateQuiz";

import { previewImport } from "../services/uploadService";
import "../styles/upload.css";

function formatFileSize(sizeInBytes) {
  if (!sizeInBytes) {
    return "0 KB";
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getExtension(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toUpperCase() : "FILE";
}

function convertSavedQuestionSetToImportResult(questionSet) {
  if (!questionSet) {
    return null;
  }

  return {
    filename: questionSet.filename,
    file_type: questionSet.fileType,
    questions_count: questionSet.questionsCount,
    correct_answers_count: questionSet.correctAnswersCount,
    warnings: questionSet.warnings || [],
    questions: questionSet.questions || [],
  };
}

function UploadPage({
  embedded = false,
  subject = null,
  onImportCompleted = null,
  initialQuestionSet = null,
  onQuizCreated = null,
}) {
  const navigate = useNavigate();
  const { startQuiz } = useQuiz();
  const { settings, updateSetting } = useAppSettings();

  const inputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [savedQuestionSet, setSavedQuestionSet] = useState(initialQuestionSet);
  const [importResult, setImportResult] = useState(() =>
    convertSavedQuestionSetToImportResult(initialQuestionSet)
  );
  const [questionCount, setQuestionCount] = useState(10);

  const [answersPerQuestion, setAnswersPerQuestion] = useState("4");
  const [preserveAllCorrectAnswers, setPreserveAllCorrectAnswers] =
    useState(false);
  const [randomizeQuestions, setRandomizeQuestions] = useState(true);
  const [randomizeAnswers, setRandomizeAnswers] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState("");

  const maxQuestions = importResult?.questions_count || 100;

  const previewQuestions = useMemo(() => {
    if (!importResult?.questions) {
      return [];
    }

    return importResult.questions.slice(0, 3);
  }, [importResult]);

  const displayedFilename =
    selectedFile?.name || savedQuestionSet?.filename || "";

  const hasSelectedSource = Boolean(selectedFile || savedQuestionSet);

  const manualReviewAfterImport = settings.manualReviewAfterImport;
  const [isReviewingImport, setIsReviewingImport] = useState(false);

  function clearFile() {
    setSelectedFile(null);
    setSavedQuestionSet(null);
    setImportResult(null);
    setIsReviewingImport(false);
    setError("");
    setQuestionCount(10);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleManualReviewSettingChange(event) {
    updateSetting("manualReviewAfterImport", event.target.checked);
  }

  function validateAndSetFile(file) {
    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!["pdf", "docx"].includes(extension)) {
      setError("Încarcă un fișier PDF sau DOCX.");
      return;
    }

    setSelectedFile(file);
    setSavedQuestionSet(null);
    setImportResult(null);
    setError("");
  }

  function handleFileChange(event) {
    validateAndSetFile(event.target.files?.[0]);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    validateAndSetFile(event.dataTransfer.files?.[0]);
  }

  async function handleImport() {
    if (!selectedFile) {
      setError("Selectează mai întâi un fișier.");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      const result = await previewImport(selectedFile);

            setImportResult(result);

      const initialQuestions = Math.min(10, result.questions_count);
      setQuestionCount(initialQuestions || 1);

      if (manualReviewAfterImport) {
        setIsReviewingImport(true);
        return;
      }

      if (subject && onImportCompleted) {
        const createdQuestionSet = await onImportCompleted(
          result,
          selectedFile
        );

        setSavedQuestionSet(createdQuestionSet);
      }
    } catch (requestError) {
      const detail = requestError.response?.data?.detail;

      setError(
        detail ||
          "Fișierul nu a putut fi procesat. Verifică dacă backend-ul este pornit."
      );
    } finally {
      setIsImporting(false);
    }
  }

  async function handleReviewConfirmed(reviewedImportResult) {
    setError("");

    try {
      setImportResult(reviewedImportResult);
      setIsReviewingImport(false);

      if (subject && onImportCompleted) {
        const createdQuestionSet = await onImportCompleted(
          reviewedImportResult,
          selectedFile
        );

        setSavedQuestionSet(createdQuestionSet);
      }
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  function handleReviewCancelled() {
    setImportResult(null);
    setIsReviewingImport(false);
    setError("");
  }

  async function handleGenerateQuiz() {
    if (!importResult) {
      return;
    }

    setError("");

    try {
      const generatedQuestions = generateQuiz({
        questions: importResult.questions,
        questionCount,
        answersPerQuestion,
        preserveAllCorrectAnswers,
        randomizeQuestions,
        randomizeAnswers,
      });

      const isRecoveryQuiz = Boolean(savedQuestionSet?.isRecoverySet);

      const quizData = {
        title: displayedFilename.replace(/\.[^/.]+$/, "") || "Quiz nou",
        sourceFilename: displayedFilename,
        subjectId: subject?.id || null,
        subjectName: subject?.name || "",

        questionSetId: isRecoveryQuiz
          ? null
          : savedQuestionSet?.id || null,

        questions: generatedQuestions,

        settings: {
          questionCount,
          answersPerQuestion,
          preserveAllCorrectAnswers,
          randomizeQuestions,
          randomizeAnswers,
        },

        isRecoveryQuiz,
        recoveryMode: isRecoveryQuiz
          ? savedQuestionSet.recoveryMode
          : null,
      };

      const savedQuiz =
        subject && onQuizCreated
          ? await onQuizCreated(quizData)
          : {
              ...quizData,
              createdAt: new Date().toISOString(),
            };

      startQuiz(savedQuiz);
      navigate("/quiz");
    } catch (generationError) {
      setError(generationError.message);
    }
  }

  if (isReviewingImport && importResult) {
    return (
      <ImportReviewPage
        importResult={importResult}
        subjectName={subject?.name}
        onConfirm={handleReviewConfirmed}
        onCancel={handleReviewCancelled}
      />
    );
  }

  return (
    <main className={`upload-page ${embedded ? "upload-page-embedded" : ""}`}>
      {!embedded && (
        <header className="upload-header">
        <button className="icon-button" type="button" aria-label="Înapoi">
          <ArrowLeft size={22} />
        </button>

        <div>
          <h1>Încarcă grile</h1>
          <p>Importă un fișier PDF sau DOCX</p>
        </div>

        <button className="icon-button" type="button" aria-label="Ajutor">
          <HelpCircle size={22} />
        </button>
              </header>
      )}

      {embedded && (
        <header className="embedded-upload-header">
          <div>
            <h2>Încarcă grile pentru {subject?.name}</h2>
            <p>
              Adaugă un PDF sau DOCX cu răspunsurile corecte evidențiate.
            </p>
          </div>
        </header>
      )}

      <section className="upload-container">
        <div className="upload-column">
          {!hasSelectedSource ? (
            <label
              className={`drop-zone ${isDragging ? "dragging" : ""}`}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
              />

              <span className="upload-cloud">
                <UploadCloud size={35} />
              </span>

              <strong>Încarcă fișierul cu grile</strong>
              <span>PDF sau DOCX cu răspunsuri evidențiate</span>
              <small>Apasă aici sau trage fișierul în această zonă</small>
            </label>
          ) : (
            <article className="file-card">
              <div className="file-type">
                <FileText size={28} />
                <span>
  {savedQuestionSet?.isRecoverySet
    ? "RECAP"
    : getExtension(displayedFilename)}
</span>
              </div>

              <div className="file-information">
                <strong>{displayedFilename}</strong>
<p>
  {selectedFile
    ? formatFileSize(selectedFile.size)
    : `${importResult?.questions_count || 0} întrebări salvate`}
</p>

                {importResult && (
                  <span className="file-success">Fișier procesat</span>
                )}
              </div>

              <button
                className="delete-button"
                type="button"
                onClick={clearFile}
                aria-label="Șterge fișierul"
              >
                <Trash2 size={19} />
              </button>
            </article>
          )}

          {savedQuestionSet?.isRecoverySet && (
            <div className="recovery-source-note">
              <RotateCcw size={19} />

              <div>
                <strong>Test de recuperare</strong>
                <span>
                  Include întrebările la care ai pierdut puncte în încercările
                  anterioare.
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <AlertCircle size={19} />
              <span>{error}</span>
            </div>
          )}

                    {selectedFile && !importResult && (
            <label className="manual-review-setting">
              <div>
                <strong>Verifică manual după import</strong>
                <span>
                  Corectezi răspunsurile detectate înainte ca setul să fie
                  salvat în materie.
                </span>
              </div>

              <input
                type="checkbox"
                checked={manualReviewAfterImport}
                onChange={handleManualReviewSettingChange}
              />
            </label>
          )}

          {selectedFile && !importResult && (
            <button
              className="primary-button import-button"
              type="button"
              onClick={handleImport}
              disabled={isImporting}
            >
              {isImporting ? (
                <>
                  <LoaderCircle className="loading-icon" size={21} />
                  Se procesează fișierul...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Detectează întrebările
                </>
              )}
            </button>
          )}

          {importResult && (
            <>
              <section className="detection-summary">
                <div className="summary-row">
                  <span className="summary-icon questions">
                    <ListChecks size={22} />
                  </span>
                  <span>Întrebări detectate</span>
                  <strong>{importResult.questions_count}</strong>
                </div>

                <div className="summary-divider" />

                <div className="summary-row">
                  <span className="summary-icon answers">
                    <CheckCircle2 size={22} />
                  </span>
                  <span>Răspunsuri corecte</span>
                  <strong>{importResult.correct_answers_count}</strong>
                </div>
              </section>

              {importResult.warnings?.length > 0 && (
                <section className="warnings-card">
                  <h2>Atenție la import</h2>

                  {importResult.warnings.slice(0, 4).map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}

                  {importResult.warnings.length > 4 && (
                    <small>
                      Mai există {importResult.warnings.length - 4} avertismente.
                    </small>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {importResult && (
          <div className="settings-column">
            <section className="quiz-settings-card">
              <h2>
                Configurează testul <Sparkles size={18} />
              </h2>

              <label className="range-setting">
                <span>Numărul de întrebări</span>

                <div className="range-value">{questionCount}</div>

                <input
                  type="range"
                  min="1"
                  max={maxQuestions}
                  value={questionCount}
                  onChange={(event) =>
                    setQuestionCount(Number(event.target.value))
                  }
                />

                <div className="range-limits">
                  <span>1</span>
                  <span>{maxQuestions}</span>
                </div>
              </label>

              <label className="select-setting">
                <span>Maximum variante afișate la fiecare întrebare</span>

              <label className="toggle-setting">
  <div>
    <strong>Păstrează toate răspunsurile corecte</strong>
    <span>
      Întrebările incompatibile cu numărul de variante ales vor fi omise.
    </span>
  </div>

  <input
    type="checkbox"
    checked={preserveAllCorrectAnswers}
    onChange={(event) =>
      setPreserveAllCorrectAnswers(event.target.checked)
    }
  />
</label>


<label className="toggle-setting">
  <div>
    <strong>Amestecă întrebările</strong>
    <span>
      Întrebările vor fi selectate și afișate într-o ordine aleatorie.
    </span>
  </div>

  <input
    type="checkbox"
    checked={randomizeQuestions}
    onChange={(event) => setRandomizeQuestions(event.target.checked)}
  />
</label>

<label className="toggle-setting">
  <div>
    <strong>Amestecă răspunsurile</strong>
    <span>
      Variantele afișate vor fi alese și ordonate aleatoriu.
    </span>
  </div>

  <input
    type="checkbox"
    checked={randomizeAnswers}
    onChange={(event) => setRandomizeAnswers(event.target.checked)}
  />
</label>

                <select
  value={answersPerQuestion}
  onChange={(event) => setAnswersPerQuestion(event.target.value)}
>
  <option value="2">2 variante</option>
  <option value="3">3 variante</option>
  <option value="4">4 variante</option>
  <option value="5">5 variante</option>
  <option value="6">6 variante</option>
  <option value="all">Toate variantele originale</option>
</select>
              </label>

              <p className="setting-note">
  {preserveAllCorrectAnswers
    ? "Testul păstrează toate răspunsurile corecte ale întrebărilor incluse."
    : "Fiecare întrebare va avea minimum un răspuns corect dintre variantele afișate."}
  {!randomizeQuestions && " Întrebările păstrează ordinea din document."}
  {!randomizeAnswers && " Variantele păstrează ordinea originală."}
</p>

              <button
                className="primary-button"
                type="button"
                onClick={handleGenerateQuiz}
              >
                <Sparkles size={20} />
                Generează quiz
              </button>
            </section>
          </div>
        )}
      </section>

      {importResult && previewQuestions.length > 0 && (
        <section className="questions-preview">
          <div className="questions-preview-header">
            <div>
              <h2>Previzualizare import</h2>
              <p>Primele întrebări detectate din fișier</p>
            </div>

            <button className="secondary-button" type="button">
              Verifică toate întrebările
            </button>
          </div>

          <div className="preview-grid">
            {previewQuestions.map((question) => (
              <article className="preview-question-card" key={question.number}>
                <h3>
                  {question.number}. {question.text}
                </h3>

                <div className="preview-answers">
                  {question.answers.slice(0, 5).map((answer) => (
                    <p
                      key={answer.label}
                      className={answer.correct ? "detected-correct" : ""}
                    >
                      <span>{answer.label.toUpperCase()}</span>
                      {answer.text}
                    </p>
                  ))}

                  {question.answers.length > 5 && (
                    <small>
                      + încă {question.answers.length - 5} variante
                    </small>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default UploadPage;