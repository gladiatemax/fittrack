const daysOfWeek = ["lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato", "domenica"];
let currentDayIndex = 0;

async function fetchProgram() {
  const url = "https://raw.githubusercontent.com/gladiatemax/fittrack/main/schede.json";
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Errore nel caricamento");
    return await response.json();
  } catch (e) {
    console.error("Errore nel caricamento delle schede:", e);
    return {};
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function setupNavigation(data) {
  document.getElementById("prevDay").addEventListener("click", () => {
    currentDayIndex = (currentDayIndex - 1 + daysOfWeek.length) % daysOfWeek.length;
    displayProgram(data);
  });

  document.getElementById("nextDay").addEventListener("click", () => {
    currentDayIndex = (currentDayIndex + 1) % daysOfWeek.length;
    displayProgram(data);
  });
}

function displayProgram(data) {
  const container = document.getElementById("programDisplay");
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
        <td>${log.setsReps || "-"}</td>
        <td>${log.weight}</td>
        <td>${log.notes || ""}</td>
      </tr>`;
    });

    html += `</tbody></table>`;
  });

  container.innerHTML = html;
}

fetchProgram().then(data => {
  setupNavigation(data);
  displayProgram(data);
});
