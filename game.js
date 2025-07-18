const grid = document.getElementById('hexGrid');
const player = document.getElementById('player');
const diceLeftLabel = document.getElementById('diceLeft');
const movesLeftLabel = document.getElementById('movesLeft');
const planeDamageLabel = document.getElementById('planeDamage');
const levelTracker = document.getElementById('levelTracker');
const timeTracker = document.getElementById('timeTracker');
const rollBtn = document.getElementById('rollBtn');
const statusMessage = document.getElementById('statusMessage');
const diceAnimation = document.getElementById('diceAnimation');
const repairBtn = document.getElementById('repairBtn');
const refuelBtn = document.getElementById('refuelBtn');
const playAgainBtn = document.getElementById('playAgainBtn');

const playerFuelDie = 5;
const rows = 6, cols = 12;

// Global vars
let hexElements = [], playerRow = rows - 1, playerCol = 0;
let flightDice = playerFuelDie, movesLeft = 0, planeDamage = 0, timeElapsed = 0;
let cityPositions = [], windPositions = [], currentLevel = 1, gameOver = false, airportIndex = 0;
let lastAirport = null;
let justTookOff = true;
let lastRoll = null;
let isRolling = false;
let plane = null
// End global vars

const skyColors = ['#87ceeb', '#80c7e7', '#79c0e3', '#72b9df'];
const airports = [
    { code: "BWI", name: "Thurgood Marshall Airport" },
    { code: "JFK", name: "John F. Kennedy International" },
    { code: "LAX", name: "Los Angeles International" },
    { code: "ORD", name: "O'Hare International" },
    { code: "ATL", name: "Hartsfield-Jackson Atlanta" },
    { code: "DFW", name: "Dallas/Fort Worth International" },
    { code: "DEN", name: "Denver International" },
    { code: "SEA", name: "Seattle-Tacoma International" },
    { code: "YYZ", name: "Toronto Pearson International" },
    { code: "LHR", name: "London Heathrow" },
    { code: "CDG", name: "Charles de Gaulle (Paris)" },
    { code: "FRA", name: "Frankfurt Airport" },
    { code: "DXB", name: "Dubai International" },
    { code: "DEL", name: "Indira Gandhi International (Delhi)" },
    { code: "HKG", name: "Hong Kong International" },
    { code: "NRT", name: "Narita International (Tokyo)" },
    { code: "SYD", name: "Sydney Kingsford Smith" },
    { code: "AKL", name: "Auckland International" },
    { code: "SCL", name: "Santiago International" },
    { code: "GRU", name: "São Paulo–Guarulhos" },
    { code: "EZE", name: "Buenos Aires Ezeiza" },
    { code: "CPT", name: "Cape Town International" }
];

function clearGrid() {
    grid.innerHTML = ''; grid.appendChild(player);
    hexElements = []; cityPositions = []; windPositions = [];
}
function getTerrainColor(type) {
    return type === 'grass' ? '#4caf50' : type === 'desert' ? '#c2b280' : '#1e3f66';
}
function randomTerrain() {
    const roll = Math.random(); return roll < 0.33 ? 'grass' : roll < 0.66 ? 'desert' : 'water';
}
function isTooClose(arr, r, c, minDist) {
    return arr.some(([cr, cc]) => Math.abs(cr - r) + Math.abs(cc - c) < minDist);
}

function rollFromTable(table, roll) {
    const entry = table.find(e => roll >= e.range[0] && roll <= e.range[1]);
    return entry ? entry.outcome : null;
}

function resolveOutcome(outcome) {
    switch (outcome) {
        case OUTCOMES.SAFE:
            showMessage("Safe!");
            break;
        case OUTCOMES.SUCCESS:
            showMessage("Success!");
            break;
        case OUTCOMES.FAIL:
            showMessage("Failed!");
            // Add any logic for failed takeoff
            break;
        case OUTCOMES.DAMAGE:
            enterDamageLoop();
            break;
        case OUTCOMES.DAMAGE_STOP:
            enterDamageLoop();
            movesLeft = 0
            break;
        case OUTCOMES.STOP:
            movesLeft = 0
            break;
        case OUTCOMES.DOUBLE_DAMAGE:
            enterDamageLoop();
            enterDamageLoop(); // Twice
            break;
    }
}

