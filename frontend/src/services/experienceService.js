const EXPERIENCE_STORAGE_KEY = "studybloom_experience";

const MORNING_MESSAGES = [
  "Bună dimineața, copila. Începem ușor și sigur?",
  "O sesiune scurtă de dimineață și ziua începe frumos.",
  "Bună dimineața, pistruiato. Alegem o materie și începem?",
];

const AFTERNOON_MESSAGES = [
  "Bună, pistruiato. Ce materie repetăm azi?",
  "Hai să mai bifăm un quiz reușit, copila.",
  "Ce materie repetăm azi?",
];

const EVENING_MESSAGES = [
  "Mai facem puțin și apoi meriți odihnă, iubita.",
  "Copila, alegem un quiz scurt pentru seara asta?",
  "Hai să mai repetăm puțin, apoi pauză binemeritată.",
];

const LATE_NIGHT_MESSAGES = [
  "Pistruiato, te admir, dar să nu uiți și de somn.",
  "Un test scurt și apoi la odihnă, da, copila?",
  "E târziu, iubita, nu te obosi prea tare.",
];

const RETURN_MESSAGES = [
  "Mi-a fost dor să te văd pe aici, copila. Facem un test scurt?",
  "Ai revenit, pistruiato. Alegem o materie și pornim ușor.",
  "Bine ai revenit, iubita. Grilele te așteptau cuminți aici.",
];

const QUIZ_START_MESSAGES = [
  "Hai, copila, multă atenție. Poți!",
  "Respiră, citește bine și răspunde cu încredere.",
  "Copila, e timpul să arăți cât de bine te descurci.",
  "Hai, copila. Întrebare cu întrebare și va fi foarte bine.",
];

const SECRET_MESSAGES = [
  "Pentru cea mai frumoasă copilă, care poate mai mult decât crede.",
  "Mesaj secret: copilul tău crede în tine. Mereu.",
  "Ai găsit surpriza, pistruiato. Sunt mândru de tine în fiecare zi.",
];

const FIVE_CORRECT_STREAK_MESSAGES = [
  "5 răspunsuri perfecte la rând. Bravo, copila!",
  "Cinci din cinci. Te-ai pornit foarte bine, pistruiato!",
  "Uite cine nu mai greșește nimic. Bravo, iubita!",
];

const TEN_CORRECT_STREAK_MESSAGES = [
  "10 răspunsuri perfecte la rând. Ești incredibilă, copila!",
  "Zece la rând, pistruiato! Acum chiar faci legea în grile.",
  "Iubita, zece întrebări perfecte. Sunt tare mândru de tine!",
];

const RECOVERED_QUESTION_MESSAGES = [
  "Pe asta o greșiseși înainte. Acum ai rezolvat-o perfect!",
  "Revanșă luată. Bravo, copila!",
  "Asta nu te mai păcălește. Foarte bine, pitico!",
];

const PROGRESS_MESSAGES = [
  "Ai crescut cu {difference}% față de încercarea precedentă. Bravo, copila, se vede!",
  "Uite progresul: +{difference}%. Sunt foarte mândru de tine!",
  "Pistruiato, ai urcat cu {difference}% față de data trecută. Continuă așa!",
];

const SPECIAL_REWARD_MESSAGES = [
  "Premiu deblocat: o îmbrățișare mare și dreptul să fii lăudată toată ziua.",
  "Surpriză: copilul tău este foarte mândru de tine.",
  "Ai deblocat mesajul special: ești minunată, iubita, și meriți toate felicitările.",
];

function chooseRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

function readExperienceData() {
  try {
    const storedData = localStorage.getItem(EXPERIENCE_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : {};
  } catch {
    return {};
  }
}

function writeExperienceData(data) {
  localStorage.setItem(EXPERIENCE_STORAGE_KEY, JSON.stringify(data));
}

function getDaysSinceLastVisit(lastVisit) {
  if (!lastVisit) {
    return 0;
  }

  const millisecondsPerDay = 1000 * 60 * 60 * 24;
  const difference = Date.now() - new Date(lastVisit).getTime();

  return Math.floor(difference / millisecondsPerDay);
}

export function getHomeWelcomeMessage() {
  const experienceData = readExperienceData();
  const daysSinceLastVisit = getDaysSinceLastVisit(
    experienceData.lastVisitAt
  );

  if (daysSinceLastVisit >= 3) {
    return chooseRandomMessage(RETURN_MESSAGES);
  }

  const currentHour = new Date().getHours();

  if (currentHour < 12) {
    return chooseRandomMessage(MORNING_MESSAGES);
  }

  if (currentHour < 20) {
    return chooseRandomMessage(AFTERNOON_MESSAGES);
  }

  if (currentHour < 23) {
    return chooseRandomMessage(EVENING_MESSAGES);
  }

  return chooseRandomMessage(LATE_NIGHT_MESSAGES);
}

export function saveCurrentVisit() {
  const currentData = readExperienceData();

  writeExperienceData({
    ...currentData,
    lastVisitAt: new Date().toISOString(),
  });
}

export function getQuizStartMessage() {
  return chooseRandomMessage(QUIZ_START_MESSAGES);
}

export function getSecretMessage() {
  return chooseRandomMessage(SECRET_MESSAGES);
}

export function getCorrectStreakMessage(streakCount) {
  if (streakCount > 0 && streakCount % 10 === 0) {
    return chooseRandomMessage(TEN_CORRECT_STREAK_MESSAGES);
  }

  if (streakCount > 0 && streakCount % 5 === 0) {
    return chooseRandomMessage(FIVE_CORRECT_STREAK_MESSAGES);
  }

  return "";
}

export function getRecoveredQuestionMessage() {
  return chooseRandomMessage(RECOVERED_QUESTION_MESSAGES);
}

export function getProgressMessage(difference) {
  const message = chooseRandomMessage(PROGRESS_MESSAGES);

  return message.replace("{difference}", difference);
}

export function getSpecialRewardMessage() {
  return chooseRandomMessage(SPECIAL_REWARD_MESSAGES);
}