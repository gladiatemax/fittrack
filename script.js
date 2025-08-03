function getProgram() {
  return JSON.parse(localStorage.getItem("weeklyProgram") || "{}");
}

function saveProgram(data) {
  localStorage.setItem("weeklyProgram", JSON.stringify(data));
}

function addExercise() {
  const day = document.getElementById("daySelect").value;
  const exerciseName = document.getElementById("exerciseName").value.trim();
  const setsReps = document.getElementById("setsReps").value.trim();
  const weight = parseFloat(document.getElementById("weight").value);
  const week = parseInt(document.getElementById("week").value);
  const note = document.getElementById("note").value.trim();

  if (!exerciseName || !setsReps || isNaN(weight) || isNaN(week)) {
    alert("Inserisci tutti i campi richiesti (escluso Note)");
    return;
  }

  const program = getProgram();
  if (!program[day]) program[day] = [];

  let existing = program[day].find(e => e.exercise === exerciseName);
  if (!existing) {
    existing = { exercise: exerciseName, log: [] };
    program[day].push(existing);
  }

  // Converti eventuali log vecchi errati
  existing.log = existing.log.map(entry => {
    if (typeof entry === "string") {
      const [week, sets, reps, weight] = entry.split(" ").map(Number);
      return { week, setsReps: `${sets}x${reps}`, weight, note: "" };
    }
    return entry;
  });

  existing.log.push({ week, setsReps, weight, note });

  saveProgram(program);
  displayProgram();

  // Pulisci form
  document.getElementById("exerciseName").value = "";
  document.getElementById("setsReps").value = "";
  document.getElementById("weight").value = "";
  document.getElementById("week").value = "";
  document.getElementById("note").value = "";
}

function clearAll() {
  if (confirm("Sei sicuro di voler cancellare tutte le schede?")) {
    localStorage.removeItem("weeklyProgram");
    displayProgram();
  }
}

const daysOfWeek = ["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"];
let currentDayIndex = 0;

function displayProgram() {
  const container = document.getElementById("programDisplay");
  const data = getProgram();

  const validDays = daysOfWeek.filter(day => data[day] && data[day].length > 0);
  if (validDays.length === 0) {
    container.innerHTML = "<p>Nessuna scheda disponibile.</p>";
    return;
  }

  while (!data[daysOfWeek[currentDayIndex]] || data[daysOfWeek[currentDayIndex]].length === 0) {
    currentDayIndex = (currentDayIndex + 1) % daysOfWeek.length;
  }

  const day = daysOfWeek[currentDayIndex];
  document.getElementById("currentDayLabel").innerText = capitalize(day);
  let html = `<h3>📅 ${capitalize(day)}</h3>`;

  data[day].forEach(exercise => {
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
        <td>${log.setsReps || ''}</td>
        <td>${log.weight}</td>
        <td>${log.note || ''}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
  });

  container.innerHTML = html;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

document.getElementById("prevDay").addEventListener("click", () => {
  currentDayIndex = (currentDayIndex - 1 + daysOfWeek.length) % daysOfWeek.length;
  displayProgram();
});

document.getElementById("nextDay").addEventListener("click", () => {
  currentDayIndex = (currentDayIndex + 1) % daysOfWeek.length;
  displayProgram();
});

document.getElementById("toggleFormBtn").addEventListener("click", () => {
  const formSection = document.querySelector(".form-section");
  formSection.style.display = (formSection.style.display === "none") ? "block" : "none";
});


// Mostra schede al caricamento
displayProgram();
