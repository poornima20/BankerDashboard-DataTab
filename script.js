let players = [];
let transactionLog = [];

function saveGameState() {
  const gameState = {
    players,
    transactionLog
  };
  localStorage.setItem("boardGameBanker", JSON.stringify(gameState));
}

function loadGameState() {
  const saved = localStorage.getItem("boardGameBanker");
  if (saved) {
    const { players: savedPlayers, transactionLog: savedLog } = JSON.parse(saved);
    players = savedPlayers || [];
    transactionLog = savedLog || [];
    return true;
  }
  return false;
}

function clearGameState() {
  localStorage.removeItem("boardGameBanker");
}

// Predefined list of properties
const PROPERTY_LIST = [
  { name: "Park Place", value: 300 },
  { name: "Boardwalk", value: 400 },
  { name: "Baltic Avenue", value: 150 },
  { name: "Mediterranean Avenue", value: 100 },
  { name: "St. Charles Place", value: 250 },
  { name: "New York Avenue", value: 200 },
  { name: "Kentucky Avenue", value: 220 },
  { name: "Indiana Avenue", value: 220 },
  { name: "Illinois Avenue", value: 240 },
  { name: "Atlantic Avenue", value: 260 },
  { name: "Ventnor Avenue", value: 260 }
];

function init() {
  if (!loadGameState()) {
    // Start with default player if no saved data
    const defaultPlayer = {
      id: Math.floor(Math.random() * 1000000),
      name: "Player 1",
      balance: 2000,
      salary: 400,
      properties: []
    };
    players = [defaultPlayer];
    logTransaction(`🎮 New game started`);
  }
  updateUI();
}

function addPlayer(name = "", balance = 2000) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      <h2>Add New Player</h2>
      <form id="player-form" style="display:flex;flex-direction:column;gap:10px;">
        <input type="text" id="player-name" placeholder="Enter name" required />
        <input type="number" id="start-balance" value="2000" min="0" />
        <input type="number" id="salary" value="400" min="0" />
        <button type="submit" class="btn-add">Add Player</button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector(".modal-close").onclick = () => modal.remove();
  modal.style.display = "flex";

  document.getElementById("player-form").onsubmit = function(e) {
    e.preventDefault();
    const name = document.getElementById("player-name").value.trim();
    const startBalance = parseInt(document.getElementById("start-balance").value);
    const salary = parseInt(document.getElementById("salary").value);

    if (!name || isNaN(startBalance) || isNaN(salary)) return;

    const newPlayer = {
      id: Date.now(),
      name,
      balance: startBalance,
      salary,
      properties: []
    };
    players.push(newPlayer);
    logTransaction(`➕ ${name} added with Rs.${startBalance}`);
    updateUI();
    modal.remove();
  };
  saveGameState();
}

function paySalaries() {
  players.forEach(p => {
    p.balance += p.salary;
    logTransaction(`💰 Salary paid to ${p.name}: +Rs.${p.salary}`);
  });
  updateUI();
  saveGameState();
}

function showHistory() {
  const modal = document.createElement("div");
  modal.className = "modal";
  let history = `<h2>📜 Transaction History</h2><div style="white-space: pre-line; max-height: 400px; overflow-y:auto;">`;
  transactionLog.forEach((log, i) => {
    history += `${i + 1}. ${log}\n\n`;
  });
  history += `</div>`;
  modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">&times;</span>
      ${history}
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector(".modal-close").onclick = () => modal.remove();
  modal.style.display = "flex";
}

function assignProperty(playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player) return;

  // Show available properties
  const available = PROPERTY_LIST.filter(prop => 
    !player.properties.some(p => p.name === prop.name)
  );

  let propNames = available.map((p, i) => `${i + 1}. ${p.name} (Rs.${p.value})`).join("\n");
  let choice = parseInt(prompt(`Select a property to add:\n${propNames}`)) - 1;

  if (available[choice]) {
    const selected = { ...available[choice], mortgaged: false };
    player.properties.push(selected);
    logTransaction(`🏠 ${player.name} bought ${selected.name}`);
    updateUI();
  }
}

function mortgageProperty(playerId, propertyName) {
  const player = players.find(p => p.id === playerId);
  const prop = player.properties.find(p => p.name === propertyName);

  if (!prop || prop.mortgaged) return;

  const mortgageValue = Math.floor(prop.value * 0.5);
  const redeemAmount = Math.ceil(mortgageValue * 1.1); // 10% interest

  player.balance += mortgageValue;
  prop.mortgaged = true;
  prop.redeemAmount = redeemAmount;

  logTransaction(`🏡 ${player.name} mortgaged ${prop.name} for Rs.${mortgageValue}`);
  updateUI();
  saveGameState();
}

function redeemProperty(playerId, propertyName) {
  const player = players.find(p => p.id === playerId);
  const prop = player.properties.find(p => p.name === propertyName);

  if (!prop || !prop.mortgaged) return;

  const amount = prop.redeemAmount;
  if (player.balance >= amount) {
    player.balance -= amount;
    prop.mortgaged = false;
    delete prop.redeemAmount;
    logTransaction(`✅ ${player.name} redeemed ${prop.name} for Rs.${amount}`);
    updateUI();
  } else {
    alert("Not enough money to redeem!");
  }
  saveGameState();
}

