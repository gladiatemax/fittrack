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
    displayProgram();
  } catch (e) {
    document.getElementById("programDisplay").innerHTML = `<p style="color:#f87171;">Errore nel caricamento della scheda: ${e.message}</p>`;
  }
}

function displayProgram() {
  const container = document.getElementById("programDisplay");

  // Trova giorni validi (con esercizi)
  const validDays = daysOfWeek.filter(day => program[day] && program[day].length > 0);
  if (validDays.length === 0) {
    container.innerHTML = "<p>Nessuna scheda disponibile.</p>";
    return;
  }

  // Assicurati che currentDayIndex punti a giorno valido
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

// Carica scheda all'avvio
loadProgram();
