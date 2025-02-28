import { ChiptuneJsPlayer as chiptune3 } from "https://DrSnuggles.github.io/chiptune/chiptune3.js";
import { dnd } from "https://DrSnuggles.github.io/chiptune/dnd.js";

// pick elements
const play = document.getElementById("play");
const url = document.getElementById("url");
const mainPage = document.getElementById("mainPage");
const modInfo = document.getElementById("modInfo");
const modTitle = document.getElementById("modTitle");
const modType = document.getElementById("modType");
const modTracker = document.getElementById("modTracker");
const modLength = document.getElementById("modLength");
const modInst = document.getElementById("modInst");
const modSamples = document.getElementById("modSamples");
const modProgress = document.getElementById("modProgress");
const audioModal = document.getElementById("audioModal");

// pick URLs
const modulePage1 = "modarchive.org/index.php?request=view_by_moduleid"
const modulePage2 = "modarchive.org/index.php?request=view_player"
const modulePage3 = "modarchive.org/module.php"
const apiDownload = "https://api.modarchive.org/downloads.php?moduleid="

function firstSteps() {
  mainPage.classList.add("md:h-96");
  mainPage.classList.remove("hidden");
  modInfo.classList.add("hidden");
}

function showElements() {
  mainPage.classList.remove("md:h-96");
  modInfo.classList.remove("hidden");
}

// stackoverflow hack #1 to round time
function fmtMSS(seconds) {
  return(seconds - (seconds %= 60)) / 60 + (9 < seconds ? ":" : ":0") + seconds
}

// stackoverflow hack #2 to round time
Number.prototype.round = function () {
  return Math.round(this);
}

// error handling
function alertError(error) {
  alert(`Error: ${error}`);
  firstSteps();
  return;
}

// stupid no audio till user interaction policy thingy
function userInteracted() {
  removeEventListener("keydown", userInteracted)
  removeEventListener("click", userInteracted)
  removeEventListener("touchstart", userInteracted)
  firstSteps();

  // animate modal
  audioModal.classList.add("fadeOut");
  setInterval(() => {
    audioModal.classList.remove("w-screen", "h-screen");
  }, 500);

  // initialize library
  window.chiplib = new chiptune3();

  async function loadModule(url) {
    // check if the URL is a ModArchive page instead of a direct link
    if (url.includes(modulePage1 || modulePage2 || modulePage3)) {
      const id = url.match(/(\d+)$/);
      await chiplib.load(`${apiDownload}${id[0]}`);
      return;
    } else {
      // check if the URL is a direct link to a module, instead a ModArchive module ID
      if (isNaN(url) === true) {
        await chiplib.load(url);
        return;
      } else {
        // assume that it is a ModArchive module ID
        await chiplib.load(`${apiDownload}${url}`);
        return;
      };
    };
  };

  chiplib.onInitialized(() => {
    // avoid looping
    chiplib.setRepeatCount(0);
    // drag and drop
    dnd(window, (file) => {
      showElements();
      chiplib.play(file);
    });
  })

  chiplib.onEnded(() => {
    firstSteps();
    chiplib.stop();
  });

  // error handling
  chiplib.onError((err) => {
    if (err.type === "ptr") {
      alertError("Unknown error, but it's probably a bad URL or ID.");
    } else {
      alertError(err.type);
    };
    chiplib.stop();
  });

  // metadata
  chiplib.onMetadata(async (meta) => {
    modTitle.innerText = meta.title || "Untitled";
    modType.innerText = meta.type.toUpperCase() || "Unknown";
    modTracker.innerText = meta.tracker || "Unknown";
    modLength.innerText = fmtMSS(meta.dur.round()) || "0:00";
    modProgress.max = Number(meta.dur.round());
    modInst.innerText = meta.song.instruments["length"];
    modSamples.innerText = meta.song.samples["length"];
  });

  let lastUpdate = 0;
  chiplib.onProgress(async (pos) => {
    const now = Date.now();
    if (now - lastUpdate > 2500) {
      modProgress.value = Number(pos.pos.round());
      lastUpdate = now;
    };
  });

  play.addEventListener("click", () => {
    // check if the URL input is empty
    if (url.value === "") {
      alertError("Please enter a URL!");
      return;
    } else {
      showElements();
      loadModule(url.value);
    };
  });
};

addEventListener("keydown", userInteracted);
addEventListener("click", userInteracted);
addEventListener("touchstart", userInteracted);