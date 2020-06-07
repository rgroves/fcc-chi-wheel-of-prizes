(function () {
  const wheelAmounts = [
    700,
    1000000,
    600,
    550,
    800,
    600,
    "BANKRUPT",
    1000,
    650,
    900,
    3500,
    "LOSE A TURN",
  ];

  let lastWheelPosition = { value: 0 };

  function* wheelSpinner(start, tics) {
    for (let i = 0; i < tics; i++) {
      yield (start + i) % wheelAmounts.length;
    }

    return (start + tics - 1) % wheelAmounts.length;
  }

  function handleSpin(event) {
    event.preventDefault();
    const tics = Math.floor(Math.random() * 10) + 10;
    const spinner = wheelSpinner(lastWheelPosition.value + 1, tics);

    const spinInterval = setInterval(() => {
      const feedback = document.getElementById("feedback");
      lastWheelPosition = spinner.next();
      const index = lastWheelPosition.value;
      const indexBefore =
        (index + wheelAmounts.length - 1) % wheelAmounts.length;
      const indexAfter =
        (index + wheelAmounts.length + 1) % wheelAmounts.length;

      feedback.innerText =
        wheelAmounts[indexBefore] +
        " |> " +
        wheelAmounts[index] +
        " <| " +
        wheelAmounts[indexAfter];

      if (lastWheelPosition.done) {
        clearInterval(spinInterval);
      }
    }, 250);
  }

  let spinForm = document.getElementById("spin-form");
  spinForm.addEventListener("submit", handleSpin);
})();
