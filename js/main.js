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
    {
      name: "Player 1",
      cardDisplay: undefined,
      scoreDisplay: undefined,
      totalScore: 0,
      roundScore: 0,
    },
    {
      name: "Player 2",
      cardDisplay: undefined,
      scoreDisplay: undefined,
      totalScore: 0,
      roundScore: 0,
    },
  ];

  let spinForm,
    guessForm,
    feedback,
    scoreboard,
    currentPlayer,
    puzzleCategory,
    puzzleText,
    chosenPuzzle,
    currentRound;

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
    players.forEach((player, playerIndex) => {
      const playerCard = document.createElement("div");
      playerCard.classList.add(
        "player-card",
        "player-card-p" + (playerIndex + 1),
        "player-card--inactive"
      );

      const playerName = document.createElement("p");
      playerName.classList.add("player-card__name");
      playerName.innerText = player.name;

      const playerScore = document.createElement("p");
      playerScore.classList.add("player-card__score");

      playerCard.appendChild(playerName);
      playerCard.appendChild(playerScore);
      scoreboard.appendChild(playerCard);

      player.cardDisplay = playerCard;
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
        guessForm.elements.guess.focus();
      }
    }, 100);
  }

  function handleGuess(event) {
    // Prevent the default form submit behavior.
    event.preventDefault();

    // Get a reference to the guess form and hide it.
    const guessForm = event.target;
    hide(guessForm);

    let guessedLetter = guessForm.elements.guess.value.toUpperCase();

    new Promise((resolve) => {
      // Determine how many times the letter occurred in the puzzle.
      const puzzleKey = chosenPuzzle.text.toUpperCase();
      const searchPattern = new RegExp(guessedLetter, "g");
      const matches = puzzleKey.match(searchPattern);
      let letterOccurrences = 0;

      if (matches != null) {
        letterOccurrences = matches.length;
      }

      if (letterOccurrences > 0) {
        // There were 1 or more occurrences of the letter in the puzzle.
        let timeout = 250;
        let reveals = [];

        // Find first occurrence of the letter in the puzzle.
        let letterIndex = puzzleKey.indexOf(guessedLetter, 0);

        // Keep processing all occurrences of the letter.
        while (letterIndex != -1) {
          // Increase timeout value to stagger the reveals.
          timeout += 750;

          // Call asyncLetterReveal to reveal this letter and save the promise
          // so we can finish up when all reveals have completed.
          reveals.push(asyncLetterReveal(guessedLetter, letterIndex, timeout));

          // Find next occurrence of the letter.
          letterIndex = puzzleKey.indexOf(guessedLetter, letterIndex + 1);
        }

        // Wait for all letter occurrences to indicate they have completed.
        Promise.all(reveals).then(() => {
          // Update players score
          currentPlayer.roundScore += letterOccurrences * currentWheelValue;
          currentPlayer.scoreDisplay.innerText = "$" + currentPlayer.roundScore;
          // Indicate that the work for checking player's guess has completed
          // with a successful guess.
          resolve(true);
        });
      } else {
        // Indicate that the work for checking player's guess has completed
        // with an unsuccessful guess.
        resolve(false);
      }
    }).then((successfulGuess) => {
      // Clear previous guess.
      guessForm.elements.guess.value = "";

      if (successfulGuess) {
        // Provide feedback that the guess was successful.
        feedback.innerText = "Correct! Nice guess.";
        // Show the guess form and focus it's input field.
        show(guessForm);
        guessForm.elements.guess.focus();
      } else {
        // Provide feedback that the guess was unsuccessful.
        feedback.innerText = "Sorry, No " + guessedLetter + "'s";
        // TODO Change player, show player options
      }
    });
  }

  function asyncLetterReveal(guessedLetter, letterOffset, timeout) {
    return new Promise((resolve) => {
      // Reveal the letter after the speicified timeout.
      setTimeout(() => {
        // Find the letter's square in the game's displayed puzzle text.
        const selector = 'span[data-letteroffset="' + letterOffset + '"]';
        const puzzleSquare = puzzleText.querySelector(selector);
        // Populate the puzzle square with the letter.
        puzzleSquare.innerText = guessedLetter;
        // Add the style to reveal the letter.
        puzzleSquare.classList.add("game-board__puzzle-letter--reveal");
        // Resolve the promise to indicate the reveal of the guessed letter is
        // complete.
        resolve();
      }, timeout);
    });
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

    puzzleCategory = document.getElementById("puzzle-category");
    puzzleText = document.getElementById("puzzle-text");

    // Get reference to guess form and wire up guess handler.
    guessForm = document.getElementById("guess-form");
    guessForm.addEventListener("submit", handleGuess);

    scoreboard = document.getElementById("scoreboard");
    feedback = document.getElementById("feedback");

    initializeWheel();
    initializePlayers();

    currentRound = 1;
  }

  function initializeRound() {
    // Choose a random puzzle for this round.
    const puzzleIndex = Math.floor(Math.random() * puzzles.length);
    chosenPuzzle = puzzles[puzzleIndex];

    // This will hold the offset for each letter in the puzzle.
    let puzzleOffset = 0;

    // Split the puzzle into words.
    const puzzleWords = chosenPuzzle.text.split(" ");

    // Process every word in the puzzle so that we build the puzzle display in
    // the DOM.
    puzzleWords.forEach((word, wordIndex) => {
      // Create a div element with appropriate class to hold the current word.
      const wordDiv = document.createElement("div");
      wordDiv.classList.add("game-board__puzzle-word");

      // Split the word into it's individual letters.
      const puzzleLetters = word.split("");

      // Process every letter creating child elements that will be added to the
      // current word's div element.
      puzzleLetters.forEach((letter) => {
        // Create a span with appropriate class as a placeholder for the current
        // letter.
        const letterSpan = document.createElement("span");
        letterSpan.classList.add("game-board__puzzle-letter");

        // Add an attribute to save the letters offset into the puzzle text.
        letterSpan.setAttribute("data-letterOffset", puzzleOffset + wordIndex);
        puzzleOffset++;

        // If the current character is not a letter of the alphabet, populate
        // the span element with the character so that special characters in the
        // puzzle are revealed from the start.
        if (!/[A-Za-z]/.test(letter)) {
          letterSpan.innerText = letter.toUpperCase();
          letterSpan.classList.add("game-board__puzzle-letter--reveal");
        }

        // Add the current letter as a child of the current word.
        wordDiv.appendChild(letterSpan);
      });

      // Add a space to all words excluding the last word.
      if (wordIndex < puzzleWords.length - 1) {
        const spaceSpan = document.createElement("span");
        spaceSpan.classList.add(
          "game-board__puzzle-letter",
          "game-board__puzzle-space"
        );
        wordDiv.appendChild(spaceSpan);
      }

      // Add the current word as a child of the puzzle text.
      puzzleText.appendChild(wordDiv);
    });

    // Display puzzle category.
    puzzleCategory.innerText = chosenPuzzle.category.toUpperCase();

    // Reset player scores for this round to zero.
    players.forEach((player) => {
      player.roundScore = 0;
      player.scoreDisplay.innerText = "$" + player.roundScore;
    });

    // Set player to start round.
    let playerIndex;

    if (currentRound === 1) {
      // For the first round, randomly cycle player index to choose player to
      // start the round.
      for (let i = 0; i < Math.random() * 10; i++) {
        playerIndex = playerChanger.next().value;
      }
    } else {
      // For all rounds after the first, just move to the next player.
      playerIndex = playerChanger.next().value;
      currentPlayer.cardDisplay.classList.replace(
        "player-card--active",
        "player-card--inactive"
      );
    }

    currentPlayer = players[playerIndex];
    currentPlayer.cardDisplay.classList.replace(
      "player-card--inactive",
      "player-card--active"
    );

    feedback.innerText =
      "Round " + currentRound + ": " + currentPlayer.name + " spin the wheel.";

    hide(guessForm);
    show(spinForm);
  }

  // Start of game
  initializeGame();

  initializeRound();
})();
