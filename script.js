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
    html += `<h4>🏋️ ${exercise.exercise}</h4>`;
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

  exercise.log.forEach((log, logIndex) => {
    html += `<tr class="exercise-row" data-exercise="${exercise.exercise}" data-logindex="${logIndex}">
      <td>${log.week}</td>
      <td>${log.setsReps || "-"}</td>
      <td>${log.weight}</td>
      <td>${log.note ? log.note : "-"}</td>
    </tr>`;
  });

    html += `</tbody></table>`;
  });

  container.innerHTML = html;

  document.querySelectorAll(".exercise-row").forEach(row => {
  row.addEventListener("click", () => {
    const existing = row.nextElementSibling;
    if (existing && existing.classList.contains("counter-box")) {
      // Se già aperta → la rimuovo
      existing.remove();
      return;
    }

    // Chiudi eventuali altre box aperte
    document.querySelectorAll(".counter-box").forEach(box => box.remove());

    // Crea la box contatore
    const counterBox = document.createElement("tr");
    counterBox.className = "counter-box";
    counterBox.innerHTML = `
      <td colspan="4">
        <div class="counter-content">
          <span class="counter-label">Serie completate:</span>
          <span class="counter-value">0</span>
          <div class="counter-buttons">
            <button class="btn-minus">-</button>
            <button class="btn-plus">+</button>
            <button class="btn-reset">⟳</button>
          </div>
        </div>
      </td>
    `;
    row.insertAdjacentElement("afterend", counterBox);

    const valueEl = counterBox.querySelector(".counter-value");
    let count = 0;

    counterBox.querySelector(".btn-plus").addEventListener("click", () => {
      count++;
      valueEl.textContent = count;
    });

    counterBox.querySelector(".btn-minus").addEventListener("click", () => {
      if (count > 0) count--;
      valueEl.textContent = count;
    });

    counterBox.querySelector(".btn-reset").addEventListener("click", () => {
      count = 0;
      valueEl.textContent = count;
    });
  });
  });

}

// Carica scheda all'avvio
loadProgram();
