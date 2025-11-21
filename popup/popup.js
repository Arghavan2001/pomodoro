const timerEl = document.getElementById("timer");
const phaseEl = document.getElementById("phase");
const startBtn = document.getElementById("start");
const stopResumeBtn = document.getElementById("stopResume");
const myResetBtn = document.getElementById("myReset");
const divControls = stopResumeBtn.parentElement;
const progressBar = document.getElementById("progress-bar");
const body = document.body;


divControls.style.display = "none";


async function getDurations() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["workDuration", "breakDuration", "longBreakDuration"],
      (data) => {
        resolve({
          work: (data.workDuration || 25) * 60 * 1000,
          break: (data.breakDuration || 5) * 60 * 1000,
          longBreak: (data.longBreakDuration || 20) * 60 * 1000,
        });
      }
    );
  });
}


async function updateUI() {
  const durations = await getDurations();

  chrome.runtime.sendMessage({ action: "getTime" }, ({ remaining, phase }) => {
    const totalSec = Math.floor(remaining / 1000);
    const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const s = String(totalSec % 60).padStart(2, "0");

    timerEl.textContent = `${m}:${s}`;
    phaseEl.textContent =
      phase === "work"
        ? "Work"
        : phase === "break"
        ? "Break"
        : "Long Break";

    body.className = phase === "work" ? "" : phase === "break" ? "break" : "longBreak";

 
    const totalDuration =
      phase === "work"
        ? durations.work
        : phase === "break"
        ? durations.break
        : durations.longBreak;

    const progress = ((totalDuration - remaining) / totalDuration) * 100;
    progressBar.style.width = `${progress}%`;

    chrome.storage.local.get(["endTime", "pausedTime"], ({ endTime, pausedTime }) => {
      if (!endTime && !pausedTime) {
        startBtn.style.display = "flex";
        divControls.style.display = "none";
      } else {
        startBtn.style.display = "none";
        divControls.style.display = "flex";
        stopResumeBtn.textContent = pausedTime ? "Resume" : "Stop";
      }
    });
  });
}


function tick() {
  updateUI();
  requestAnimationFrame(tick);
}
tick();


startBtn.onclick = () => {
  chrome.runtime.sendMessage({ action: "start" }, () => {
    startBtn.style.display = "none";
    divControls.style.display = "flex";
    stopResumeBtn.textContent = "Stop";
  });
};


stopResumeBtn.onclick = () => {
  chrome.storage.local.get(["pausedTime"], (st) => {
    if (st.pausedTime) {
      chrome.runtime.sendMessage({ action: "resume" });
      stopResumeBtn.textContent = "Stop";
    } else {
      chrome.runtime.sendMessage({ action: "stop" });
      stopResumeBtn.textContent = "Resume";
    }
  });
};


myResetBtn.onclick = () => {
  chrome.runtime.sendMessage({ action: "reset" }, () => {
    divControls.style.display = "none";
    startBtn.style.display = "flex";
  });
};
