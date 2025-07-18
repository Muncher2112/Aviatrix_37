const OUTCOMES = {
  SAFE: "safe",         // No problems
  DAMAGE: "damage",     // Trigger damage loop
  DAMAGE_STOP: "damage_stop", // No movement and damage
  DOUBLE_DAMAGE : "double_damage", // Double damage rolls
  EXPLODE: "explode",   // Plane destroyed
  FAIL: "fail",         // Failed action (e.g., can't take off)
  SUCCESS: "success",   // Successful action (e.g., take off succeeded)
  LOSE_FUEL: "loseFuel" // Lose fuel event
};

const planes = [
  {
    name: "Douglas DC-2",
    desc: "A standard straight flier.",
    fuelDice : 5,
    takeOffTable: [
      { range: [1, 4], outcome: OUTCOMES.SUCCESS },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    flyLowTable: [
      { range: [1, 4], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE_STOP }
    ],
    inFlightTable: [
      { range: [1, 5], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    landingTable: [
      { range: [1, 4], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    crashLandingTable: [
      { range: [1, 1], outcome: OUTCOMES.SAFE },
      { range: [2, 4], outcome: OUTCOMES.DAMAGE },
      { range: [5, 6], outcome: OUTCOMES.DOUBLE_DAMAGE }
    ]
  },
  {
    name: "Boeing 247",
    desc: "A steady flier, but not good at landing in a pinch.",
    fuelDice : 5,
    takeOffTable: [
      { range: [1, 4], outcome: OUTCOMES.SUCCESS },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    flyLowTable: [
      { range: [1, 4], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE_STOP }
    ],
    inFlightTable: [
      { range: [1, 5], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    landingTable: [
      { range: [1, 4], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    crashLandingTable: [
      { range: [1, 1], outcome: OUTCOMES.SAFE },
      { range: [2, 4], outcome: OUTCOMES.DAMAGE },
      { range: [5, 6], outcome: OUTCOMES.DOUBLE_DAMAGE }
    ]
  },
  {
    name: "Brewster F2A Buffalo",
    desc: "A small robust plane with a smaller fuel tank.",
    fuelDice : 4,
    takeOffTable: [
      { range: [1, 4], outcome: OUTCOMES.SUCCESS },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    flyLowTable: [
      { range: [1, 4], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE_STOP }
    ],
    inFlightTable: [
      { range: [1, 5], outcome: OUTCOMES.SAFE },
      { range: [5, 6], outcome: OUTCOMES.DAMAGE }
    ],
    landingTable: [
      { range: [1, 5], outcome: OUTCOMES.SAFE },
      { range: [6, 6], outcome: OUTCOMES.DAMAGE }
    ],
    crashLandingTable: [
      { range: [1, 2], outcome: OUTCOMES.SAFE },
      { range: [3, 5], outcome: OUTCOMES.DAMAGE },
      { range: [6, 6], outcome: OUTCOMES.DOUBLE_DAMAGE }
    ]
  }
];
window.SelectedPlane = null;

function showPlaneSelection() {
  const modal = document.getElementById('planeSelection');
  const container = document.getElementById('planeOptions');
  container.innerHTML = '';

  planes.forEach((plane) => {
    const card = document.createElement('div');
    card.className = 'plane-card';
    card.innerHTML = `
      <h3>${plane.name}</h3>
      <p>${plane.desc}</p>
      <p><strong>Fuel Dice:</strong> ${plane.fuelDice}</p>
      <table class="plane-chart">
        <thead>
          <tr>
            <th>Action \\ Roll</th>
            <th>1</th>
            <th>2</th>
            <th>3</th>
            <th>4</th>
            <th>5</th>
            <th>6</th>
          </tr>
        </thead>
        <tbody>
          ${createChartRow("Takeoff", plane.takeOffTable)}
          ${createChartRow("Fly Low", plane.flyLowTable)}
          ${createChartRow("In Flight", plane.inFlightTable)}
          ${createChartRow("Landing", plane.landingTable)}
          ${createChartRow("Crash Landing", plane.crashLandingTable)}
        </tbody>
      </table>
    `;
    card.addEventListener('click', () => {
      window.SelectedPlane = plane;
      console.debug("THIS IS OUR PLANE: ", window.SelectedPlane)
      modal.style.display = 'none';
      initializeGame();
    });
    container.appendChild(card);
  });

  modal.style.display = 'flex';
}

function initializeGame() {
  flightDice = window.SelectedPlane.fuelDice;
  document.getElementById('diceLeft').textContent = flightDice;
  document.getElementById('statusMessage').textContent = `Selected Plane: ${window.SelectedPlane.name}`;
  document.getElementById('planeName').textContent = window.SelectedPlane.name;
  flightDice = window.SelectedPlane.fuelDice;
  generateBiomeGrid();
}

document.addEventListener('DOMContentLoaded', showPlaneSelection);


function selectPlane(index) {
    SelectedPlane = planes[index];
}

function getSelectedPlane() {
    return SelectedPlane;
}

window.getPlaneByName = function(name) {
  return SelectedPlane;
};

// Make sure to attach it globally:
window.getSelectedPlane = getSelectedPlane;

const OUTCOME_ICONS = {
  safe: "✅",
  damage: "⚠️",
  damage_stop: "🛑",
  double_damage: "💥",
  explode: "☠️",
  fail: "❌",
  success: "✈️",
  loseFuel: "⛽⬇️"
};

function createChartRow(label, table) {
  const outcomes = Array(6).fill("");

  table.forEach(row => {
    const [start, end] = row.range;
    for (let i = start; i <= end; i++) {
      let cellContent = OUTCOME_ICONS[row.outcome] || row.outcome;

      // Replace safe with movement number for specific rows
      if ((label === "In Flight" || label === "Fly Low") && row.outcome === OUTCOMES.SAFE) {
        cellContent = `+${i}`; // Example: Movement equals the dice roll
      }
      if ((label === "Takeoff") && row.outcome === OUTCOMES.SUCCESS) {
        cellContent = `+${i}`; // Example: Movement equals the dice roll
      }
      outcomes[i - 1] = cellContent;
    }
  });

  return `
    <tr>
      <td><strong>${label}</strong></td>
      ${outcomes.map(outcome => `<td>${outcome}</td>`).join("")}
    </tr>
  `;
}