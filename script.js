const daysOfWeek = ["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"];
let currentDayIndex = 0;
let program = {};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function loadProgram() {
  try {
    const response = await fetch("program.json");
    if (!response.ok) throw new Error("Impossibile caricare program.json");
    program = await response.json();

    // Trova il giorno iniziale più vicino
    currentDayIndex = getClosestDayIndex();
    displayProgram();
  } catch (e) {
    document.getElementById("programDisplay").innerHTML =
      `<p style="color:#f87171;">Errore nel caricamento della scheda: ${e.message}</p>`;
  }
}

/**
 * Restituisce l'indice del giorno da mostrare per primo:
 * - Se oggi è presente, mostra oggi
 * - Altrimenti trova il prossimo giorno disponibile
 */
function getClosestDayIndex() {
  const today = new Date().getDay(); 
  // Domenica = 0, Lunedì = 1, ..., Sabato = 6
  const map = [6, 0, 1, 2, 3, 4, 5]; 
  // Converte: 0->domenica=6, 1->lunedì=0, ecc.
  const todayIndex = map[today];

  const validDays = daysOfWeek
    .map((day, i) => program[day] && program[day].length > 0 ? i : null)
    .filter(i => i !== null);

  if (validDays.includes(todayIndex)) return todayIndex;

  // Cerca il prossimo giorno valido
  for (let offset = 1; offset < daysOfWeek.length; offset++) {
    const nextIndex = (todayIndex + offset) % daysOfWeek.length;
    if (validDays.includes(nextIndex)) return nextIndex;
  }

  return validDays[0]; // fallback
}

function displayProgram() {
  const container = document.getElementById("programDisplay");

  // Trova giorni validi
  const validDays = daysOfWeek.filter(day => program[day] && program[day].length > 0);
  if (validDays.length === 0) {
    container.innerHTML = "<p>Nessuna scheda disponibile.</p>";
    return;
  }

  // Assicurati che currentDayIndex sia valido
  while (!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length === 0) {
    currentDayIndex = (currentDayIndex + 1) % daysOfWeek.length;
  }

  const day = daysOfWeek[currentDayIndex];
  document.getElementById("currentDayLabel").innerText = capitalize(day);

  let html = `<h3>📅 ${capitalize(day)}</h3>`;

  program[day].forEach(exercise => {
    html += `<h4 class="exercise-title" data-exercise="${exercise.exercise}">🏋️ ${exercise.exercise}</h4>`;
    html += `<table>
      <thead>
        <tr>
          <th>Settimana</th>
          <th>Serie/Ripetizioni</th>
          <th>Peso (kg)</th>
          <th>Note</th>
        </tr>
      </thead>
      <tbody>`;

    exercise.log.forEach(log => {
    html += `<tr class="log-row" data-exercise="${exercise.exercise}" data-week="${log.week}">
    <td>${log.week}</td>
    <td>${log.setsReps || "-"}</td>
    <td>${log.weight}</td>
    <td>${log.note ? log.note : "-"}</td>
  </tr>`;
  });


    html += `</tbody></table>`;
  });

  container.innerHTML = html;
}

document.getElementById("prevDay").addEventListener("click", () => {
  do {
    currentDayIndex = (currentDayIndex - 1 + daysOfWeek.length) % daysOfWeek.length;
  } while (!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length === 0);
  displayProgram();
});

document.getElementById("nextDay").addEventListener("click", () => {
  do {
    currentDayIndex = (currentDayIndex + 1) % daysOfWeek.length;
  } while (!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length === 0);
  displayProgram();
});

document.addEventListener("click", e => {
  const row = e.target.closest(".log-row");
  if (!row) return;

  // Rimuovi eventuali altri contatori aperti
  const oldCounter = document.querySelector(".series-counter-row");
  if (oldCounter) oldCounter.remove();

  // Crea una nuova riga subito sotto quella cliccata
  const counterRow = document.createElement("tr");
  counterRow.classList.add("series-counter-row");

  const td = document.createElement("td");
  td.colSpan = 4; // la tabella ha 4 colonne
  td.innerHTML = `
    <div class="series-counter">
      <span>Serie completate: <span class="series-value">0</span></span>
      <div class="series-buttons">
        <button class="minus-btn">➖</button>
        <button class="plus-btn">➕</button>
        <button class="reset-btn">🔄 Reset</button>
      </div>
    </div>
  `;
  counterRow.appendChild(td);

  row.insertAdjacentElement("afterend", counterRow);

  let value = 0;
  const valueEl = td.querySelector(".series-value");

  td.querySelector(".plus-btn").addEventListener("click", () => {
    value++;
    valueEl.textContent = value;
  });

  td.querySelector(".minus-btn").addEventListener("click", () => {
    if (value > 0) value--;
    valueEl.textContent = value;
  });

  td.querySelector(".reset-btn").addEventListener("click", () => {
    value = 0;
    valueEl.textContent = value;
  });
});


// Carica scheda all'avvio
loadProgram();
