// Game state
let gameState = {
    teamSize: 0,
    team1: { ships: [], setupDone: false },
    team2: { ships: [], setupDone: false },
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
    console.log("Refresh warning triggered"); // Debug on mobile
    return "Are you sure you want to leave? Your game progress will be lost.";
};

// Start setup phase
function startSetup() {
    const teamSizeSelect = document.getElementById("team-size");
    if (!teamSizeSelect) {
        console.error("Element with id 'team-size' not found!");
        return;
    }
    const teamSizeValue = teamSizeSelect.value;
    if (!teamSizeValue) {
        console.error("No team size selected!");
        alert("Please select a team size!");
        return;
    }
    gameState.teamSize = parseInt(teamSizeValue);
    gameState.currentTeam = 1;

    const teamSizeSection = document.getElementById("team-size-selection");
    const setupPhase = document.getElementById("setup-phase");

    if (!teamSizeSection || !setupPhase) {
        console.error("Required elements for setup phase not found!");
        return;
    }

    teamSizeSection.style.display = "none";
    setupPhase.style.display = "block";
    updateSetupDisplay();
}

// Add a ship during setup
function addShip() {
    const team = gameState.currentTeam;
    const numberInput = document.getElementById("ship-number").value;
    const lives = document.getElementById("ship-lives").value;
    const teamData = team === 1 ? gameState.team1 : gameState.team2;
    const maxShips = gameState.teamSize === 1 ? 3 : gameState.teamSize === 2 ? 4 : 6;

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
    const teamData = team === 1 ? gameState.team1 : gameState.team2;
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
        currentTeamSetup.style.setProperty("color", gameState.currentTeam === 1 ? "#FFD700" : "#00CED1", "important");
    } else {
        console.error("Element with id 'current-team-setup' not found!");
    }
}

// Finish setup for a team
function finishSetup() {
    const team = gameState.currentTeam;
    const teamData = team === 1 ? gameState.team1 : gameState.team2;
    const requiredShips = gameState.teamSize === 1 ? 3 : gameState.teamSize === 2 ? 4 : 6;

    if (teamData.ships.length < requiredShips) {
        alert(`Add ${requiredShips - teamData.ships.length} more ships! (${requiredShips} required)`);
        return;
    }

    teamData.setupDone = true;
    document.getElementById("ship-list").innerHTML = "";
    alert(`Team ${team} setup complete!`);

    if (team === 1) {
        gameState.currentTeam = 2;
        updateSetupDisplay();
    } else if (team === 2) {
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
    const defendingTeam = attackingTeam === 1 ? gameState.team2 : gameState.team1;
    let result = "Miss!";
    
    for (let ship of defendingTeam.ships) {
        if (ship.number === number) {
            if (ship.lives > 0) {
                ship.lives -= multiplier;
                if (ship.lives < 0) ship.lives = 0;
                result = ship.lives === 0 ? "Sunk!" : "Hit!";
            } else {
                result = "Already Sunk!";
            }
            break;
        }
    }

    gameState.allThrows.push({ team: attackingTeam, number, result, multiplier });
    gameState.throwsThisTurn++;
    updateGameDisplay();
    document.getElementById("throw-number").selectedIndex = 0;
    document.getElementById("throw-multiplier").selectedIndex = 0;

    if (result === "Sunk!") {
        showImage("sink-image");
    } else if (result === "Hit!") {
        showImage("hit-image");
    } else if (result === "Miss!" || result === "Already Sunk!") {
        showImage("miss-image");
    }

    if (gameState.throwsThisTurn === 3) {
        setTimeout(() => {
            document.getElementById("game-phase").style.display = "none";
            document.getElementById("turn-transition").style.display = "block";
            document.getElementById("last-team").textContent = attackingTeam;
            document.getElementById("next-team").textContent = attackingTeam === 1 ? 2 : 1;
        }, 2000);
    }

    if (defendingTeam.ships.every(ship => ship.lives === 0)) {
        showImage("win-image");
        setTimeout(() => {
            alert(`Team ${attackingTeam} wins!`);
            document.getElementById("game-phase").innerHTML = `<h2>Team ${attackingTeam} Wins!</h2>`;
            document.getElementById("turn-transition").style.display = "none";
        }, 2000);
    }
}

// Start the next team's turn
function startNextTurn() {
    gameState.currentTeam = gameState.currentTeam === 1 ? 2 : 1;
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
        currentTeamSpan.style.setProperty("color", gameState.currentTeam === 1 ? "#FFD700" : "#00CED1", "important");
    } else {
        console.error("Element with id 'current-team' not found!");
    }

    const team1Ships = document.getElementById("team1-ships");
    const team2Ships = document.getElementById("team2-ships");

    if (gameState.currentTeam === 1) {
        team1Ships.innerHTML = gameState.team1.ships
            .map(ship => `Number ${ship.number === "B" ? "Bullseye" : ship.number}: ${ship.lives}/${ship.originalLives} lives`)
            .join("<br>");
        team2Ships.innerHTML = "Hidden";
    } else {
        team1Ships.innerHTML = "Hidden";
        team2Ships.innerHTML = gameState.team2.ships
            .map(ship => `Number ${ship.number === "B" ? "Bullseye" : ship.number}: ${ship.lives}/${ship.originalLives} lives`)
            .join("<br>");
    }

    const teamThrows = gameState.allThrows.filter(t => t.team === gameState.currentTeam);
    const hits = teamThrows
        .filter(t => t.result === "Hit!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number} (${t.multiplier}x): Hit!`)
        .join("<br>");
    const misses = teamThrows
        .filter(t => t.result === "Miss!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number}`)
        .join("<br>");
    const sunk = teamThrows
        .filter(t => t.result === "Sunk!" || t.result === "Already Sunk!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number}: ${t.result}`)
        .join("<br>");

    document.getElementById("hits-list").innerHTML = hits || "No hits yet.";
    document.getElementById("misses-list").innerHTML = misses || "No misses yet.";
    document.getElementById("sunk-list").innerHTML = sunk || "No ships sunk yet.";
}
