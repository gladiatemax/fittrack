const daysOfWeek = ["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"];
let currentDayIndex = 0;
let program = {};

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getUser() {
  let user = localStorage.getItem("fittrack_user");
  if (!user) {
    user = prompt("Inserisci il tuo nome utente:");
    if (user) {
      localStorage.setItem("fittrack_user", user.toLowerCase());
    } else {
      return getUser();
    }
  }
  return user;
}

function getCurrentWeek(startDateStr) {
  const start = new Date(startDateStr);
  const today = new Date();
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffMs = todayDate - startDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
}

async function loadProgram(username) {
  try {
    const response = await fetch(`${username}.json`);
    if (!response.ok) throw new Error("Impossibile caricare scheda");
    program = await response.json();

    currentDayIndex = getClosestDayIndex();
    displayProgram();
  } catch (e) {
    document.getElementById("programDisplay").innerHTML =
      `<p style="color:#f87171;">Errore nel caricamento della scheda: ${e.message}</p>`;
  }
}

function getClosestDayIndex() {
  const today = new Date().getDay();
  const map = [6, 0, 1, 2, 3, 4, 5];
  const todayIndex = map[today];
  const validDays = daysOfWeek
    .map((day, i) => program[day] && program[day].length > 0 ? i : null)
    .filter(i => i !== null);
  if (validDays.includes(todayIndex)) return todayIndex;
  for (let offset = 1; offset < daysOfWeek.length; offset++) {
    const nextIndex = (todayIndex + offset) % daysOfWeek.length;
    if (validDays.includes(nextIndex)) return nextIndex;
  }
  return validDays[0];
}

function displayProgram() {
  const container = document.getElementById("programDisplay");
  const validDays = daysOfWeek.filter(day => program[day] && program[day].length > 0);
  if (validDays.length === 0) {
    container.innerHTML = "<p>Nessuna scheda disponibile.</p>";
    return;
  }

  while (!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length === 0) {
    currentDayIndex = (currentDayIndex + 1) % daysOfWeek.length;
  }

  const day = daysOfWeek[currentDayIndex];
  document.getElementById("currentDayLabel").innerText = capitalize(day);

  const currentWeek = getCurrentWeek(program.startDate);

  let html = `<h3>📅 ${capitalize(day)}</h3>`;
  program[day].forEach(exercise => {
    const imgSrc = exercise.image || "img/default.png"; // fallback
    html += `
      <div class="exercise-card">
        <img src="${imgSrc}" alt="${exercise.exercise}" class="exercise-img">
        <h4>🏋️ ${exercise.exercise}</h4>
        <table>
          <thead>
            <tr>
              <th>Settimana</th>
              <th>Serie/<br>Ripetizioni</th>
              <th>Recupero</th>
              <th>Peso (kg)</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>`;

    exercise.log.forEach((log, logIndex) => {
      const highlightClass = Number(log.week) === Number(currentWeek) ? "current-week" : "hidden-week";
      html += `
        <tr class="exercise-row ${highlightClass}" data-exercise="${exercise.exercise}" data-logindex="${logIndex}">
          <td>${log.week}</td>
          <td>${log.setsReps || "-"}</td>
          <td>${log.recupero || "-"}</td>
          <td>${log.weight || "-"}</td>
          <td>${log.note ? log.note : "-"}</td>
        </tr>`;
    });

    html += `</tbody></table>
      <button class="toggle-weeks-btn">👁 Mostra tutte le settimane</button>
      </div>`;
  });

  container.innerHTML = html;

  // Toggle settimane
  document.querySelectorAll(".toggle-weeks-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const table = btn.previousElementSibling;
      const hiddenRows = table.querySelectorAll(".hidden-week");
      const expanded = btn.classList.toggle("expanded");
      hiddenRows.forEach(r => r.style.display = expanded ? "table-row" : "none");
      btn.textContent = expanded ? "🙈 Nascondi settimane" : "👁 Mostra tutte le settimane";
    });
  });
}

// Navigazione giorni
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

async function init() {
  const user = getUser();

  if (user === "admin") {
    document.querySelector("#adminPanel").style.display = "flex";
    try {
      const res = await fetch("programs.json");
      const users = await res.json();

      const select = document.querySelector("#userSelect");
      users.forEach(u => {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        select.appendChild(opt);
      });

      loadProgram(users[0]);
      select.addEventListener("change", e => loadProgram(e.target.value));
    } catch (err) {
      console.error("Errore caricamento lista utenti:", err);
    }
  } else {
    loadProgram(user);
  }
}

init();
