function shuffleArray(items) {
  const array = [...items];

  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[randomIndex]] = [array[randomIndex], array[index]];
  }

  return array;
}

function restoreOriginalAnswerOrder(answers, originalAnswers) {
  return [...answers].sort(
    (firstAnswer, secondAnswer) =>
      originalAnswers.findIndex((answer) => answer.label === firstAnswer.label) -
      originalAnswers.findIndex((answer) => answer.label === secondAnswer.label)
  );
}

function buildAnswersForQuestion({
  question,
  answersPerQuestion,
  preserveAllCorrectAnswers,
  randomizeAnswers,
}) {
  const originalAnswers = question.answers;
  const correctAnswers = originalAnswers.filter((answer) => answer.correct);
  const wrongAnswers = originalAnswers.filter((answer) => !answer.correct);

  if (correctAnswers.length === 0) {
    return null;
  }

  if (answersPerQuestion === "all") {
    return randomizeAnswers
      ? shuffleArray(originalAnswers)
      : [...originalAnswers];
  }

  const requestedAnswersCount = Number(answersPerQuestion);

  if (originalAnswers.length < requestedAnswersCount) {
    return null;
  }

  // eslint-disable-next-line no-useless-assignment
  let displayedAnswers = [];

  if (preserveAllCorrectAnswers) {
    if (correctAnswers.length > requestedAnswersCount) {
      return null;
    }

    const neededWrongAnswers =
      requestedAnswersCount - correctAnswers.length;

    if (wrongAnswers.length < neededWrongAnswers) {
      return null;
    }

    const selectedWrongAnswers = randomizeAnswers
      ? shuffleArray(wrongAnswers).slice(0, neededWrongAnswers)
      : wrongAnswers.slice(0, neededWrongAnswers);

    displayedAnswers = [...correctAnswers, ...selectedWrongAnswers];
  } else if (randomizeAnswers) {
    const selectedCorrectAnswer = shuffleArray(correctAnswers)[0];

    const remainingAnswers = originalAnswers.filter(
      (answer) => answer.label !== selectedCorrectAnswer.label
    );

    displayedAnswers = [
      selectedCorrectAnswer,
      ...shuffleArray(remainingAnswers).slice(0, requestedAnswersCount - 1),
    ];
  } else {
    displayedAnswers = originalAnswers.slice(0, requestedAnswersCount);

    const containsCorrectAnswer = displayedAnswers.some(
      (answer) => answer.correct
    );

    if (!containsCorrectAnswer) {
      displayedAnswers[displayedAnswers.length - 1] = correctAnswers[0];
    }
  }

  return randomizeAnswers
    ? shuffleArray(displayedAnswers)
    : restoreOriginalAnswerOrder(displayedAnswers, originalAnswers);
}

export function generateQuiz({
  questions,
  questionCount,
  answersPerQuestion,
  preserveAllCorrectAnswers,
  randomizeQuestions,
  randomizeAnswers,
}) {
  const compatibleQuestions = questions
    .map((question) => {
      const generatedAnswers = buildAnswersForQuestion({
        question,
        answersPerQuestion,
        preserveAllCorrectAnswers,
        randomizeAnswers,
      });

      if (!generatedAnswers) {
        return null;
      }

      return {
        ...question,
        answers: generatedAnswers,
      };
    })
    .filter(Boolean);

  if (compatibleQuestions.length < questionCount) {
    throw new Error(
      `Pot genera doar ${compatibleQuestions.length} întrebări cu setările alese. Scade numărul de întrebări, alege mai multe variante afișate sau dezactivează păstrarea tuturor răspunsurilor corecte.`
    );
  }

  const orderedQuestions = randomizeQuestions
    ? shuffleArray(compatibleQuestions)
    : compatibleQuestions;

  return orderedQuestions
    .slice(0, questionCount)
    .map((question, index) => ({
      ...question,
      quizOrder: index + 1,
    }));
}