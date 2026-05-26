const resultMessages = [
  {
    min: 0,
    max: 10,
    messages: [
      "Hai că poți mai mult, copila. Mai luăm o dată grilele și o să fie mai bine.",
      "Nu-i nimic, copila. Acum știm de unde începem și data viitoare urcăm scorul.",
      "Primul pas e făcut. Mai repetăm puțin și sigur scoți un rezultat mai bun.",
    ],
  },
  {
    min: 10,
    max: 20,
    messages: [
      "Copila, concentrează-te puțin mai mult. Știu că poți să faci mult mai bine.",
      "Mai repetă materia o dată și încearcă din nou cu atenție.",
      "Ai nevoie de încă o tură de învățat, copila. Nu te las să renunți așa ușor.",
    ],
  },
  {
    min: 20,
    max: 30,
    messages: [
      "Știu că poți, mai repetă un pic și rezultatul o să crească.",
      "Ai început să prinzi din materie, copila. Mai ai nevoie doar de puțină repetare.",
      "Mai învață un pic, iubita. Sunt sigur că următorul test va arăta mai bine.",
    ],
  },
  {
    min: 30,
    max: 40,
    messages: [
      "Pitica, înapoi la învățat. Mai ai de recuperat, dar știu că poți.",
      "Copila, mai trecem puțin prin grile înainte de următoarea încercare.",
      "Ai prins câteva lucruri, dar încă nu te las la pauză. Înapoi la repetat, pitica.",
    ],
  },
  {
    min: 40,
    max: 50,
    messages: [
      "Am încredere că poți mai mult. Ești aproape de jumătate, hai să trecem bine peste ea.",
      "Copila, mai puțin și începe să arate bine. Repetă greșelile și mai încearcă.",
      "Ai ajuns aproape de jumătate, iubita. Știu sigur că rezultatul tău adevărat este mai sus.",
    ],
  },
  {
    min: 50,
    max: 60,
    messages: [
      "Tu nu te mulțumești cu jumătăți, așa-i? Poți mai mult de atât.",
      "Ai trecut de jumătate, copila. Acum hai să urcăm scorul cum știu că poți.",
      "E un început bun, iubita, dar eu știu că poți să ajungi mult mai sus.",
    ],
  },
  {
    min: 60,
    max: 70,
    messages: [
      "Ești bună, am încredere că poți mai mult. Mai corectăm câteva greșeli și crește scorul.",
      "Bravo, copila, începe să meargă bine. Mai repetă ce ai ratat și treci ușor de 70%.",
      "Te descurci bine, iubita. Cu puțină atenție în plus, scoți un rezultat și mai frumos.",
    ],
  },
  {
    min: 70,
    max: 80,
    messages: [
      "Bravo, copila, te descurci foarte bine. Mai ai puțin până la un rezultat excelent.",
      "Foarte bine, iubita. Ai muncit frumos, iar scorul începe să arate exact cum trebuie.",
      "Bravo, pitica. Ești pe drumul bun, mai reparăm câteva greșeli și ajungi sus.",
    ],
  },
  {
    min: 80,
    max: 90,
    messages: [
      "Felicitări, încă un pic și ajungi la 10, copila!",
      "Foarte bine, iubita! Mai sunt doar câteva detalii și ajungi la un rezultat aproape perfect.",
      "Bravo, copila mea. Te descurci minunat, mai ai foarte puțin până sus.",
    ],
  },
  {
    min: 90,
    max: 95,
    messages: [
      "Felicitări, pistruiato, aproape de perfecțiune! Mă faci mândru.",
      "Bravo, pistruiato! Ai fost foarte aproape de un test perfect și sunt mândru de tine.",
      "Extraordinar, copila. Mai lipsește foarte puțin până la perfecțiune. Mă faci mândru!",
    ],
  },
  {
    min: 95,
    max: 101,
    messages: [
      "Bravo, iubita, ești cea mai bună! Sunt foarte mândru de tine.",
      "Felicitări, copila mea! Ai fost minunată și sunt tare mândru de tine.",
      "Perfect, pistruiato! Ai reușit un rezultat minunat. Sunt mândru de tine, iubita.",
    ],
  },
];

export function getResultMessage(percentage) {
  const interval = resultMessages.find(
    (item) => percentage >= item.min && percentage < item.max
  );

  if (!interval) {
    return "";
  }

  const randomIndex = Math.floor(Math.random() * interval.messages.length);

  return interval.messages[randomIndex];
}