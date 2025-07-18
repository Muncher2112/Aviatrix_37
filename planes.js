const planes = [
  {
    name: "Douglas DC-2",
    desc: "Balanced performance.",
    takeoffMod: 0,
    inflightMod: 0,
    landingMod: 0,
    fuelDice: 5,
    crashLandingMod: 0
  },
  {
    name: "Boeing 247",
    desc: "Better take-off and flight, but worse landing and crashlanding.",
    takeoffMod: 1,
    inflightMod: 1,
    landingMod: -1,
    fuelDice: 5,
    crashLandingMod: -1
  },
  {
    name: "Brewster F2A Buffalo",
    desc: "One less fuel die, but hardy and easy to land.",
    takeoffMod: 0,
    inflightMod: 1,
    landingMod:  2,
    fuelDice: 4,
    crashLandingMod: 2
  }
];

let selectedPlane = null;

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
      <p>Fuel Dice: ${plane.fuelDice}</p>
      <p>Takeoff Mod: ${plane.takeoffMod}, Landing Mod: ${plane.landingMod}</p>
    `;
    card.addEventListener('click', () => {
      selectedPlane = plane;
      modal.style.display = 'none';
      initializeGame();
    });
    container.appendChild(card);
  });

  modal.style.display = 'flex';
}

function initializeGame() {
  flightDice = selectedPlane.fuelDice;
  document.getElementById('diceLeft').textContent = flightDice;
  document.getElementById('statusMessage').textContent = `Selected Plane: ${selectedPlane.name}`;
  document.getElementById('planeName').textContent = selectedPlane.name;
  generateBiomeGrid();
}

document.addEventListener('DOMContentLoaded', showPlaneSelection);