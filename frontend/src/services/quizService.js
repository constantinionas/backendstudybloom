import api from "./api";

function normalizeQuiz(quiz) {
  return {
    id: quiz.id,
    subjectId: quiz.subject_id || quiz.subjectId,
    questionSetId: quiz.question_set_id || quiz.questionSetId || null,
    title: quiz.title,
    sourceFilename: quiz.source_filename || quiz.sourceFilename || "",
    questions: quiz.questions || [],
    settings: quiz.settings || {},
    isRecoveryQuiz: quiz.is_recovery_quiz ?? quiz.isRecoveryQuiz ?? false,
    recoveryMode: quiz.recovery_mode || quiz.recoveryMode || null,
    createdAt: quiz.created_at || quiz.createdAt,
  };
}

export async function fetchQuizzesBySubject(subjectId) {
  try {
    const response = await api.get(`/quizzes/subject/${subjectId}`);

    return response.data.map(normalizeQuiz);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Testele create nu au putut fi încărcate."
    );
  }
}

export async function saveQuizToDatabase(quizData) {
  try {
    const response = await api.post("/quizzes", {
      subject_id: quizData.subjectId,
      question_set_id: quizData.questionSetId || null,
      title: quizData.title,
      source_filename: quizData.sourceFilename || null,
      questions: quizData.questions,
      settings: quizData.settings,
      is_recovery_quiz: Boolean(quizData.isRecoveryQuiz),
      recovery_mode: quizData.recoveryMode || null,
    });

    return normalizeQuiz(response.data);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Testul nu a putut fi salvat."
    );
  }
}

export async function renameQuizInDatabase(quizId, newTitle) {
  const trimmedTitle = newTitle.trim();

  if (!trimmedTitle) {
    throw new Error("Numele testului nu poate fi gol.");
  }

  try {
    const response = await api.patch(`/quizzes/${quizId}/title`, {
      title: trimmedTitle,
    });

    return normalizeQuiz(response.data);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Testul nu a putut fi redenumit."
    );
  }
}

export async function deleteQuizFromDatabase(quizId) {
  try {
    await api.delete(`/quizzes/${quizId}`);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Testul nu a putut fi șters."
    );
  }
}