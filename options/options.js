document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["workDuration","breakDuration","longBreakDuration"], (data) => {
    document.getElementById("workDuration").value = data.workDuration || 25;
    document.getElementById("breakDuration").value = data.breakDuration || 5;
    document.getElementById("longBreakDuration").value = data.longBreakDuration || 20;
  });

  document.getElementById("saveBtn").onclick = () => {
    const work = parseInt(document.getElementById("workDuration").value);
    const brk = parseInt(document.getElementById("breakDuration").value);
    const longBrk = parseInt(document.getElementById("longBreakDuration").value);

    chrome.storage.sync.set({ workDuration: work, breakDuration: brk, longBreakDuration: longBrk }, () => {
      alert("تنظیمات ذخیره شد!");
    });
  };
});