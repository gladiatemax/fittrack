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
      html += `<tr>
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

let currentSeries = 0;

document.addEventListener("click", e => {
  if (e.target.classList.contains("exercise-title")) {
    const exerciseName = e.target.dataset.exercise;
    currentSeries = 0;
    document.getElementById("popupExerciseName").innerText = exerciseName;
    document.getElementById("seriesDone").innerText = currentSeries;
    document.getElementById("seriesCounterPopup").classList.remove("hidden");
  }
});

document.getElementById("addSeriesBtn").addEventListener("click", () => {
  currentSeries++;
  document.getElementById("seriesDone").innerText = currentSeries;
});

document.getElementById("closePopupBtn").addEventListener("click", () => {
  document.getElementById("seriesCounterPopup").classList.add("hidden");
});


// Carica scheda all'avvio
loadProgram();
