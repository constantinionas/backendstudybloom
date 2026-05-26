import {
  Award,
  BarChart3,
  ClipboardCheck,
  History,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import "../../styles/statistics.css";

function formatDate(dateValue) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));
}

function formatShortDate(dateValue) {
  return new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(dateValue));
}

function formatPoints(points) {
  if (Number.isInteger(points)) {
    return points.toString();
  }

  return points.toFixed(2).replace(".", ",");
}

function calculateStatistics(attempts) {
  if (attempts.length === 0) {
    return null;
  }

  const completedTests = attempts.length;

  const totalPercentage = attempts.reduce(
    (total, attempt) => total + attempt.percentage,
    0
  );

  const averagePercentage = Math.round(totalPercentage / completedTests);

  const bestAttempt = attempts.reduce((best, attempt) =>
    attempt.percentage > best.percentage ? attempt : best
  );

  const latestAttempt = [...attempts].sort(
    (firstAttempt, secondAttempt) =>
      new Date(secondAttempt.completedAt) -
      new Date(firstAttempt.completedAt)
  )[0];

  const totalFullyCorrect = attempts.reduce(
    (total, attempt) => total + (attempt.fullyCorrectCount || 0),
    0
  );

  const totalPartiallyCorrect = attempts.reduce(
    (total, attempt) => total + (attempt.partiallyCorrectCount || 0),
    0
  );

  const totalWrong = attempts.reduce(
    (total, attempt) => total + (attempt.wrongCount || 0),
    0
  );

  const chartData = [...attempts]
    .sort(
      (firstAttempt, secondAttempt) =>
        new Date(firstAttempt.completedAt) -
        new Date(secondAttempt.completedAt)
    )
    .map((attempt, index) => ({
      name: `T${index + 1}`,
      date: formatShortDate(attempt.completedAt),
      percentage: attempt.percentage,
      title: attempt.quizTitle,
    }));

  const mistakesByQuestion = {};

  attempts.forEach((attempt) => {
    const attemptQuestions = attempt.questions || [];

    (attempt.questionResults || []).forEach((result) => {
      if (result.fullyCorrect) {
        return;
      }

      const question = attemptQuestions.find(
        (item) => item.number === result.questionNumber
      );

      const questionKey = `${attempt.questionSetId || "set"}-${result.questionNumber}`;

      if (!mistakesByQuestion[questionKey]) {
        mistakesByQuestion[questionKey] = {
          questionNumber: result.questionNumber,
          text: question?.text || `Întrebarea ${result.questionNumber}`,
          appearances: 0,
          zeroPointsCount: 0,
          partialPointsCount: 0,
          missedAnswersCount: 0,
          wrongAnswersCount: 0,
        };
      }

      mistakesByQuestion[questionKey].appearances += 1;
      mistakesByQuestion[questionKey].missedAnswersCount +=
        result.missedCorrect?.length || 0;
      mistakesByQuestion[questionKey].wrongAnswersCount +=
        result.wrongSelected?.length || 0;

      if (result.points === 0) {
        mistakesByQuestion[questionKey].zeroPointsCount += 1;
      } else {
        mistakesByQuestion[questionKey].partialPointsCount += 1;
      }
    });
  });

  const mostDifficultQuestions = Object.values(mistakesByQuestion)
    .sort((firstQuestion, secondQuestion) => {
      if (secondQuestion.appearances !== firstQuestion.appearances) {
        return secondQuestion.appearances - firstQuestion.appearances;
      }

      return secondQuestion.zeroPointsCount - firstQuestion.zeroPointsCount;
    })
    .slice(0, 5);

  return {
    completedTests,
    averagePercentage,
    bestAttempt,
    latestAttempt,
    totalFullyCorrect,
    totalPartiallyCorrect,
    totalWrong,
    chartData,
    mostDifficultQuestions,
  };
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) {
    return null;
  }

  const data = payload[0].payload;

  return (
    <div className="statistics-tooltip">
      <strong>{data.title}</strong>
      <span>{data.date}</span>
      <p>{data.percentage}%</p>
    </div>
  );
}

