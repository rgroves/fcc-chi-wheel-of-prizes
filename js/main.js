(function () {
  const VOWEL_COST = 250;
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

  let guessedLettersMap = {};
  let lastWheelPosition = { value: 0 };
  let currentWheelValue;
  let guessPeriodTimeout;

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

  let mainOptions,
    spinForm,
    vowelForm,
    solveForm,
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
    disableMainOptions();

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

        let wheelValue = wheelAmounts[index].value;

        switch (wheelValue) {
          case SPECIAL_WHEEL_VALUES.BANKRUPT:
            currentWheelValue = 0;
            currentPlayer.roundScore = 0;
            currentPlayer.scoreDisplay.innerText =
              "$" + currentPlayer.roundScore;
            switchPlayer();
            enableMainOptions();
            break;

          case SPECIAL_WHEEL_VALUES.LOSE_A_TURN:
            currentWheelValue = 0;
            switchPlayer();
            enableMainOptions();
            break;

          default:
            currentWheelValue = wheelAmounts[index].value;
            hideMainOptions();
            showGuessForm();
            guessPeriodTimeout = setTimeout(timeExpiredHandler, 5000);
            break;
        }
      }
    }, 100);
  }

  function timeExpiredHandler() {
    // hide the guess form
    hideGuessForm();

    // Provide feedback that the guess was unsuccessful.
    feedback.innerText =
      "Sorry, " + currentPlayer.name + " you'll have to be faster next time.";

    // Switch player and show main options.
    switchPlayer();
    showMainOptions();
  }

  function handleGuess(event) {
    // Prevent the default form submit behavior.
    event.preventDefault();

    // clear the guess period timeout
    clearTimeout(guessPeriodTimeout);

    hideGuessForm();

    let guessedLetter = guessForm.elements.guess.value.toUpperCase();

    if (guessedLettersMap[guessedLetter] === guessedLetter) {
      // Clear previous guess.
      guessForm.elements.guess.value = "";
      switchPlayer();

      // Provide feedback that the guess was unsuccessful.
      feedback.innerText =
        "Sorry, " + guessedLetter + " has already been guessed.";

      showMainOptions();
      return;
    }

    // Add this letter to the guessed letters map.
    guessedLettersMap[guessedLetter] = guessedLetter;

    asyncCheckForLetterInPuzzle(guessedLetter).then((letterOccurrences) => {
      // Clear previous guess.
      guessForm.elements.guess.value = "";

      if (letterOccurrences > 0) {
        // Update player's score
        currentPlayer.roundScore += letterOccurrences * currentWheelValue;
        currentPlayer.scoreDisplay.innerText = "$" + currentPlayer.roundScore;

        // Provide feedback that the guess was successful.
        feedback.innerText = "Correct! Nice guess.";
        showMainOptions();
      } else {
        // Provide feedback that the guess was unsuccessful.
        feedback.innerText = "Sorry, there is no " + guessedLetter + ".";
        switchPlayer();
        showMainOptions();
      }
    });
  }

  function asyncCheckForLetterInPuzzle(letter) {
    letter = letter.toUpperCase();

    return new Promise((resolve) => {
      // Determine how many times the letter occurred in the puzzle.
      const puzzleKey = chosenPuzzle.text.toUpperCase();
      const searchPattern = new RegExp(letter, "g");
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
        let letterIndex = puzzleKey.indexOf(letter, 0);

        // Keep processing all occurrences of the letter.
        while (letterIndex != -1) {
          // Increase timeout value to stagger the reveals.
          timeout += 750;

          // Call asyncLetterReveal to reveal this letter and save the promise
          // so we can finish up when all reveals have completed.
          reveals.push(asyncLetterReveal(letter, letterIndex, timeout));

          // Find next occurrence of the letter.
          letterIndex = puzzleKey.indexOf(letter, letterIndex + 1);
        }

        // Wait for all letter occurrences to indicate they have completed.
        Promise.all(reveals);
      }

      // Indicate that the work for checking player's guess has completed
      // and return the number of occurrences.
      resolve(letterOccurrences);
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

  // Buy vowel handler.
  function handleBuyVowel(event) {
    event.preventDefault();
    disableMainOptions();

    let guessedLetter = event.target.elements["buy-vowel"].value.toUpperCase();

    asyncCheckForLetterInPuzzle(guessedLetter).then((letterOccurrences) => {
      // Clear previous vowel guess.
      event.target.elements["buy-vowel"].value = "";

      if (letterOccurrences > 0) {
        // Update player's score
        currentPlayer.roundScore -= VOWEL_COST;
        currentPlayer.scoreDisplay.innerText = "$" + currentPlayer.roundScore;

        // Provide feedback that the guess was successful.
        feedback.innerText = "Correct! Nice guess.";
        showMainOptions();
      } else {
        // Provide feedback that the guess was unsuccessful.
        feedback.innerText = "Sorry, there is no " + guessedLetter + ".";
        switchPlayer();
        showMainOptions();
      }
    });
  }

  function handleSolve(event) {
    event.preventDefault();
    disableMainOptions();

    // This function checks if the player's solve attempt is correct or not.
    function checkSolve() {
      // Remove the solving keystroke listener.
      window.removeEventListener("keyup", solvingKeystrokeHandler);

      // Generate a puzzle key to tests the players solve attempt against.
      const puzzleKey = chosenPuzzle.text.toUpperCase().replace(/ /g, "");

      // Grab all of the letters from the solved puzzle that make up the solve
      // attempt.
      const solveAttempt = Array.from(puzzleLetters)
        .map((letter) => letter.innerText)
        .join("")
        .toUpperCase();

      // Check solve attempt against the puzzle key.
      if (solveAttempt === puzzleKey) {
        // The player's solve attempet was correct.
        // Provide feedback that the player's solve attempt was correct.
        feedback.innerText = "Correct!";

        // TODO: NEW ROUND
      } else {
        // The player's solve attempet was incorrect.
        // Reset the puzzle to it's initial state.
        solvableLetters.forEach((letter) => {
          // Remove solve classes.
          letter.classList.remove(
            "game-board__puzzle-letter--solveable",
            "game-board__puzzle-letter--solving"
          );

          // Remove guessed letters.
          letter.innerText = "";
        });

        // Provide feedback that the solve is incorrect.
        feedback.innerText =
          "Sorry, " + currentPlayer.name + ", that is not correct.";

        // Switch players and enable main options
        switchPlayer();
        enableMainOptions();
      }
    }

    // This is an keyup event handler for capturing the player's solve
    // keystrokes.
    function solvingKeystrokeHandler(event) {
      const typedLetter = event.key.toUpperCase();

      switch (typedLetter) {
        case "ENTER":
          // Enter was pressed, check the solve attempt for correctness.
          checkSolve();
          break;

        case "BACKSPACE":
        case "DELETE":
          // Allow player to go back and make a correction in their solve
          // attempt.
          if (
            currentSolveIndex != 0 &&
            currentSolveIndex != solvableLetters.length
          ) {
            // Remove the current solving indicator from current
            // letter.
            solvableLetters[currentSolveIndex].classList.remove(
              "game-board__puzzle-letter--solving"
            );
          }

          if (currentSolveIndex != 0) {
            // Back up one (unsolved) letter and add the solving indicator.
            currentSolveIndex--;
            solvableLetters[currentSolveIndex].innerText = "";
            solvableLetters[currentSolveIndex].classList.add(
              "game-board__puzzle-letter--solving"
            );
          }
          break;

        default:
          // If anything other than letters were pressed, ignore it.
          if (!typedLetter.match(/^[A-Z]$/)) {
            return;
          }

          if (currentSolveIndex < solvableLetters.length) {
            // Add the typed letter to the puzzle and remove the solving
            // indicator from this letter space.
            solvableLetters[currentSolveIndex].innerText = typedLetter;
            solvableLetters[currentSolveIndex].classList.remove(
              "game-board__puzzle-letter--solving"
            );

            // Move solving indicator to the next (unsolved) letter space.
            currentSolveIndex++;

            if (currentSolveIndex < solvableLetters.length) {
              solvableLetters[currentSolveIndex].classList.add(
                "game-board__puzzle-letter--solving"
              );
            }
          }
          break;
      }
    }

    // Get all letters in puzzle that have not been revealed/need to be solved.
    const puzzleLetters = puzzleText.querySelectorAll("span");
    const solvableLetters = Array.from(puzzleLetters).filter(
      (letter) =>
        !letter.classList.contains("game-board__puzzle-letter--reveal") &&
        !letter.classList.contains("game-board__puzzle-space")
    );

    // Set the index of the first letter that needs solving and add the solving indicator.
    let currentSolveIndex = 0;
    solvableLetters[currentSolveIndex].classList.add(
      "game-board__puzzle-letter--solving"
    );

    // Set all of the unsolved letters to "solveable".
    solvableLetters.forEach((letter) => {
      letter.classList.add("game-board__puzzle-letter--solveable");
    });

    // Add the keystroke listener.
    window.addEventListener("keyup", solvingKeystrokeHandler);
  }

  // Disable the controls within the main options.
  function disableMainOptions() {
    mainOptions
      .querySelectorAll("form button, form input")
      .forEach((control) => (control.disabled = true));
  }

  // Enable the controls within the main options.
  function enableMainOptions() {
    mainOptions
      .querySelectorAll("form button, form input")
      .forEach((control) => {
        if (
          control.getAttribute("name").startsWith("buy") &&
          currentPlayer.roundScore < 250
        ) {
          // Only enable "Buy Vowel" if current player has enough money.
          control.disabled = true;
        } else {
          // Enable all other controls unconditionally.
          control.disabled = false;
        }
      });
  }

  // Hide the main options.
  function hideMainOptions() {
    hide(mainOptions);
  }

  // Show the main options.
  function showMainOptions() {
    enableMainOptions();
    show(mainOptions);
  }

  // Hide the guess form.
  function hideGuessForm() {
    hide(guessForm);
  }

  // Show the guess form.
  function showGuessForm() {
    show(guessForm);
    guessForm.elements.guess.focus();
  }

  function show(element) {
    element.classList.remove("hide");
  }

  function hide(element) {
    element.classList.add("hide");
  }

  function randomizeCurrentPlayer() {
    let playerIndex;

    if (currentPlayer) {
      currentPlayer.cardDisplay.classList.replace(
        "player-card--active",
        "player-card--inactive"
      );
    }

    // Randomly cycle player index to choose a player.
    for (let i = 0; i < Math.random() * 2; i++) {
      playerIndex = playerChanger.next().value;
    }

    currentPlayer = players[playerIndex];

    currentPlayer.cardDisplay.classList.replace(
      "player-card--inactive",
      "player-card--active"
    );
  }

  function switchPlayer() {
    playerIndex = playerChanger.next().value;

    currentPlayer.cardDisplay.classList.replace(
      "player-card--active",
      "player-card--inactive"
    );

    currentPlayer = players[playerIndex];

    currentPlayer.cardDisplay.classList.replace(
      "player-card--inactive",
      "player-card--active"
    );
  }

  // The initializeGame function performs all of the initializations that should
  // happen before the start of a new game.
  function initializeGame() {
    // Get reference to main options panel.
    mainOptions = document.getElementById("main-options");

    // Get reference to spin form and wire up wheel spin handler.
    spinForm = document.getElementById("spin-form");
    spinForm.addEventListener("submit", handleSpin);

    // Get reference to buy vowel form and wire up buy handler.
    vowelForm = document.getElementById("vowel-form");
    vowelForm.addEventListener("submit", handleBuyVowel);

    // Get reference to buy solve form and wire up solve handler.
    solveForm = document.getElementById("solve-form");
    solveForm.addEventListener("submit", handleSolve);

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

      // Reset the guessed letters map.
      guessedLettersMap = {};
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
      // For the first round, randomly choose a player to start the round.
      randomizeCurrentPlayer();
    } else {
      // For all rounds after the first, just move to the next player.
      switchPlayer();
    }

    feedback.innerText =
      "Round " + currentRound + ": " + currentPlayer.name + " spin the wheel.";

    hideGuessForm();
    showMainOptions();
  }

  // Start of game
  initializeGame();

  initializeRound();
})();
