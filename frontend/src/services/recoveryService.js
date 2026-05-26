function getOriginalQuestion(questionSets, questionSetId, questionNumber) {
  const sourceSet = questionSets.find(
    (questionSet) => questionSet.id === questionSetId
  );

  if (!sourceSet) {
    return null;
  }

  return (
    sourceSet.questions.find(
      (question) => question.number === questionNumber
    ) || null
  );
}

export function getRecoveryQuestions(
  attempts,
  questionSets,
  mode = "all"
) {
  const recoveryMap = new Map();

  attempts.forEach((attempt) => {
    (attempt.questionResults || []).forEach((result, index) => {
      if (result.points >= 1) {
        return;
      }

      const attemptedQuestion =
        attempt.questions?.[index] ||
        attempt.questions?.find(
          (question) => question.number === result.questionNumber
        );

      if (!attemptedQuestion) {
        return;
      }

      const originQuestionSetId =
        attemptedQuestion.originQuestionSetId ||
        attempt.questionSetId ||
        null;

      const originQuestionNumber =
        attemptedQuestion.originQuestionNumber ||
        result.questionNumber;

      const originalQuestion =
        getOriginalQuestion(
          questionSets,
          originQuestionSetId,
          originQuestionNumber
        ) || attemptedQuestion;

      const key = `${originQuestionSetId || "recovery"}-${originQuestionNumber}`;

      if (!recoveryMap.has(key)) {
        recoveryMap.set(key, {
          question: {
            ...originalQuestion,
            originQuestionSetId,
            originQuestionNumber,
          },
          lostPointsCount: 0,
          zeroPointsCount: 0,
          partialPointsCount: 0,
          latestAttemptAt: attempt.completedAt,
        });
      }

      const recoveryItem = recoveryMap.get(key);

      recoveryItem.lostPointsCount += 1;
      recoveryItem.latestAttemptAt = attempt.completedAt;

      if (result.points === 0) {
        recoveryItem.zeroPointsCount += 1;
      } else {
        recoveryItem.partialPointsCount += 1;
      }
    });
  });

  let items = Array.from(recoveryMap.values());

  if (mode === "wrong") {
    items = items.filter((item) => item.zeroPointsCount > 0);
  }

  if (mode === "repeated") {
    items = items.filter((item) => item.lostPointsCount >= 2);
  }

  return items.sort((firstItem, secondItem) => {
    if (secondItem.lostPointsCount !== firstItem.lostPointsCount) {
      return secondItem.lostPointsCount - firstItem.lostPointsCount;
    }

    return (
      new Date(secondItem.latestAttemptAt) -
      new Date(firstItem.latestAttemptAt)
    );
  });
}

export function buildRecoveryQuestionSet(
  subjectId,
  attempts,
  questionSets,
  mode = "all"
) {
  const recoveryItems = getRecoveryQuestions(
    attempts,
    questionSets,
    mode
  );

  const titles = {
    all: "Recuperare - întrebări greșite și parțiale",
    wrong: "Recuperare - întrebări greșite complet",
    repeated: "Recuperare - întrebări greșite repetat",
  };

  const questions = recoveryItems.map((item) => ({
    ...item.question,
    recoveryStats: {
      lostPointsCount: item.lostPointsCount,
      zeroPointsCount: item.zeroPointsCount,
      partialPointsCount: item.partialPointsCount,
    },
  }));

  const correctAnswersCount = questions.reduce(
    (total, question) =>
      total +
      question.answers.filter((answer) => answer.correct).length,
    0
  );

  return {
    id: `recovery-${mode}-${Date.now()}`,
    subjectId,
    filename: titles[mode],
    fileType: "recovery",
    questionsCount: questions.length,
    correctAnswersCount,
    warnings: [],
    questions,
    importedAt: new Date().toISOString(),
    isRecoverySet: true,
    recoveryMode: mode,
  };
}