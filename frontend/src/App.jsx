import { Navigate, Route, Routes } from "react-router-dom";

import ThemeToggle from "./components/common/ThemeToggle";
import QuizPage from "./pages/QuizPage";
import SubjectsPage from "./pages/SubjectsPage";
import SubjectPage from "./pages/SubjectPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<SubjectsPage />} />
        <Route path="/subjects/:subjectId" element={<SubjectPage />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ThemeToggle />
    </>
  );
}

export default App;