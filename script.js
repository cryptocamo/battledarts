// Game state
let gameState = {
    mode: "", // "1v1", "2v2", "3v3", or "1v1v1"
    teamSize: 0,
    numTeams: 2,
    team1: { ships: [], setupDone: false },
    team2: { ships: [], setupDone: false },
    team3: { ships: [], setupDone: false },
    currentTeam: 1,
    throwsThisTurn: 0,
    allThrows: []
};

// Show image for 2 seconds
function showImage(imageId) {
    const image = document.getElementById(imageId);
    if (image) {
        image.style.display = "block";
        setTimeout(() => {
            image.style.display = "none";
        }, 2000);
    } else {
        console.error(`Image with ID '${imageId}' not found!`);
    }
}

// Prevent accidental refresh
window.onbeforeunload = function() {
    console.log("Refresh warning triggered");
    return "Are you sure you want to leave? Your game progress will be lost.";
};

// Start setup phase
function startSetup() {
    const teamSizeSelect = document.getElementById("team-size");
    if (!teamSizeSelect) {
        console.error("Element with id 'team-size' not found!");
        return;
    }
    const mode = teamSizeSelect.value;
    if (!mode) {
        console.error("No game mode selected!");
        alert("Please select a game mode!");
        return;
    }
    gameState.mode = mode;
    gameState.teamSize = mode === "1v1v1" ? 1 : parseInt(mode);
    gameState.numTeams = mode === "1v1v1" ? 3 : 2;
    gameState.currentTeam = 1;

    const teamSizeSection = document.getElementById("team-size-selection");
    const setupPhase = document.getElementById("setup-phase");

    if (!teamSizeSection || !setupPhase) {
        console.error("Required elements for setup phase not found!");
        return;
    }

    teamSizeSection.style.display = "none";
    setupPhase.style.display = "block";
    document.getElementById("team3-status").style.display = mode === "1v1v1" ? "block" : "none";
    updateSetupDisplay();
}

// Add a ship during setup
function addShip() {
    const team = gameState.currentTeam;
    const numberInput = document.getElementById("ship-number").value;
    const lives = document.getElementById("ship-lives").value;
    const teamData = team === 1 ? gameState.team1 : team === 2 ? gameState.team2 : gameState.team3;
    const maxShips = gameState.teamSize === 1 || gameState.mode === "1v1v1" ? 3 : gameState.teamSize === 2 ? 4 : 6;

    if (teamData.ships.length >= maxShips) {
        alert(`Maximum of ${maxShips} ships reached for Team ${team}!`);
        return;
    }

    let number;
    if (!numberInput) {
        alert("Please select a ship number!");
        return;
    } else if (numberInput === "B") {
        number = "B";
    } else {
        number = parseInt(numberInput);
        if (isNaN(number) || number < 1 || number > 20) {
            alert("Invalid number selected!");
            return;
        }
    }

    if (!lives) {
        alert("Please select the number of lives!");
        return;
    }

    const livesNum = parseInt(lives);
    if (isNaN(livesNum) || livesNum < 1 || livesNum > 9) {
        alert("Invalid lives selected! Must be between 1 and 9.");
        return;
    }

    if (teamData.ships.some(ship => ship.number === number)) {
        alert("No duplicate numbers allowed!");
        return;
    }

    teamData.ships.push({ number, lives: livesNum, originalLives: livesNum });
    updateShipList(team);
    document.getElementById("ship-number").selectedIndex = 0;
    document.getElementById("ship-lives").selectedIndex = 0;
}

// Display ships in setup phase
function updateShipList(team) {
    const shipList = document.getElementById("ship-list");
    const teamData = team === 1 ? gameState.team1 : team === 2 ? gameState.team2 : gameState.team3;
    shipList.innerHTML = `Team ${team} Ships:<br>` + 
        teamData.ships.map(ship => 
            `Number ${ship.number === "B" ? "Bullseye" : ship.number}: ${ship.lives} lives`
        ).join("<br>");
}