function generateBiomeGrid() {
    clearGrid();
    for (let r = 0; r < rows; r++) {
        const row = document.createElement('div'); row.className = 'hex-row';
        const rowHexes = [];
        for (let c = 0; c < cols; c++) {
            const hex = document.createElement('div'); hex.className = 'hex';
            if (r >= rows - 2) {
                const spawnChance = getCitySpawnChance();
                const isCity = (currentLevel === 1 && r === rows - 1 && c === 0) || (r === rows - 1 && Math.random() < spawnChance && !isTooClose(cityPositions, r, c, 3));
                if (isCity) {
                    hex.style.backgroundColor = 'red';
                    hex.dataset.city = 'true';
                    const airport = airports[airportIndex % airports.length];
                    const repairTime = getRandomRepairTime();
                    hex.dataset.repairTime = repairTime;
                    hex.textContent = `${airport.code}\n(${repairTime})`;
                    hex.title = `${airport.name} - Repair: ${repairTime} time units`;
                    cityPositions.push([r, c]);
                    airportIndex++;
                } else { hex.style.backgroundColor = getTerrainColor(randomTerrain()); }
            } else {
                if (Math.random() < 0.2 && !isTooClose(windPositions, r, c, 5)) {
                    hex.style.backgroundColor = '#add8e6'; hex.textContent = '↺'; hex.dataset.wind = 'true'; windPositions.push([r, c]);
                } else { hex.style.backgroundColor = skyColors[r % skyColors.length]; }
            }
            if (c === cols - 1 && !hex.dataset.city) hex.textContent = '>';
            if (lastAirport && r === playerRow && c === 0) {
                hex.style.backgroundColor = 'red';
                hex.dataset.city = 'true';
                hex.dataset.repairTime = lastAirport.repairTime;
                hex.innerHTML = `${lastAirport.code}<br>(${lastAirport.repairTime})`;
                hex.title = `${lastAirport.name} - Repair: ${lastAirport.repairTime} time units`;
                cityPositions.push([r, c]);
                lastAirport = null
            }
            row.appendChild(hex); rowHexes.push(hex);
        }
        grid.appendChild(row); hexElements.push(rowHexes);
    }
    setupHexEvents(); placePlayerAtHex(playerRow, playerCol);
}
function placePlayerAtHex(r, c) {
    const targetHex = hexElements[r][c];
    const hexRect = targetHex.getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    player.style.left = (hexRect.left - gridRect.left + hexRect.width / 2) + 'px';
    player.style.top = (hexRect.top - gridRect.top + hexRect.height / 2) + 'px';
}
function isAdjacent(r1, c1, r2, c2) {
    const evenRow = r1 % 2 === 0;
    const directions = evenRow ? [[-1, 0], [-1, 1], [0, -1], [0, 1], [1, 0], [1, 1]] : [[-1, -1], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 0]];
    return directions.some(([dr, dc]) => r1 + dr === r2 && c1 + dc === c2);
}
function checkGameOver() {
    const onCity = cityPositions.some(([r, c]) => r === playerRow && c === playerCol);
    if (flightDice === 0 && movesLeft === 0 && !onCity) {
        gameOver = true;
        statusMessage.textContent = "Game Over! You're out of fuel.";
        playAgainBtn.style.display = 'inline-block';
    }
}
function checkWinCondition() {
    if (currentLevel > 13) {
        gameOver = true;
        if (timeElapsed < 360) {
            statusMessage.textContent = "🏆 You Win! True Ending (Under 360 Time Units)";
        } else {
            statusMessage.textContent = "🏆 You Win! Bad Ending (Over 360 Time Units)";
        }
        rollBtn.style.display = 'none';
        repairBtn.style.display = 'none';
        refuelBtn.style.display = 'none';
        playAgainBtn.style.display = 'inline-block';
    }
}
function setupHexEvents() {
    hexElements.forEach((row, r) => row.forEach((hex, c) => {
        hex.addEventListener('click', async () => {
            if (gameOver) return;
            if (movesLeft > 0 && isAdjacent(playerRow, playerCol, r, c)) {
                playerRow = r; playerCol = c; placePlayerAtHex(r, c);
                movesLeft--; movesLeftLabel.textContent = movesLeft;
                statusMessage.textContent = "";
                if (hex.dataset.city === 'true') {
                    movesLeft = 0;
                    movesLeftLabel.textContent = movesLeft;
                    if (flightDice > 0) {
                        await rollForLanding();
                        lastRoll = null;
                    } else {
                        statusMessage.textContent = "⚠️ Crash Landing!";
                        await crashLandingRoll()
                        lastRoll = null;
                    }
                    diceLeftLabel.textContent = flightDice;
                    repairBtn.style.display = 'inline-block';
                    refuelBtn.style.display = 'inline-block';
                    if (c === cols - 1) {
                        lastAirport = {
                            code: hex.textContent.split("\n")[0],
                            name: hex.title.split(" - ")[0],
                            repairTime: parseInt(hex.dataset.repairTime, 10)
                        };
                    }
                } else {
                    repairBtn.style.display = 'none';
                    refuelBtn.style.display = 'none';
                }
                if (hex.dataset.wind === 'true') {
                    flightDice = Math.min(flightDice + 1, 5);
                    diceLeftLabel.textContent = flightDice;
                    movesLeft = 0;
                    movesLeftLabel.textContent = movesLeft;

                    // Show fuel gain animation
                    const fuelAnim = document.getElementById('fuelGainAnimation');
                    fuelAnim.style.display = 'block';
                    fuelAnim.style.animation = 'none';
                    fuelAnim.offsetHeight; // trigger reflow
                    fuelAnim.style.animation = 'fuelPop 1s ease-out';
                    setTimeout(() => { fuelAnim.style.display = 'none'; }, 1000);
                }
                if (playerCol === cols - 1) {
                    currentLevel++;
                    levelTracker.textContent = currentLevel;
                    if (currentLevel > 13) {
                        checkWinCondition();
                        return;
                    }
                    statusMessage.textContent = "Reached the rightmost column! Level " + currentLevel;
                    const currentRow = playerRow;
                    generateBiomeGrid();
                    playerRow = currentRow;
                    playerCol = 0;
                    placePlayerAtHex(playerRow, playerCol);
                    return;
                }
                checkGameOver();
            }
        });
    }));
    if (justTookOff) {
        statusMessage.textContent = "🛫 TAKEOFF!";
    }
}
async function rollForDamage() {
    let rolls = [];
    let escalate = true, stage = 0;
    let totalDamage = 0;
    while (escalate) {
        stage++;
        const damageRoll = Math.floor(Math.random() * 6) + 1;
        await animateDiceRoll(damageRoll);
        rolls.push(damageRoll);
        if (damageRoll <= 3) {
            if (stage > 1) totalDamage += (stage - 1);
            escalate = false;
        } else if (damageRoll <= 5) {
            totalDamage += stage;
            escalate = false;
        }
    }
    if (totalDamage > 0) {
        planeDamage += totalDamage;
        //setTimeout(() => showDamageAnimation(potentialDamage), 0);
        // Show damage gain animation
        showDamageAnimation(totalDamage)
    }
    planeDamageLabel.textContent = planeDamage;
    statusMessage.textContent = `Damage rolls: ${rolls.join(" -> ")} | ${totalDamage > 0 ? `+${totalDamage} Damage!` : "No damage."}`;
}
async function rollForLanding() {
    const landingRoll = Math.floor(Math.random() * 6) + 1;
    await animateDiceRoll(landingRoll);

    const landingResult = rollFromTable(plane.landingTable, landingRoll);
    if (landingResult) {
        statusMessage.textContent = `Landing roll: ${landingRoll}. ${landingResult}`;
        if (landingResult=== OUTCOMES.DAMAGE) {
            await landingDamageLoop();
        } else{
            statusMessage.textContent = `Landing roll: ${landingRoll}. Landed safely!`;
        }
    }
    justTookOff = true;
}

