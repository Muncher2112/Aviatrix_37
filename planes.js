const planes = {
  "Douglas DC-2": { takeoffMod: 0, inflightMod: 0, landingMod: 0, fuelDice: 5 },
  "Boeing 247": { takeoffMod: -1, inflightMod: 1, landingMod: 0, fuelDice: 4 },
  "Brewster F2A Buffalo": { takeoffMod: 1, inflightMod: 2, landingMod: -1, fuelDice: 3 }
};

let selectedPlane = planes["Douglas DC-2"];

document.getElementById('planeSelector').addEventListener('change', (e) => {
  selectedPlane = planes[e.target.value];
  flightDice = selectedPlane.fuelDice;
  document.getElementById('diceLeft').textContent = flightDice;
  document.getElementById('statusMessage').textContent = `Selected Plane: ${e.target.value}`;
});