// Update setup display with team colors
function updateSetupDisplay() {
    const currentTeamSetup = document.getElementById("current-team-setup");
    if (currentTeamSetup) {
        currentTeamSetup.textContent = `Team ${gameState.currentTeam}`;
        currentTeamSetup.style.setProperty("color", 
            gameState.currentTeam === 1 ? "#FFD700" : 
            gameState.currentTeam === 2 ? "#00CED1" : "#FF4500", "important"); // Gold, Turquoise, Orange-Red
    } else {
        console.error("Element with id 'current-team-setup' not found!");
    }
}

// Finish setup for a team
function finishSetup() {
    const team = gameState.currentTeam;
    const teamData = team === 1 ? gameState.team1 : team === 2 ? gameState.team2 : gameState.team3;
    const requiredShips = gameState.teamSize === 1 || gameState.mode === "1v1v1" ? 3 : gameState.teamSize === 2 ? 4 : 6;

    if (teamData.ships.length < requiredShips) {
        alert(`Add ${requiredShips - teamData.ships.length} more ships! (${requiredShips} required)`);
        return;
    }

    teamData.setupDone = true;
    document.getElementById("ship-list").innerHTML = "";
    alert(`Team ${team} setup complete!`);

    if (team < gameState.numTeams) {
        gameState.currentTeam++;
        updateSetupDisplay();
    } else {
        document.getElementById("setup-phase").style.display = "none";
        document.getElementById("setup-transition").style.display = "block";
    }
}

// Start gameplay
function startGameplay() {
    gameState.currentTeam = 1;
    document.getElementById("setup-transition").style.display = "none";
    document.getElementById("game-phase").style.display = "block";
    updateGameDisplay();
}

// Check if a team is eliminated
function isTeamEliminated(team) {
    const teamData = team === 1 ? gameState.team1 : team === 2 ? gameState.team2 : gameState.team3;
    return teamData.ships.every(ship => ship.lives === 0);
}

// Get next active team
function getNextActiveTeam() {
    let nextTeam = gameState.currentTeam;
    let attempts = 0;
    do {
        nextTeam = nextTeam % gameState.numTeams + 1;
        attempts++;
    } while (isTeamEliminated(nextTeam) && attempts <= gameState.numTeams);
    return attempts > gameState.numTeams ? null : nextTeam; // All teams eliminated
}

// Submit a throw during gameplay
function submitThrow() {
    const throwInput = document.getElementById("throw-number").value;
    const multiplier = parseInt(document.getElementById("throw-multiplier").value);
    let number;
    if (!throwInput) {
        alert("Please select a throw number!");
        return;
    } else if (throwInput === "B") {
        number = "B";
    } else {
        number = parseInt(throwInput);
        if (isNaN(number) || number < 1 || number > 20) {
            alert("Invalid number selected!");
            return;
        }
    }

    const attackingTeam = gameState.currentTeam;
    let results = []; // Track results for all teams
    
    // Check all opposing teams
    for (let t = 1; t <= gameState.numTeams; t++) {
        if (t === attackingTeam) continue;
        const defendingTeam = t === 1 ? gameState.team1 : t === 2 ? gameState.team2 : gameState.team3;
        let teamResult = "Miss!";
        for (let ship of defendingTeam.ships) {
            if (ship.number === number) {
                if (ship.lives > 0) {
                    ship.lives -= multiplier;
                    if (ship.lives < 0) ship.lives = 0;
                    teamResult = ship.lives === 0 ? "Sunk!" : "Hit!";
                } else {
                    teamResult = "Already Sunk!";
                }
                // Don’t break here—check all ships on this number
            }
        }
        if (teamResult !== "Miss!") {
            results.push({ team: t, result: teamResult });
            gameState.allThrows.push({ team: attackingTeam, number, result: teamResult, multiplier, targetTeam: t });
        }
    }

    gameState.throwsThisTurn++;
    updateGameDisplay();
    document.getElementById("throw-number").selectedIndex = 0;
    document.getElementById("throw-multiplier").selectedIndex = 0;

    // Show image based on highest impact result
    if (results.some(r => r.result === "Sunk!")) {
        showImage("sink-image");
    } else if (results.some(r => r.result === "Hit!")) {
        showImage("hit-image");
    } else {
        showImage("miss-image");
    }

    // Count active teams
    const activeTeams = [gameState.team1, gameState.team2, gameState.team3]
        .slice(0, gameState.numTeams)
        .filter(team => !team.ships.every(ship => ship.lives === 0)).length;

    if (gameState.throwsThisTurn === 3) {
        const nextTeam = getNextActiveTeam();
        setTimeout(() => {
            document.getElementById("game-phase").style.display = "none";
            document.getElementById("turn-transition").style.display = "block";
            document.getElementById("last-team").textContent = attackingTeam;
            document.getElementById("next-team").textContent = nextTeam || "N/A";
        }, 2000);
    }

    if (activeTeams <= 1) {
        showImage("win-image");
        setTimeout(() => {
            const winner = [gameState.team1, gameState.team2, gameState.team3]
                .findIndex(team => !team.ships.every(ship => ship.lives === 0)) + 1;
            alert(`Team ${winner} wins!`);
            document.getElementById("game-phase").innerHTML = `<h2>Team ${winner} Wins!</h2>`;
            document.getElementById("turn-transition").style.display = "none";
        }, 2000);
    }
}

