const daysOfWeek = ["lunedì","martedì","mercoledì","giovedì","venerdì","sabato","domenica"];
let currentDayIndex = 0;
let program = {};

// Capitalizza stringa
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Chiede nome utente o admin
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

// Carica programma per un utente specifico
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

// Trova giorno iniziale più vicino
function getClosestDayIndex() {
  const today = new Date().getDay();
  const map = [6,0,1,2,3,4,5];
  const todayIndex = map[today];
  const validDays = daysOfWeek
    .map((day,i) => program[day] && program[day].length > 0 ? i : null)
    .filter(i => i !== null);
  if (validDays.includes(todayIndex)) return todayIndex;
  for (let offset=1; offset<daysOfWeek.length; offset++) {
    const nextIndex = (todayIndex+offset)%daysOfWeek.length;
    if (validDays.includes(nextIndex)) return nextIndex;
  }
  return validDays[0];
}

// Mostra programma
function displayProgram() {
  const container = document.getElementById("programDisplay");
  container.innerHTML = "";
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

  program[day].forEach(exercise => {
    let fileName = exercise.exercise.toLowerCase().replace(/\s+/g,"_").replace(/[^\w\-]/g,"");
    let imgSrc = `img/${fileName}.png`;

    fetch(imgSrc, {method:'HEAD'})
      .then(res => { if(!res.ok) imgSrc="img/default.png"; })
      .catch(()=>{ imgSrc="img/default.png"; })
      .finally(() => {
        let html = `<div class="exercise-card">
                      <h4>🏋️ ${exercise.exercise}</h4>
                      <table>
                        <thead>
                          <tr>
                            <th>Immagine</th>
                            <th>Settimana</th>
                            <th>Serie/<br>Ripetizioni</th>
                            <th>Recupero</th>
                            <th>Peso (kg)</th>
                            <th>Note</th>
                          </tr>
                        </thead>
                        <tbody>`;

        exercise.log.forEach((log, logIndex) => {
          const highlightClass = Number(log.week)===Number(currentWeek)?"current-week":"";
          html += `<tr class="exercise-row ${highlightClass}" data-exercise="${exercise.exercise}" data-logindex="${logIndex}">
                    <td><img src="${imgSrc}" alt="${exercise.exercise}" class="exercise-img"></td>
                    <td>${log.week}</td>
                    <td>${log.setsReps||"-"}</td>
                    <td>${log.recupero||"-"}</td>
                    <td>${log.weight||"-"}</td>
                    <td>${log.note||"-"}</td>
                  </tr>`;
        });

        html += `</tbody></table></div>`;
        container.innerHTML += html;

        // Contatore + timer recupero
        document.querySelectorAll(".exercise-row").forEach(row => {
          row.addEventListener("click", () => {
            const existing = row.nextElementSibling;
            if(existing && existing.classList.contains("counter-box")) {
              existing.classList.add("fade-out");
              existing.addEventListener("animationend",()=>existing.remove(),{once:true});
              return;
            }
            document.querySelectorAll(".counter-box").forEach(box=>{
              box.classList.add("fade-out");
              box.addEventListener("animationend",()=>box.remove(),{once:true});
            });

            const counterBox = document.createElement("tr");
            counterBox.className="counter-box";
            counterBox.innerHTML = `<td colspan="6">
              <div class="counter-content">
                <span class="counter-label">Serie completate:</span>
                <span class="counter-value">0</span>
                <div class="counter-buttons">
                  <button class="btn-minus">-</button>
                  <button class="btn-plus">+</button>
                  <button class="btn-reset">⟳</button>
                </div>
                <div class="recovery-timer">
                  <span>Recupero: </span>
                  <span class="timer-display">0:00</span>
                  <button class="btn-start-timer">▶</button>
                  <button class="btn-reset-timer">⟳</button>
                </div>
              </div>
            </td>`;
            row.insertAdjacentElement("afterend",counterBox);

            // Gestione contatore
            const valueEl = counterBox.querySelector(".counter-value");
            let count = 0;
            counterBox.querySelector(".btn-plus").addEventListener("click",()=>{count++; valueEl.textContent=count;});
            counterBox.querySelector(".btn-minus").addEventListener("click",()=>{if(count>0) count--; valueEl.textContent=count;});
            counterBox.querySelector(".btn-reset").addEventListener("click",()=>{count=0; valueEl.textContent=count;});

            // Gestione timer
            const timerDisplay = counterBox.querySelector(".timer-display");
            const btnStart = counterBox.querySelector(".btn-start-timer");
            const btnReset = counterBox.querySelector(".btn-reset-timer");
            let timer = null;
            let totalSeconds = 0;

            btnStart.addEventListener("click", ()=>{
              if(timer) return; // evita doppio click
              totalSeconds = 30; // default 30s
              timerDisplay.textContent = `0:${totalSeconds.toString().padStart(2,'0')}`;
              timer = setInterval(()=>{
                totalSeconds--;
                timerDisplay.textContent = `0:${totalSeconds.toString().padStart(2,'0')}`;
                if(totalSeconds<=0){ clearInterval(timer); timer=null; }
              },1000);
            });
            btnReset.addEventListener("click",()=>{
              if(timer){ clearInterval(timer); timer=null; }
              totalSeconds=0;
              timerDisplay.textContent="0:00";
            });
          });
        });
      });
  });
}


// Navigazione giorni
document.getElementById("prevDay").addEventListener("click", () => {
  do { currentDayIndex=(currentDayIndex-1+daysOfWeek.length)%daysOfWeek.length; }
  while(!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length===0);
  displayProgram();
});
document.getElementById("nextDay").addEventListener("click", () => {
  do { currentDayIndex=(currentDayIndex+1)%daysOfWeek.length; }
  while(!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length===0);
  displayProgram();
});

// Inizializzazione
async function init() {
  const user = getUser();
  if(user==="admin"){
    document.querySelector("#adminPanel").style.display="flex";
    try {
      const res = await fetch("programs.json");
      const users = await res.json();
      const select = document.querySelector("#userSelect");
      users.forEach(u=>{
        const opt=document.createElement("option");
        opt.value=u;
        opt.textContent=u;
        select.appendChild(opt);
      });
      loadProgram(users[0]);
      select.addEventListener("change",e=>{ loadProgram(e.target.value); });
    } catch(err){ console.error("Errore caricamento lista utenti:",err); }
  } else {
    loadProgram(user);
  }
}

init();
