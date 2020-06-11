(function () {
  const SPECIAL_WHEEL_VALUES = {
    LOSE_A_TURN: -1,
    BANKRUPT: -2,
  };

  Object.freeze(SPECIAL_WHEEL_VALUES);

  const wheelAmounts = [
    { label: "$600", value: 600 },
    { label: "$650", value: 650 },
    { label: "$500", value: 500 },
    { label: "$650", value: 650 },
    { label: "$700", value: 700 },
    { label: "LOSE A TURN", value: SPECIAL_WHEEL_VALUES.LOSE_A_TURN },
    { label: "$500", value: 500 },
    { label: "$650", value: 650 },
    { label: "$600", value: 600 },
    { label: "$700", value: 700 },
    { label: "BANKRUPT", value: SPECIAL_WHEEL_VALUES.BANKRUPT },
    { label: "$900", value: 900 },
    { label: "$500", value: 500 },
    { label: "$700", value: 700 },
    { label: "$500", value: 500 },
    { label: "$700", value: 700 },
    { label: "$600", value: 600 },
    { label: "$650", value: 650 },
    { label: "$800", value: 800 },
    { label: "BANKRUPT", value: SPECIAL_WHEEL_VALUES.BANKRUPT },
    { label: "$2500", value: 2500 },
    { label: "$500", value: 500 },
    { label: "$600", value: 600 },
    { label: "$550", value: 550 },
  ];

  let lastWheelPosition = { value: 0 };
  let currentWheelValue;

  const players = [
    { name: "Player 1", scoreDisplay: undefined, totalScore: 0, roundScore: 0 },
    { name: "Player 2", scoreDisplay: undefined, totalScore: 0, roundScore: 0 },
  ];

  let spinForm, guessForm, scoreboard, currentPlayer;
  let playerChanger = changePlayer();

  function centerToWidth(label, width) {
    const padChar = "&nbsp;";

    const padTotal = width - label.length;
    const padSize = Math.round(padTotal / 2);
    const paddedLabel =
      padChar.repeat(padSize) +
      label +
      padChar.repeat(padSize - (padTotal % 2));
    return paddedLabel;
  }

  function initializeWheel() {
    const maxLabelLength = wheelAmounts.reduce((acc, cur) => {
      return cur.label.length > acc ? cur.label.length : acc;
    }, 0);

    wheelAmounts.forEach((wedge) => {
      wedge.label = centerToWidth(wedge.label, maxLabelLength).replace(
        / /g,
        "&nbsp;"
      );
    });
  }

  function* changePlayer() {
    let index = -1;
    while (true) {
      index++;
      yield index % players.length;
    }
  }

  function initializePlayers() {
    players.forEach((player) => {
      const playerCard = document.createElement("div");
      playerCard.classList.add("player-card");

      const playerName = document.createElement("p");
      playerName.classList.add("player-card__name");
      playerName.innerText = player.name;

      const playerScore = document.createElement("p");
      playerScore.classList.add("player-card__score");

      playerCard.appendChild(playerName);
      playerCard.appendChild(playerScore);
      scoreboard.appendChild(playerCard);

      player.scoreDisplay = playerScore;
      player.totalScore = 0;
    });
  }

  function* wheelSpinner(start, tics) {
    for (let i = 0; i < tics; i++) {
      yield (start + i) % wheelAmounts.length;
    }

    return (start + tics - 1) % wheelAmounts.length;
  }

  function handleSpin(event) {
    event.preventDefault();
    const button = event.target.querySelector("button");
    button.disabled = true;

    const tics =
      Math.floor(Math.random() * wheelAmounts.length) + wheelAmounts.length;
    const spinner = wheelSpinner(lastWheelPosition.value + 1, tics);

    const spinInterval = setInterval(() => {
      const feedback = document.getElementById("feedback");
      lastWheelPosition = spinner.next();
      const index = lastWheelPosition.value;
      const indexBefore =
        (index + wheelAmounts.length - 1) % wheelAmounts.length;
      const indexAfter =
        (index + wheelAmounts.length + 1) % wheelAmounts.length;

      feedback.innerHTML =
        wheelAmounts[indexBefore].label +
        "|>&nbsp;" +
        wheelAmounts[index].label +
        "&nbsp;<|" +
        wheelAmounts[indexAfter].label;

      if (lastWheelPosition.done) {
        clearInterval(spinInterval);
        currentWheelValue = wheelAmounts[index].value;
        hide(event.target);
        button.disabled = false;
        show(guessForm);
      }
    }, 100);
  }

  function show(element) {
    element.classList.remove("hide");
  }

  function hide(element) {
    element.classList.add("hide");
  }

  // The initializeGame function performs all of the initializations that should
  // happen before the start of a new game.
  function initializeGame() {
    // Get reference to spin form and wire up wheel spin handler.
    spinForm = document.getElementById("spin-form");
    spinForm.addEventListener("submit", handleSpin);

    guessForm = document.getElementById("guess-form");
    scoreboard = document.getElementById("scoreboard");

    initializeWheel();
    initializePlayers();

    let playerIndex = playerChanger.next().value;
    currentPlayer = players[playerIndex];

    hide(guessForm);
    show(spinForm);
  }

  // Start of game
  initializeGame();
})();