// Start the next team's turn
function startNextTurn() {
    gameState.currentTeam = getNextActiveTeam();
    gameState.throwsThisTurn = 0;
    document.getElementById("turn-transition").style.display = "none";
    document.getElementById("game-phase").style.display = "block";
    updateGameDisplay();
}

// Update game display with team colors
function updateGameDisplay() {
    const currentTeamSpan = document.getElementById("current-team");
    if (currentTeamSpan) {
        currentTeamSpan.textContent = `Team ${gameState.currentTeam}`;
        currentTeamSpan.style.setProperty("color", 
            gameState.currentTeam === 1 ? "#FFD700" : 
            gameState.currentTeam === 2 ? "#00CED1" : "#FF4500", "important");
    } else {
        console.error("Element with id 'current-team' not found!");
    }

    const team1Ships = document.getElementById("team1-ships");
    const team2Ships = document.getElementById("team2-ships");
    const team3Ships = document.getElementById("team3-ships");

    if (gameState.currentTeam === 1) {
        team1Ships.innerHTML = gameState.team1.ships
            .map(ship => `Number ${ship.number === "B" ? "Bullseye" : ship.number}: ${ship.lives}/${ship.originalLives} lives`)
            .join("<br>");
        team2Ships.innerHTML = "Hidden";
        if (gameState.numTeams === 3) team3Ships.innerHTML = "Hidden";
    } else if (gameState.currentTeam === 2) {
        team1Ships.innerHTML = "Hidden";
        team2Ships.innerHTML = gameState.team2.ships
            .map(ship => `Number ${ship.number === "B" ? "Bullseye" : ship.number}: ${ship.lives}/${ship.originalLives} lives`)
            .join("<br>");
        if (gameState.numTeams === 3) team3Ships.innerHTML = "Hidden";
    } else if (gameState.currentTeam === 3) {
        team1Ships.innerHTML = "Hidden";
        team2Ships.innerHTML = "Hidden";
        team3Ships.innerHTML = gameState.team3.ships
            .map(ship => `Number ${ship.number === "B" ? "Bullseye" : ship.number}: ${ship.lives}/${ship.originalLives} lives`)
            .join("<br>");
    }

    const teamThrows = gameState.allThrows.filter(t => t.team === gameState.currentTeam);
    const hits = teamThrows
        .filter(t => t.result === "Hit!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number} (${t.multiplier}x): Hit! (Team ${t.targetTeam})`)
        .join("<br>");
    const misses = teamThrows
        .filter(t => t.result === "Miss!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number}`)
        .join("<br>");
    const sunk = teamThrows
        .filter(t => t.result === "Sunk!" || t.result === "Already Sunk!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number}: ${t.result} (Team ${t.targetTeam})`)
        .join("<br>");

    document.getElementById("hits-list").innerHTML = hits || "No hits yet.";
    document.getElementById("misses-list").innerHTML = misses || "No misses yet.";
    document.getElementById("sunk-list").innerHTML = sunk || "No ships sunk yet.";
}
