import api from "./api";

function normalizeAttempt(attempt) {
  return {
    id: attempt.id,
    subjectId: attempt.subject_id || attempt.subjectId,
    questionSetId:
      attempt.question_set_id || attempt.questionSetId || null,
    quizId: attempt.quiz_id || attempt.quizId || null,

    quizTitle: attempt.quiz_title || attempt.quizTitle,
    sourceFilename:
      attempt.source_filename || attempt.sourceFilename || "",

    settings: attempt.settings || {},

    totalQuestions:
      attempt.total_questions ?? attempt.totalQuestions ?? 0,
    earnedPoints:
      Number(attempt.earned_points ?? attempt.earnedPoints ?? 0),
    percentage: attempt.percentage ?? 0,

    fullyCorrectCount:
      attempt.fully_correct_count ?? attempt.fullyCorrectCount ?? 0,
    partiallyCorrectCount:
      attempt.partially_correct_count ??
      attempt.partiallyCorrectCount ??
      0,
    wrongCount: attempt.wrong_count ?? attempt.wrongCount ?? 0,

    resultMessage:
      attempt.result_message || attempt.resultMessage || "",
    progressMessage:
      attempt.progress_message || attempt.progressMessage || "",
    progressDifference:
      attempt.progress_difference ?? attempt.progressDifference ?? null,
    specialRewardUnlocked:
      attempt.special_reward_unlocked ??
      attempt.specialRewardUnlocked ??
      false,

    questionResults:
      attempt.question_results || attempt.questionResults || [],
    questions: attempt.questions || [],

    completedAt: attempt.completed_at || attempt.completedAt,
  };
}

export async function fetchAttemptsBySubject(subjectId) {
  try {
    const response = await api.get(`/attempts/subject/${subjectId}`);

    return response.data.map(normalizeAttempt);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Rezultatele nu au putut fi încărcate."
    );
  }
}

export async function saveAttemptToDatabase(attemptData) {
  try {
    const response = await api.post("/attempts", {
      subject_id: attemptData.subjectId,
      question_set_id: attemptData.questionSetId || null,
      quiz_id: attemptData.quizId || null,

      quiz_title: attemptData.quizTitle,
      source_filename: attemptData.sourceFilename || null,
      settings: attemptData.settings || {},

      total_questions: attemptData.totalQuestions,
      earned_points: attemptData.earnedPoints,
      percentage: attemptData.percentage,

      fully_correct_count: attemptData.fullyCorrectCount,
      partially_correct_count: attemptData.partiallyCorrectCount,
      wrong_count: attemptData.wrongCount,

      result_message: attemptData.resultMessage || null,
      progress_message: attemptData.progressMessage || null,
      progress_difference: attemptData.progressDifference || null,
      special_reward_unlocked: Boolean(
        attemptData.specialRewardUnlocked
      ),

      question_results: attemptData.questionResults || [],
      questions: attemptData.questions || [],
    });

    return normalizeAttempt(response.data);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Rezultatul nu a putut fi salvat."
    );
  }
}

export async function deleteAttemptFromDatabase(attemptId) {
  try {
    await api.delete(`/attempts/${attemptId}`);
  } catch (requestError) {
    throw new Error(
      requestError.response?.data?.detail ||
        "Rezultatul nu a putut fi șters."
    );
  }
}