async function crashLandingRoll() {
    const roll = Math.floor(Math.random() * 6) + 1;
    await animateDiceRoll(roll);

    const crashResult = rollFromTable(plane.crashLandingTable, roll);
    if (crashResult) {
        statusMessage.textContent = `Crash landing roll: ${roll}`;
        if (crashResult === OUTCOMES.DAMAGE) {
            await landingDamageLoop();
        } else if (crashResult === OUTCOMES.DOUBLE_DAMAGE) {
            await landingDamageLoop();
            await landingDamageLoop();
        } else {
            // safe or other results
        }
    }
    justTookOff = true;
}

async function landingDamageLoop() {
    let potentialDamage = 0;
    let rolling = true;
    let messages = [];
    while (rolling) {
        const roll = Math.floor(Math.random() * 6) + 1;
        await animateDiceRoll(roll);
        messages.push(roll);
        if (roll <= 3) {
            rolling = false;
        } else if (roll === 4 || roll === 5) {
            potentialDamage += 1;
            rolling = false;
        } else if (roll === 6) {
            potentialDamage += 1;
        }
    }
    if (potentialDamage > 0) {
        planeDamage += potentialDamage;
        // Show damage gain animation
        showDamageAnimation(potentialDamage)
        planeDamageLabel.textContent = planeDamage;
        statusMessage.textContent = `Landing damage rolls: ${messages.join(" -> ")} | Damage taken: ${potentialDamage}`;
    } else {
        statusMessage.textContent = `Landing damage rolls: ${messages.join(" -> ")} | No damage!`;
    }
}
function getCitySpawnChance() {
    return Math.max(0.2, 0.4 - (currentLevel - 1) * 0.05);
}

