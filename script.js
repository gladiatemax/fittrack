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
    .map((day,i)=>program[day] && program[day].length>0 ? i:null)
    .filter(i=>i!==null);
  if (validDays.includes(todayIndex)) return todayIndex;
  for(let offset=1; offset<daysOfWeek.length; offset++){
    const nextIndex=(todayIndex+offset)%daysOfWeek.length;
    if(validDays.includes(nextIndex)) return nextIndex;
  }
  return validDays[0];
}

// Suono di fine timer (beep soft)
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 750; // tono medio-alto, ma non fastidioso
    gain.gain.value = 0.05;    // volume molto basso

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4); // durata mezzo secondo
  } catch (e) {
    console.warn("Audio non supportato:", e);
  }
}

// Mostra programma
function displayProgram() {
  const container=document.getElementById("programDisplay");
  const validDays=daysOfWeek.filter(day=>program[day]&&program[day].length>0);
  if(validDays.length===0){ container.innerHTML="<p>Nessuna scheda disponibile.</p>"; return; }
  while(!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length===0){
    currentDayIndex=(currentDayIndex+1)%daysOfWeek.length;
  }

  const day=daysOfWeek[currentDayIndex];
  document.getElementById("currentDayLabel").innerText=capitalize(day);
  const currentWeek=getCurrentWeek(program.startDate);

  let html=`<h3>📅 ${capitalize(day)}</h3>`;
  program[day].forEach(exercise=>{
    const imgPath=`img/${exercise.exercise.replace(/ /g,"_").toLowerCase()}.png`;
    html+=`<div class="exercise-container">
      <h4>🏋️ ${exercise.exercise}</h4>
      <img src="${imgPath}" alt="${exercise.exercise}" class="exercise-img" width="80" height="80">
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

    // Mostra solo settimana corrente inizialmente
    exercise.log.forEach((log,logIndex)=>{
      const highlightClass=Number(log.week)===Number(currentWeek)?"current-week":"other-week";
      html+=`<tr class="exercise-row ${highlightClass}" data-exercise="${exercise.exercise}" data-logindex="${logIndex}" ${highlightClass==="other-week"?'style="display:none"':''}>
        <td>${log.week}</td>
        <td>${log.setsReps||"-"}</td>
        <td>${log.recupero||"-"}</td>
        <td>${log.weight||"-"}</td>
        <td>${log.note?log.note:"-"}</td>
      </tr>`;
    });

    html+=`</tbody></table>
      <button class="toggle-weeks" data-exercise="${exercise.exercise}">👁️ Mostra altre settimane</button>
    </div>`;
  });

  container.innerHTML=html;

  // Toggle settimane
  document.querySelectorAll(".toggle-weeks").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const exercise=btn.dataset.exercise;
      const rows=document.querySelectorAll(`.exercise-row[data-exercise="${exercise}"].other-week`);
      const isHidden=rows[0].style.display==="none";
      rows.forEach(r=>r.style.display=isHidden?"table-row":"none");
      btn.textContent=isHidden?"👁️ Nascondi altre settimane":"👁️ Mostra altre settimane";
    });
  });

  // Contatore + Timer
  document.querySelectorAll(".exercise-row").forEach(row=>{
    row.addEventListener("click",()=>{
      const existing=row.nextElementSibling;
      if(existing && existing.classList.contains("counter-box")){
        existing.classList.add("fade-out");
        existing.addEventListener("animationend",()=>existing.remove(),{once:true});
        return;
      }
      document.querySelectorAll(".counter-box").forEach(box=>{
        box.classList.add("fade-out");
        box.addEventListener("animationend",()=>box.remove(),{once:true});
      });

      const counterBox=document.createElement("tr");
      counterBox.className="counter-box";
      counterBox.innerHTML=`<td colspan="5">
        <div class="counter-content">
          <div class="series-container">
            <span class="counter-label">Serie completate:</span>
            <span class="counter-value">0</span>
            <div class="counter-buttons">
              <button class="btn-minus">-</button>
              <button class="btn-plus">+</button>
              <button class="btn-reset">⟳</button>
            </div>
          </div>
          <div class="timer-container">
            <span class="counter-label">Recupero:</span>
            <input type="number" min="1" value="30" class="timer-minutes" style="width:50px"> sec
            <button class="btn-start-timer">▶</button>
            <span class="timer-display">0</span> sec
          </div>
        </div>
      </td>`;
      row.insertAdjacentElement("afterend",counterBox);

      // Serie contatore
      const valueEl=counterBox.querySelector(".counter-value");
      let count=0;
      counterBox.querySelector(".btn-plus").addEventListener("click",()=>{count++; valueEl.textContent=count;});
      counterBox.querySelector(".btn-minus").addEventListener("click",()=>{if(count>0) count--; valueEl.textContent=count;});
      counterBox.querySelector(".btn-reset").addEventListener("click",()=>{count=0; valueEl.textContent=count;});

      const timerDisplay = counterBox.querySelector(".timer-display");
      let timerInterval = null;

      counterBox.querySelector(".btn-start-timer").addEventListener("click", () => {
        if (timerInterval) {
          clearInterval(timerInterval);
          timerInterval = null;
        }

        let seconds = parseInt(counterBox.querySelector(".timer-minutes").value, 10);
        if (isNaN(seconds) || seconds <= 0) return;

        timerDisplay.textContent = seconds;
        timerDisplay.style.color = "#38bdf8"; // azzurrino iniziale

        timerInterval = setInterval(() => {
          seconds--;
          timerDisplay.textContent = seconds;

          // cambia colore quando mancano 5 secondi
          if (seconds <= 5 && seconds > 0) {
            timerDisplay.style.color = "#facc15"; // giallo avviso
          }

          if (seconds <= 0) {
            clearInterval(timerInterval);
            playBeep(); // ✅ suono dolce
            row.classList.add("timer-finished");
            timerDisplay.textContent = "⏱️ Fine!";
            timerDisplay.style.color = "#f87171"; // rosso
            setTimeout(() => {
              row.classList.remove("timer-finished");
              timerDisplay.style.color = "#38bdf8"; // ripristina colore base
            }, 2500);
          }
        }, 1000);
      });
    });
  });
}

// Navigazione giorni
document.getElementById("prevDay").addEventListener("click",()=>{
  do{currentDayIndex=(currentDayIndex-1+daysOfWeek.length)%daysOfWeek.length;}
  while(!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length===0);
  displayProgram();
});
document.getElementById("nextDay").addEventListener("click",()=>{
  do{currentDayIndex=(currentDayIndex+1)%daysOfWeek.length;}
  while(!program[daysOfWeek[currentDayIndex]] || program[daysOfWeek[currentDayIndex]].length===0);
  displayProgram();
});

// Inizializzazione
async function init(){
  const user=getUser();
  if(user==="admin"){
    document.querySelector("#adminPanel").style.display="flex";
    try{
      const res=await fetch("programs.json");
      const users=await res.json();
      const select=document.querySelector("#userSelect");
      users.forEach(u=>{
        const opt=document.createElement("option");
        opt.value=u; opt.textContent=u; select.appendChild(opt);
      });
      loadProgram(users[0]);
      select.addEventListener("change",e=>{loadProgram(e.target.value);});
    }catch(err){ console.error("Errore caricamento lista utenti:",err);}
  }else{
    loadProgram(user);
  }
}
init();
