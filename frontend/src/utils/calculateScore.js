export function evaluateQuestion(question, selectedAnswers) {
  const correctLabels = question.answers
    .filter((answer) => answer.correct)
    .map((answer) => answer.label);

  const correctSelected = selectedAnswers.filter((label) =>
    correctLabels.includes(label)
  );

  const wrongSelected = selectedAnswers.filter(
    (label) => !correctLabels.includes(label)
  );

  const missedCorrect = correctLabels.filter(
    (label) => !selectedAnswers.includes(label)
  );

  const weightedCorrectAnswers =
    correctSelected.length - wrongSelected.length * 0.5;

  const rawPoints =
    correctLabels.length > 0
      ? weightedCorrectAnswers / correctLabels.length
      : 0;

  const points = Math.max(0, Math.min(1, rawPoints));

  const fullyCorrect =
    wrongSelected.length === 0 &&
    missedCorrect.length === 0 &&
    correctSelected.length === correctLabels.length;

  return {
    questionNumber: question.number,
    selectedAnswers,
    correctAnswers: correctLabels,
    correctSelected,
    wrongSelected,
    missedCorrect,
    points,
    fullyCorrect,
  };
}

export function calculateQuizSummary(questionResults, totalQuestions) {
  const earnedPoints = questionResults.reduce(
    (total, result) => total + result.points,
    0
  );

  const percentage =
    totalQuestions > 0
      ? Math.round((earnedPoints / totalQuestions) * 100)
      : 0;

  const fullyCorrectCount = questionResults.filter(
    (result) => result.fullyCorrect
  ).length;

  const partiallyCorrectCount = questionResults.filter(
    (result) => result.points > 0 && !result.fullyCorrect
  ).length;

  const wrongCount = questionResults.filter(
    (result) => result.points === 0
  ).length;

  return {
    earnedPoints,
    percentage,
    fullyCorrectCount,
    partiallyCorrectCount,
    wrongCount,
  };
}

export function formatPoints(points) {
  if (Number.isInteger(points)) {
    return points.toString();
  }

  return points.toFixed(2).replace(".", ",");
}