function logTransaction(text) {
  const time = new Date().toLocaleTimeString();
  transactionLog.push(`[${time}] ${text}`);
  saveGameState();
}

function updateUI() {
  const dashboard = document.getElementById("player-dashboard");
  dashboard.innerHTML = "";

  players.forEach(player => {
    const card = document.createElement("div");
    card.className = "card";

    const name = document.createElement("h2");
    name.textContent = player.name;

        // Edit Button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.className = "btn-edit";
    editBtn.style.marginTop = "10px";
    editBtn.onclick = () => editPlayerName(player.id);

    // Remove Button
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "❌";
    removeBtn.className = "btn-remove";
    removeBtn.style.marginBottom = "3rem";
    removeBtn.onclick = () => removePlayer(player.id);

    const balance = document.createElement("div");
    balance.className = "balance";
    balance.textContent = `Rs.${player.balance}`;

    // Input field and buttons
    const inputContainer = document.createElement("div");
    inputContainer.className = "btn-input";

    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Amount";
    input.style.width = "110px";

    const addBtn = document.createElement("button");
    addBtn.textContent = "+ Add";
    addBtn.className = "btn-add";
    addBtn.onclick = () => {
      const amount = parseInt(input.value);
      if (!isNaN(amount) && amount > 0) {
        player.balance += amount;
        logTransaction(`➕ ${player.name} received +Rs.${amount}`);
        updateUI();
      }
    };

    const subBtn = document.createElement("button");
    subBtn.textContent = "- Subtract";
    subBtn.className = "btn-subtract";
    subBtn.onclick = () => {
      const amount = parseInt(input.value);
      if (!isNaN(amount) && amount > 0 && player.balance >= amount) {
        player.balance -= amount;
        logTransaction(`➖ ${player.name} lost - Rs.${amount}`);
        updateUI();
      } else {
        alert("Invalid amount or insufficient funds!");
      }
    };

    inputContainer.appendChild(input);
    inputContainer.appendChild(addBtn);
    inputContainer.appendChild(subBtn);

    const salaryBtn = document.createElement("button");
    salaryBtn.textContent = `💰 Pay Salary (Rs. ${player.salary})`;
    salaryBtn.className = "btn-primary";
    salaryBtn.style.marginTop = "20px";
    salaryBtn.onclick = () => {
      player.balance += player.salary;
      logTransaction(`💰 Salary paid to ${player.name}: +Rs.${player.salary}`);
      updateUI();
    };

    // Property display
    const propList = document.createElement("div");
    propList.className = "properties";
    propList.innerHTML = "<strong>Properties:</strong><br>";

    if (player.properties.length === 0) {
      propList.innerHTML += "<em>No properties yet.</em>";
    } else {
      player.properties.forEach(prop => {
        const tag = document.createElement("span");
        tag.className = "property-tag";
        if (prop.mortgaged) {
          tag.classList.add("mortgaged");
          tag.innerHTML = `${prop.name} 
            <button class="redeem" onclick="redeemProperty(${player.id}, '${prop.name}')">Redeem Rs.${prop.redeemAmount}</button>`;
        } else {
          tag.textContent = `${prop.name} (Rs. ${prop.value})`;
        }

        const mortgageBtn = document.createElement("button");
        mortgageBtn.textContent = "Mortgage";
        mortgageBtn.style.fontSize = "0.8rem";
        mortgageBtn.style.marginLeft = "10px";
        mortgageBtn.style.color = "red";
        mortgageBtn.onclick = () => mortgageProperty(player.id, prop.name);
        if (!prop.mortgaged) {
          tag.appendChild(mortgageBtn);
        }

        propList.appendChild(tag);
      });
    }

    const propBtn = document.createElement("button");
    propBtn.textContent = "🏠 Add Property";
    propBtn.className = "btn-primary";
    propBtn.style.marginTop = "10px";
    propBtn.onclick = () => assignProperty(player.id);

    card.appendChild(name);
    card.appendChild(editBtn);     // Add this
    card.appendChild(removeBtn);   // Add this
    card.appendChild(balance);
    card.appendChild(inputContainer);
    card.appendChild(salaryBtn);
    card.appendChild(propBtn);
    card.appendChild(propList);

    dashboard.appendChild(card);
  });
}

init();

function newGame() {
  if (confirm("Are you sure you want to start a new game? This will erase all current data.")) {
    clearGameState();
    players = [];
    transactionLog = [];
    logTransaction("🆕 New game started");
    updateUI();
  }
}

function editPlayerName(playerId) {
  const player = players.find(p => p.id === playerId);
  if (!player) return;

  const newName = prompt("Edit player name:", player.name);
  if (newName && newName.trim() !== "") {
    const oldName = player.name;
    player.name = newName.trim();
    logTransaction(`📝 ${oldName} renamed to ${newName}`);
    saveGameState();
    updateUI();
  }
}

function removePlayer(playerId) {
  if (!confirm("Are you sure you want to remove this player?")) return;

  const index = players.findIndex(p => p.id === playerId);
  if (index > -1) {
    const removed = players.splice(index, 1)[0];
    logTransaction(`🗑️ ${removed.name} was removed`);
    saveGameState();
    updateUI();
  }
}