// Game state
let gameState = {
    teamSize: 0,
    team1: { ships: [], setupDone: false },
    team2: { ships: [], setupDone: false },
    currentTeam: 1,
    throwsThisTurn: 0,
    allThrows: [] // Track all throws throughout the game
};

// Start setup phase
function startSetup() {
    gameState.teamSize = parseInt(document.getElementById("team-size").value);
    document.getElementById("team-size-selection").style.display = "none";
    document.getElementById("setup-phase").style.display = "block";
}

// Add a ship during setup
function addShip() {
    const team = document.getElementById("team-select").value;
    const numberInput = document.getElementById("ship-number").value.trim().toUpperCase();
    const lives = parseInt(document.getElementById("ship-lives").value);
    const teamData = team === "1" ? gameState.team1 : gameState.team2;

    let number;
    if (numberInput === "B" || numberInput === "BULLSEYE") {
        number = "B";
    } else {
        number = parseInt(numberInput);
        if (isNaN(number) || number < 1 || number > 20) {
            alert("Enter a number between 1-20 or 'B' for bullseye!");
            return;
        }
    }

    if (isNaN(lives) || lives < 1) {
        alert("Lives must be a positive number!");
        return;
    }

    if (teamData.ships.some(ship => ship.number === number)) {
        alert("No duplicate numbers allowed!");
        return;
    }

    teamData.ships.push({ number, lives, originalLives: lives });
    updateShipList(team);
    document.getElementById("ship-number").value = "";
    document.getElementById("ship-lives").value = "";
}

// Display ships in setup phase
function updateShipList(team) {
    const shipList = document.getElementById("ship-list");
    const teamData = team === "1" ? gameState.team1 : gameState.team2;
    shipList.innerHTML = `Team ${team} Ships:<br>` + 
        teamData.ships.map(ship => 
            `Number ${ship.number === "B" ? "Bullseye" : ship.number}: ${ship.lives} lives`
        ).join("<br>");
}

// Finish setup for a team
function finishSetup() {
    const team = document.getElementById("team-select").value;
    const teamData = team === "1" ? gameState.team1 : gameState.team2;
    const requiredShips = gameState.teamSize === 1 ? 3 : gameState.teamSize === 2 ? 4 : 6;

    if (teamData.ships.length < requiredShips) {
        alert(`Add ${requiredShips - teamData.ships.length} more ships! (${requiredShips} required)`);
        return;
    }

    teamData.setupDone = true;
    document.getElementById("ship-list").innerHTML = "";
    alert(`Team ${team} setup complete! Switch to Team ${team === "1" ? "2" : "1"}.`);

    if (team === "1") {
        document.getElementById("team-select").value = "2";
    } else {
        document.getElementById("team-select").value = "1";
    }

    if (gameState.team1.setupDone && gameState.team2.setupDone) {
        document.getElementById("setup-phase").style.display = "none";
        document.getElementById("game-phase").style.display = "block";
        updateGameDisplay();
    }
}

// Submit a throw during gameplay
function submitThrow() {
    const throwInput = document.getElementById("throw-number").value.trim().toUpperCase();
    let number;
    if (throwInput === "B" || throwInput === "BULLSEYE") {
        number = "B";
    } else {
        number = parseInt(throwInput);
        if (isNaN(number) || number < 1 || number > 20) {
            alert("Enter a number between 1-20 or 'B' for bullseye!");
            return;
        }
    }

    const attackingTeam = gameState.currentTeam;
    const defendingTeam = attackingTeam === 1 ? gameState.team2 : gameState.team1;
    let result = "Miss!";
    
    for (let ship of defendingTeam.ships) {
        if (ship.number === number && ship.lives > 0) {
            ship.lives--;
            result = ship.lives === 0 ? "Sunk!" : "Hit!";
            break;
        }
    }

    gameState.allThrows.push({ team: attackingTeam, number, result });
    gameState.throwsThisTurn++;
    updateGameDisplay(); // Update display immediately after each throw
    document.getElementById("throw-number").value = "";

    if (gameState.throwsThisTurn === 3) {
        // Delay transition slightly to show the 3rd throw result
        setTimeout(() => {
            document.getElementById("game-phase").style.display = "none";
            document.getElementById("turn-transition").style.display = "block";
            document.getElementById("last-team").textContent = attackingTeam;
            document.getElementById("next-team").textContent = attackingTeam === 1 ? 2 : 1;
        }, 1000); // 1000ms delay to let the user see the result
    }

    if (defendingTeam.ships.every(ship => ship.lives === 0)) {
        alert(`Team ${attackingTeam} wins!`);
        document.getElementById("game-phase").innerHTML = `<h2>Team ${attackingTeam} Wins!</h2>`;
        document.getElementById("turn-transition").style.display = "none";
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

// Update game display
function updateGameDisplay() {
    document.getElementById("current-team").textContent = `Team ${gameState.currentTeam}`;
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

    // Filter throws for the current team
    const teamThrows = gameState.allThrows.filter(t => t.team === gameState.currentTeam);
    const hits = teamThrows
        .filter(t => t.result === "Hit!" || t.result === "Sunk!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number}: ${t.result}`)
        .join("<br>");
    const misses = teamThrows
        .filter(t => t.result === "Miss!")
        .map(t => `${t.number === "B" ? "Bullseye" : t.number}`)
        .join("<br>");

    document.getElementById("hits-list").innerHTML = hits || "No hits yet.";
    document.getElementById("misses-list").innerHTML = misses || "No misses yet.";
}