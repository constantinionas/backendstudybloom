import api from "./api";

function normalizeQuestionSet(questionSet) {
  return {
    id: questionSet.id,
    subjectId: questionSet.subject_id || questionSet.subjectId,
    filename: questionSet.filename,
    fileType: questionSet.file_type || questionSet.fileType,
    questionsCount:
      questionSet.questions_count ?? questionSet.questionsCount ?? 0,
    correctAnswersCount:
      questionSet.correct_answers_count ??
      questionSet.correctAnswersCount ??
      0,
    warnings: questionSet.warnings || [],
    questions: questionSet.questions || [],
    storagePath: questionSet.storage_path || questionSet.storagePath || null,
    status: questionSet.status || "processed",
    importedAt: questionSet.imported_at || questionSet.importedAt,
  };
}

export async function fetchQuestionSetsBySubject(subjectId) {
  try {
    const response = await api.get(`/question-sets/subject/${subjectId}`);

    return response.data.map(normalizeQuestionSet);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Fișierele importate nu au putut fi încărcate."
    );
  }
}

export async function saveQuestionSetToDatabase(
  subjectId,
  importResult,
  originalFile
) {
  const formData = new FormData();

  formData.append("subject_id", subjectId);
  formData.append("import_result_json", JSON.stringify(importResult));

  if (originalFile) {
    formData.append("source_file", originalFile);
  }

  try {
    const response = await api.post("/question-sets", formData, {
      timeout: 120000,
    });

    return normalizeQuestionSet(response.data);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Fișierul nu a putut fi salvat în baza de date."
    );
  }
}

export async function deleteQuestionSetFromDatabase(questionSetId) {
  try {
    await api.delete(`/question-sets/${questionSetId}`);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Fișierul importat nu a putut fi șters."
    );
  }
}

export function getOriginalFileUrl(questionSetId) {
  const baseUrl =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

  return `${baseUrl}/question-sets/${questionSetId}/source`;
}