function SubjectStatistics({ attempts, onOpenAttempt }) {
  const statistics = calculateStatistics(attempts);

  if (!statistics) {
    return (
      <section className="statistics-empty-state">
        <BarChart3 size={40} />

        <h2>Nu există statistici încă</h2>

        <p>
          Rezolvă primul test din această materie, iar aici vei vedea
          progresul și întrebările care trebuie repetate.
        </p>
      </section>
    );
  }

  return (
    <section className="statistics-page">
      <header className="statistics-heading">
        <div>
          <h2>Statistici materie</h2>
          <p>Rezultatele tale calculate din testele finalizate.</p>
        </div>
      </header>

      <section className="statistics-cards">
        <article className="statistics-card">
          <span className="statistics-icon tests">
            <ClipboardCheck size={23} />
          </span>

          <div>
            <strong>{statistics.completedTests}</strong>
            <p>Teste rezolvate</p>
          </div>
        </article>

        <article className="statistics-card">
          <span className="statistics-icon average">
            <Target size={23} />
          </span>

          <div>
            <strong>{statistics.averagePercentage}%</strong>
            <p>Scor mediu</p>
          </div>
        </article>

        <article className="statistics-card">
          <span className="statistics-icon best">
            <Award size={23} />
          </span>

          <div>
            <strong>{statistics.bestAttempt.percentage}%</strong>
            <p>Cel mai bun scor</p>
          </div>
        </article>

        <article className="statistics-card">
          <span className="statistics-icon latest">
            <History size={23} />
          </span>

          <div>
            <strong>{statistics.latestAttempt.percentage}%</strong>
            <p>Ultimul test</p>
          </div>
        </article>
      </section>

      <section className="statistics-main-grid">
        <article className="score-evolution-card">
          <header>
            <div>
              <h3>
                <TrendingUp size={19} />
                Evoluția scorurilor
              </h3>
              <p>Procentajul obținut la fiecare test rezolvat.</p>
            </div>
          </header>

          <div className="score-chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={statistics.chartData}
                margin={{
                  top: 12,
                  right: 16,
                  left: -14,
                  bottom: 4,
                }}
              >
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickLine={false}
                  axisLine={false}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="percentage"
                  stroke="var(--purple-primary)"
                  strokeWidth={3}
                  dot={{
                    r: 5,
                    fill: "var(--purple-primary)",
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 7,
                    fill: "var(--pink-primary)",
                    strokeWidth: 0,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="answer-distribution-card">
          <h3>Răspunsuri evaluate</h3>

          <div className="distribution-list">
            <div className="distribution-item correct">
              <span />
              <p>Complete</p>
              <strong>{statistics.totalFullyCorrect}</strong>
            </div>

            <div className="distribution-item partial">
              <span />
              <p>Parțiale</p>
              <strong>{statistics.totalPartiallyCorrect}</strong>
            </div>

            <div className="distribution-item wrong">
              <span />
              <p>Greșite</p>
              <strong>{statistics.totalWrong}</strong>
            </div>
          </div>

          <div className="best-result-summary">
            <p>Cel mai bun rezultat</p>
            <strong>{statistics.bestAttempt.percentage}%</strong>
            <span>{statistics.bestAttempt.quizTitle}</span>
          </div>
        </article>
      </section>

      <section className="statistics-bottom-grid">
        <article className="difficult-questions-card">
          <header>
            <h3>Întrebări de repetat</h3>
            <p>Întrebările la care ai pierdut puncte cel mai des.</p>
          </header>

          {statistics.mostDifficultQuestions.length === 0 ? (
            <div className="no-difficult-questions">
              <Award size={28} />
              <p>Nu ai greșit nicio întrebare în testele rezolvate.</p>
            </div>
          ) : (
            <div className="difficult-questions-list">
              {statistics.mostDifficultQuestions.map((question, index) => (
                <article
                  className="difficult-question-row"
                  key={`${question.questionNumber}-${index}`}
                >
                  <span className="difficulty-position">{index + 1}</span>

                  <div>
                    <strong>Întrebarea {question.questionNumber}</strong>
                    <p>{question.text}</p>

                    <small>
                      {question.appearances} apariții cu puncte pierdute
                      {question.zeroPointsCount > 0 &&
                        ` • ${question.zeroPointsCount} greșite complet`}
                    </small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="recent-results-card">
          <header>
            <h3>Rezultate recente</h3>
          </header>

          <div className="recent-results-list">
            {attempts.slice(0, 4).map((attempt) => (
              <button
                className="recent-result-row"
                key={attempt.id}
                type="button"
                onClick={() => onOpenAttempt(attempt)}
              >
                <span className="recent-result-percentage">
                  {attempt.percentage}%
                </span>

                <div>
                  <strong>{attempt.quizTitle}</strong>
                  <p>{attempt.resultMessage}</p>
                  <small>
                    {formatPoints(attempt.earnedPoints)} /{" "}
                    {attempt.totalQuestions} puncte •{" "}
                    {formatDate(attempt.completedAt)}
                  </small>
                </div>
              </button>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}

export default SubjectStatistics;