function getRandomRepairTime() {
    const repairTimes = [4, 6, 8, 10, 16, 24];
    
    // Weight toward smaller times early on
    let bias = Math.min(currentLevel / 10, 1); 
    // 0 at level 1, gradually approaching 1 by level 10

    // Weighted index selection
    let random = Math.pow(Math.random(), 1.5 - bias);  
    // Early levels favor low values (power < 1)

    let index = Math.floor(random * repairTimes.length);
    return repairTimes[index];
}

function askPlayerChoiceModal(roll) {
    return new Promise((resolve) => {
        const modal = document.getElementById('choiceModal');
        const choiceText = document.getElementById('choiceText');
        const riskBtn = document.getElementById('riskBtn');
        const safeBtn = document.getElementById('safeBtn');
        choiceText.textContent = `You rolled a ${roll}! Do you want to move ${roll} spaces and risk damage, or move 2 safely?`;
        modal.style.display = 'flex';
        riskBtn.onclick = () => { modal.style.display = 'none'; resolve(roll); };
        safeBtn.onclick = () => { modal.style.display = 'none'; resolve(2); };
    });
}
function animateDiceRoll(finalValue) {
    return new Promise((resolve) => {
        let count = 0;
        diceAnimation.style.display = 'block';
        const interval = setInterval(() => {
            const randomFace = Math.floor(Math.random() * 6) + 1;
            diceAnimation.textContent = `🎲 ${randomFace}`;
            count++;
            if (count > 8) {
                clearInterval(interval);
                diceAnimation.textContent = `🎲 ${finalValue}`;
                setTimeout(() => { diceAnimation.style.display = 'none'; resolve(); }, 400);
            }
        }, 100);
    });
}

function showDamageAnimation(amount) {
    const fuelAnim = document.getElementById('damageAnimation');
    fuelAnim.style.display = 'block';
    fuelAnim.style.animation = 'none';
    fuelAnim.offsetHeight; // trigger reflow
    fuelAnim.style.animation = 'fuelPop 1s ease-out';
    document.getElementById("damageAnimation").textContent = `+${amount} Damage!`;
    setTimeout(() => { fuelAnim.style.display = 'none'; }, 1000);
}

function showMovementAnimation(amount) {
    const fuelAnim = document.getElementById('movementAnimation');
    fuelAnim.style.display = 'block';
    fuelAnim.style.animation = 'none';
    fuelAnim.offsetHeight; // trigger reflow
    fuelAnim.style.animation = 'fuelPop 1s ease-out';
    document.getElementById("movementAnimation").textContent = `+${amount} Movement!`;
    setTimeout(() => { fuelAnim.style.display = 'none'; }, 1000);
}

