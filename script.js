const LAUNCHER_PATH = "downloads/LeipzigCraft-Launcher.exe";
const MANUAL_PACKS = {
  performance: {
    path: "https://github.com/deinVater94/Leipzigcraft/releases/download/manual-v1.0/LeipzigCraft-Manuell-Performance.zip",
    readyText: "⬇ Performance herunterladen",
    missingText: "Performance folgt"
  },
  "high-quality": {
    path: "https://github.com/deinVater94/Leipzigcraft/releases/download/manual-v1.0/LeipzigCraft-Manuell-HighQuality.zip",
    readyText: "⬇ High Quality herunterladen",
    missingText: "High Quality folgt"
  }
};
const DISCORD_URL = "https://discord.gg/8r9J8AR6aV";
const SERVER_ADDRESS = "185.9.104.131:10100";

/* ===== Mobile Navigation ===== */

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

/* ===== Footer Year ===== */

const year = document.getElementById("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

/* ===== Launcher availability ===== */

const downloadButtons = document.querySelectorAll(".launcher-download");
const launcherStatus = document.getElementById("launcher-status");
const launcherStatusText = document.getElementById("launcher-status-text");
const downloadPanelNote = document.getElementById("download-panel-note");

function blockUnavailableDownload(event) {
  event.preventDefault();

  if (!launcherStatus) return;

  launcherStatus.classList.remove("launcher-status-pulse");
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



/* ===== Discord links ===== */

document.querySelectorAll("[data-discord-link]").forEach((link) => {
  link.setAttribute("href", DISCORD_URL);
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener noreferrer");
});

/* ===== Optional website videos ===== */

document.querySelectorAll("[data-video-shell]").forEach((shell) => {
  const video = shell.querySelector("video");
  if (!video) return;

  // Muted autoplay is allowed by modern browsers.
  // Keep controls enabled so visitors can unmute manually.
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.playsInline = true;

  video.setAttribute("muted", "");
  video.setAttribute("autoplay", "");
  video.setAttribute("playsinline", "");

  const markReady = () => shell.classList.add("has-video");

  const tryAutoplay = () => {
    video.muted = true;
    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Browser policy or unavailable video: controls remain usable.
      });
    }
  };

  if (video.readyState >= 1) {
    markReady();
  } else {
    video.addEventListener("loadedmetadata", markReady, { once: true });
  }

  if (video.readyState >= 2) {
    tryAutoplay();
  } else {
    video.addEventListener("canplay", tryAutoplay, { once: true });
  }
});

/* ===== Manual modpack downloads ===== */

const manualPackButtons = document.querySelectorAll(".manual-pack-download[data-manual-pack]");

function setManualPackState(button, pack, available) {
  if (available) {
    button.classList.remove("is-disabled");
    button.setAttribute("aria-disabled", "false");
    button.setAttribute("href", pack.path);
    button.setAttribute("download", "");
    button.textContent = pack.readyText;
    return;
  }

  button.classList.add("is-disabled");
  button.setAttribute("aria-disabled", "true");
  button.removeAttribute("download");
  button.textContent = pack.missingText;
}

function initializeManualPackDownloads() {
  if (!manualPackButtons.length) return;

  manualPackButtons.forEach((button) => {
    const key = button.dataset.manualPack;
    const pack = MANUAL_PACKS[key];
    if (!pack) return;

    // GitHub Release assets are cross-origin. A browser HEAD/CORS check can
    // incorrectly report them as unavailable, so published release URLs are
    // enabled directly.
    setManualPackState(button, pack, true);
    button.removeAttribute("download");
    button.setAttribute("target", "_blank");
    button.setAttribute("rel", "noopener noreferrer");
  });
}

initializeManualPackDownloads();

/* ===== Copy server IP ===== */

document.querySelectorAll("[data-copy-server]").forEach((button) => {
  button.addEventListener("click", async () => {
    const previous = button.textContent;

    try {
      await navigator.clipboard.writeText(SERVER_ADDRESS);
      button.textContent = "Kopiert ✓";
    } catch {
      button.textContent = SERVER_ADDRESS;
    }

    window.setTimeout(() => {
      button.textContent = previous;
    }, 1600);
  });
});


/* ===== Robust, seamless marquee ===== */

const marqueeTrack = document.getElementById("lc-marquee-track");
const marqueeSource = document.getElementById("lc-marquee-source");

let marqueeAnimation = null;
let marqueeResizeTimer = null;

function buildMarquee() {
  if (!marqueeTrack || !marqueeSource) return;

  if (marqueeAnimation) {
    marqueeAnimation.cancel();
    marqueeAnimation = null;
  }

  marqueeTrack
    .querySelectorAll(".lc-marquee-group-clone")
    .forEach((clone) => clone.remove());

  /*
    Wir klonen die Gruppe so oft, bis mindestens mehrere Bildschirmbreiten
    gefüllt sind. Dadurch gibt es selbst auf sehr breiten Monitoren keine Lücke.
  */
  const viewportWidth = window.innerWidth;
  const sourceWidth = marqueeSource.getBoundingClientRect().width;

  if (!sourceWidth) return;

  const neededCopies = Math.max(
    2,
    Math.ceil((viewportWidth * 2.5) / sourceWidth)
  );

  for (let i = 0; i < neededCopies; i++) {
    const clone = marqueeSource.cloneNode(true);
    clone.removeAttribute("id");
    clone.classList.add("lc-marquee-group-clone");
    clone.setAttribute("aria-hidden", "true");
    marqueeTrack.appendChild(clone);
  }

  /*
    Exakt die Breite EINER Gruppe bewegen.
    Beim Ende liegt die nächste identische Gruppe pixelgenau an derselben Stelle.
    Deshalb gibt es keinen sichtbaren Sprung.
  */
  marqueeAnimation = marqueeTrack.animate(
    [
      { transform: "translate3d(0, 0, 0)" },
      { transform: `translate3d(-${sourceWidth}px, 0, 0)` }
    ],
    {
      duration: 15000,
      iterations: Infinity,
      easing: "linear"
    }
  );

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    marqueeAnimation.pause();
  }
}

buildMarquee();

window.addEventListener("resize", () => {
  clearTimeout(marqueeResizeTimer);

  marqueeResizeTimer = setTimeout(() => {
    buildMarquee();
  }, 180);
});
