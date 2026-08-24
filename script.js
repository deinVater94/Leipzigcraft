const LAUNCHER_PATH = "downloads/LeipzigCraft-Launcher.exe";

const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");

    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.textContent = isOpen ? "✕" : "☰";
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.textContent = "☰";
    });
  });
}

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

const downloadButtons = document.querySelectorAll(".launcher-download");
const launcherStatus = document.getElementById("launcher-status");
const launcherStatusText = document.getElementById("launcher-status-text");
const downloadPanelNote = document.getElementById("download-panel-note");

function blockUnavailableDownload(event) {
  event.preventDefault();

  if (!launcherStatus) {
    return;
  }

  launcherStatus.classList.remove("launcher-status-pulse");

  // Reflow absichtlich nur bei Klick, damit die kleine Animation neu startet.
  void launcherStatus.offsetWidth;

  launcherStatus.classList.add("launcher-status-pulse");
}

function setLauncherUnavailable() {
  downloadButtons.forEach((button) => {
    button.classList.add("is-disabled");
    button.setAttribute("aria-disabled", "true");
    button.removeAttribute("download");

    button.removeEventListener("click", blockUnavailableDownload);
    button.addEventListener("click", blockUnavailableDownload);

    if (button.classList.contains("inline-download")) {
      button.textContent = "Launcher noch in Arbeit";
    } else if (button.classList.contains("header-download")) {
      button.textContent = "Launcher noch in Arbeit";
    } else {
      button.textContent = "⏳ Launcher noch in Arbeit";
    }
  });

  if (launcherStatus) {
    launcherStatus.classList.remove("is-online");
    launcherStatus.classList.add("is-offline");
  }

  if (launcherStatusText) {
    launcherStatusText.textContent =
      "Launcher befindet sich aktuell noch in Arbeit.";
  }

  if (downloadPanelNote) {
    downloadPanelNote.textContent =
      "Sobald die Datei LeipzigCraft-Launcher.exe hochgeladen wurde, aktiviert sich der Download automatisch.";
  }
}

function setLauncherAvailable() {
  downloadButtons.forEach((button) => {
    button.classList.remove("is-disabled");
    button.setAttribute("aria-disabled", "false");
    button.setAttribute("href", LAUNCHER_PATH);
    button.setAttribute("download", "");

    button.removeEventListener("click", blockUnavailableDownload);

    if (button.classList.contains("inline-download")) {
      button.textContent = "Download starten →";
    } else if (button.classList.contains("header-download")) {
      button.textContent = "Launcher laden";
    } else {
      button.textContent = "⬇ Windows Launcher herunterladen";
    }
  });

  if (launcherStatus) {
    launcherStatus.classList.remove("is-offline");
    launcherStatus.classList.add("is-online");
  }

  if (launcherStatusText) {
    launcherStatusText.textContent =
      "Launcher ist verfügbar und kann heruntergeladen werden.";
  }

  if (downloadPanelNote) {
    downloadPanelNote.textContent =
      "Windows 10 / 11 · Direkter Download";
  }
}

async function launcherExists() {
  /*
    Nur eine einzige kleine HEAD-Anfrage beim Laden der Seite.
    Die EXE selbst wird dabei NICHT heruntergeladen.
    Das ist sehr ressourcenschonend.
  */
  try {
    const response = await fetch(
      `${LAUNCHER_PATH}?availability-check=${Date.now()}`,
      {
        method: "HEAD",
        cache: "no-store"
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

async function initializeLauncherDownload() {
  const available = await launcherExists();

  if (available) {
    setLauncherAvailable();
  } else {
    setLauncherUnavailable();
  }
}

initializeLauncherDownload();
