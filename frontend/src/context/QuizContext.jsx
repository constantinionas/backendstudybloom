import { createContext, useContext, useState } from "react";

const QuizContext = createContext(null);

export function QuizProvider({ children }) {
  const [activeQuiz, setActiveQuiz] = useState(null);

  function startQuiz(quizData) {
    setActiveQuiz(quizData);
  }

  function clearQuiz() {
    setActiveQuiz(null);
  }

  return (
    <QuizContext.Provider
      value={{
        activeQuiz,
        startQuiz,
        clearQuiz,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useQuiz() {
  const context = useContext(QuizContext);

  if (!context) {
    throw new Error("useQuiz trebuie folosit în interiorul QuizProvider.");
  }

  return context;
}