rollBtn.addEventListener('click', async () => {
    if (gameOver || isRolling) return;
    let do_normal_action = false
    if (flightDice > 0) {
        isRolling = true;
        const roll = Math.floor(Math.random() * 6) + 1;
        await animateDiceRoll(roll);
        if (plane === null){
            plane = window.SelectedPlane;
        }
        const isFlyingLow = (playerRow >= rows - 2 && !justTookOff);
        let isDouble34 = (roll === 3 && lastRoll === 3);
        if (roll === 4 && lastRoll === 4) {
            isDouble34 = true;
        }
        // Check if plane is too damaged to move
        if (roll <= planeDamage) {
            statusMessage.textContent = `Your plane is too damaged! Rolled ${roll}, but damage is ${planeDamage}. No movement!`;
            movesLeft = 0;
        }
        // Check flying low outcome
        else if (isFlyingLow) {
            const outcome = rollFromTable(plane.flyLowTable, roll);
            if (outcome === OUTCOMES.SAFE) {
                do_normal_action = true
                // Safe - movement allowed
            } else if (outcome === OUTCOMES.DAMAGE_STOP) {
                statusMessage.textContent = `⚠️ Flying Low! Rolled ${roll}, but no movement. Checking for damage...`;
                await rollForDamage();
                movesLeft = 0;
            }
        } else {
            do_normal_action = true
        }
        if (do_normal_action) {
            // Double 3 or 4 turbulence
            if (isDouble34) {
                statusMessage.textContent = `Rolled ${lastRoll} then ${roll}. In-flight turbulence! Checking for damage...`;
                await rollForDamage();
                lastRoll = null;
            }
            let moveSpaces = roll;
            // For high rolls (5 or 6), check in-flight table
            if (roll >= 5) {
                let outcome;
                if (justTookOff) {
                    outcome = rollFromTable(plane.takeOffTable, roll);
                } else {
                     outcome = rollFromTable(plane.inFlightTable, roll);
                }
                
                if (outcome === OUTCOMES.DAMAGE) {
                    moveSpaces = await askPlayerChoiceModal(roll);
                    if (moveSpaces === roll) { await rollForDamage(); }
                }
            }
            showMovementAnimation(moveSpaces);
            movesLeft = moveSpaces;
            justTookOff = false;
            lastRoll = roll;
        }
        flightDice--;
        diceLeftLabel.textContent = flightDice;
        movesLeftLabel.textContent = movesLeft;
        timeElapsed++;
        timeTracker.textContent = timeElapsed;
    }
    checkGameOver();
    isRolling = false;
});

repairBtn.addEventListener('click', async () => {
    const currentHex = hexElements[playerRow][playerCol];
    if (!currentHex.dataset.city) return;
    const repairTime = parseInt(currentHex.dataset.repairTime, 10) || 4;
    if (planeDamage > 0) {
        let multiplier = 1;
        let rolling = true;
        const repairRoll = Math.floor(Math.random() * 6) + 1;
        await animateDiceRoll(repairRoll);

        const totalCost = repairTime * repairRoll;
        planeDamage--;
        planeDamageLabel.textContent = planeDamage;
        timeElapsed += totalCost;
        timeTracker.textContent = timeElapsed;
        statusMessage.textContent = `Repair roll: ${repairRoll} | Cost: ${totalCost} time (${repairRoll} * ${repairTime}). Remaining damage: ${planeDamage}`;
    } else {
        statusMessage.textContent = "Plane is fully repaired!";
    }
});
refuelBtn.addEventListener('click', async () => {
    if (flightDice >= playerFuelDie) {
        statusMessage.textContent = "Your fuel tank is already full!";
        return;
    }
    let totalTimeCost = 0;
    let multiplier = 1;
    let rolling = true;
    let sequence = [];
    while (rolling) {
        const roll = Math.floor(Math.random() * 6) + 1;
        sequence.push(roll);
        if (roll <= 4) {
            totalTimeCost += (1 * multiplier);
            rolling = false;
        } else if (roll === 5) {
            totalTimeCost += (2 * multiplier);
            rolling = false;
        } else if (roll === 6) {
            multiplier *= 2;
        }
    }
    timeElapsed += totalTimeCost;
    timeTracker.textContent = timeElapsed;
    flightDice = playerFuelDie;
    diceLeftLabel.textContent = flightDice;
    statusMessage.textContent = `Refueled! Rolls: ${sequence.join(" -> ")} | Time cost: ${totalTimeCost}`;
});
playAgainBtn.addEventListener('click', () => {
    playerRow = rows - 1;
    playerCol = 0;
    flightDice = playerFuelDie;
    movesLeft = 0;
    planeDamage = 0;
    timeElapsed = 0;
    currentLevel = 1;
    gameOver = false;
    lastAirport = null;
    airportIndex = 0;
    justTookOff = true
    diceLeftLabel.textContent = flightDice;
    movesLeftLabel.textContent = movesLeft;
    planeDamageLabel.textContent = planeDamage;
    levelTracker.textContent = currentLevel;
    timeTracker.textContent = timeElapsed;
    statusMessage.textContent = "";
    rollBtn.style.display = 'inline-block';
    repairBtn.style.display = 'none';
    refuelBtn.style.display = 'none';
    playAgainBtn.style.display = 'none';
    showPlaneSelection()
    generateBiomeGrid();
});
generateBiomeGrid();