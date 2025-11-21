// وضعیت اولیه
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.clearAll();
  chrome.storage.local.set({
    phase: "work",
    endTime: null,
    pausedTime: null,
    pomoCount: 0
  });
});

// پیام‌ها
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  chrome.storage.local.get(["endTime", "pausedTime", "phase", "pomoCount"], (st) => {
    chrome.storage.sync.get(["workDuration", "breakDuration", "longBreakDuration"], (cfg) => {
      const now = Date.now();
      const WORK = (cfg.workDuration || 25) * 60000;
      const BREAK = (cfg.breakDuration || 5) * 60000;
      const LONG = (cfg.longBreakDuration || 20) * 60000;

      if (msg.action === "start") {
        // شروع از صفر
        let dur = st.phase === "work" ? WORK : (st.phase === "break" ? BREAK : LONG);
        const end = now + dur;
        chrome.storage.local.set({ endTime: end, pausedTime: null });
        chrome.alarms.create("pomodoro", { when: end });
        sendResponse({ ok: true });
      }

      if (msg.action === "stop") {
        if (st.endTime) {
          chrome.storage.local.set({ pausedTime: st.endTime - now, endTime: null });
          chrome.alarms.clear("pomodoro");
        }
        sendResponse({ ok: true });
      }

      if (msg.action === "resume") {
        if (st.pausedTime) {
          const end = now + st.pausedTime;
          chrome.storage.local.set({ endTime: end, pausedTime: null });
          chrome.alarms.create("pomodoro", { when: end });
        }
        sendResponse({ ok: true });
      }

      if (msg.action === "reset") {
        chrome.alarms.clear("pomodoro");
        chrome.storage.local.set({ endTime: null, pausedTime: null });
        sendResponse({ ok: true });
      }

      if (msg.action === "getTime") {
        let rem;
        if (st.pausedTime) rem = st.pausedTime;
        else if (st.endTime) rem = Math.max(0, st.endTime - now);
        else rem = st.phase === "work" ? WORK : (st.phase === "break" ? BREAK : LONG);
        sendResponse({ remaining: rem, phase: st.phase });
      }

    });
  });

  return true;
});


chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "pomodoro") return;

  chrome.storage.local.get(["phase", "pomoCount"], (st) => {
    chrome.storage.sync.get(["workDuration", "breakDuration", "longBreakDuration"], (cfg) => {
      const WORK = (cfg.workDuration || 25) * 60000;
      const BREAK = (cfg.breakDuration || 5) * 60000;
      const LONG = (cfg.longBreakDuration || 20) * 60000;

      chrome.storage.local.set({ endTime: null, pausedTime: null });

      let title, msg, buttons;

      if (st.phase === "work") {
        const nextCount = st.pomoCount + 1;
        const isLong = nextCount % 4 === 0;

        title = "پومودورو تموم شد!";
        msg = "میخوای استراحت کنی یا بری سر پومودوروی بعدی؟";
        buttons = [
          { title: isLong ? "Long Break" : "Short Break" },
          { title: "Next Pomodoro" }
        ];
      } else {
        title = "استراحتت تموم شد";
        msg = "میخوای پومودورو بعدی رو شروع کنی؟";
        buttons = [
          { title: "Next Pomodoro" },
          { title: "Repeat Break" }
        ];
      }

      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title,
        message: msg,
        buttons
      });
    });
  });
});


chrome.notifications.onButtonClicked.addListener((id, index) => {
  chrome.storage.local.get(["phase", "pomoCount"], (st) => {
    chrome.storage.sync.get(["workDuration", "breakDuration", "longBreakDuration"], (cfg) => {
      const now = Date.now();
      const WORK = (cfg.workDuration || 25) * 60000;
      const BREAK = (cfg.breakDuration || 5) * 60000;
      const LONG = (cfg.longBreakDuration || 20) * 60000;

      if (st.phase === "work") {
        const next = st.pomoCount + 1;
        const isLong = next % 4 === 0;

        if (index === 0) {
          const d = isLong ? LONG : BREAK;
          chrome.storage.local.set({
            phase: isLong ? "longBreak" : "break",
            endTime: now + d,
            pausedTime: null,
            pomoCount: next
          });
          chrome.alarms.create("pomodoro", { when: now + d });

        } else {
          chrome.storage.local.set({
            phase: "work",
            endTime: now + WORK,
            pausedTime: null
          });
          chrome.alarms.create("pomodoro", { when: now + WORK });
        }

      } else {
        if (index === 0) {
          chrome.storage.local.set({
            phase: "work",
            endTime: now + WORK,
            pausedTime: null
          });
          chrome.alarms.create("pomodoro", { when: now + WORK });

        } else {
          const d = st.phase === "break" ? BREAK : LONG;
          chrome.storage.local.set({
            phase: st.phase,
            endTime: now + d,
            pausedTime: null
          });
          chrome.alarms.create("pomodoro", { when: now + d });
        }
      }

      chrome.notifications.clear(id);
    });
  });
});
