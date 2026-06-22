import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const urlInput = document.getElementById('url-input');
const audioBtn = document.getElementById('audio-btn');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const folderBtn = document.getElementById('folder-btn');
const progressCard = document.getElementById('progress-card');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

let isDownloading = false;

// Theme logic
const themeToggle = document.getElementById('theme-toggle');
const themeToast = document.getElementById('theme-toast');
const themes = ["dark", "light", "poke"];
const themeNames = ["Modo oscuro", "Modo claro", "Modo poke"];
let themeIndex = 0;

themeToggle.addEventListener('click', () => {
  themeIndex = (themeIndex + 1) % themes.length;
  const newTheme = themes[themeIndex];
  
  document.documentElement.setAttribute('data-theme', newTheme);
  document.body.className = newTheme === "poke" ? "theme-poke" : "";
  
  // Show specific SVG icon inside the button
  document.querySelectorAll('.theme-icon').forEach(icon => icon.style.display = 'none');
  if (newTheme === "dark") document.querySelector('.theme-icon.moon').style.display = 'block';
  else if (newTheme === "light") document.querySelector('.theme-icon.sun').style.display = 'block';
  else document.querySelector('.theme-icon.heart').style.display = 'block';

  // Show Toast
  themeToast.textContent = themeNames[themeIndex];
  themeToast.style.opacity = '1';
  themeToast.style.transform = 'translateX(0)';
  
  if (window.themeTimeout) clearTimeout(window.themeTimeout);
  window.themeTimeout = setTimeout(() => {
    themeToast.style.opacity = '0';
    themeToast.style.transform = 'translateX(10px)';
  }, 1500);
});

function setButtonsState(disabled) {
  audioBtn.disabled = disabled;
  playBtn.disabled = disabled;
  urlInput.disabled = disabled;
}

async function startDownload(format) {
  if (isDownloading) return;
  const url = urlInput.value.trim();
  if (!url) {
    progressCard.style.display = 'flex';
    progressFill.style.width = '0%';
    progressText.textContent = '⚠️ Pon un enlace primero';
    setTimeout(() => {
      if (!isDownloading) {
        progressCard.style.display = 'none';
        progressText.textContent = '0%';
      }
    }, 2500);
    return;
  }

  isDownloading = true;
  setButtonsState(true);
  
  progressCard.style.display = 'flex';
  stopBtn.style.display = 'flex';
  folderBtn.style.display = 'none';
  progressFill.style.width = '0%';
  progressText.textContent = '0% - Preparando...';

  try {
    // In Android this will call the rusty_ytdl implementation
    await invoke('download_media', { url, format });
  } catch (error) {
    console.error('Error on start:', error);
    progressText.textContent = 'Error: ' + error;
    resetState();
  }
}

function resetState() {
  isDownloading = false;
  setButtonsState(false);
  stopBtn.style.display = 'none';
}

audioBtn.addEventListener('click', () => startDownload('audio'));
playBtn.addEventListener('click', () => startDownload('video'));

stopBtn.addEventListener('click', async () => {
  if (isDownloading) {
    try {
      await invoke('cancel_download');
      progressText.textContent = 'Cancelado';
      progressFill.style.width = '0%';
      resetState();
    } catch (error) {
      console.error(error);
    }
  }
});

folderBtn.addEventListener('click', async () => {
  try {
    await invoke('open_download_folder');
  } catch (error) {
    console.error(error);
  }
});

// Setup global listener for rusty_ytdl events from rust
listen('download-progress', (event) => {
  if (!isDownloading) return;
  
  const payload = event.payload || {};
  let text = payload.text || '';
  
  progressText.textContent = text;
  
  // Try parsing percentage for progress bar
  const match = text.match(/([\d.]+)%/);
  if (match && match[1]) {
    progressFill.style.width = `${match[1]}%`;
  }

  // Check if finished (rusty_ytdl will need to send a finish signal)
  if (payload.finished || text.includes('100% - Completado')) {
    progressFill.style.width = '100%';
    progressText.textContent = '¡Completado!';
    stopBtn.style.display = 'none';
    folderBtn.style.display = 'flex';
    isDownloading = false;
    setButtonsState(false);
  }
});
