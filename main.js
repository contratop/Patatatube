const themeToggleBtn = document.getElementById('theme-toggle');
const htmlEl = document.documentElement;

const themes = ['dark', 'light', 'pink'];
const themeNames = {
  'dark': 'Modo oscuro',
  'light': 'Modo claro',
  'pink': 'Modo poke'
};
let currentThemeIndex = 0; // Starts at dark

const heartIcon = document.querySelector('.theme-icon.heart');
const moonIcon = document.querySelector('.theme-icon.moon');
const sunIcon = document.querySelector('.theme-icon.sun');
const themeToast = document.getElementById('theme-toast');
let toastTimeout;

function updateThemeIcon() {
  const theme = themes[currentThemeIndex];
  
  // Hide all icons
  heartIcon.style.display = 'none';
  moonIcon.style.display = 'none';
  sunIcon.style.display = 'none';
  
  // Show the relevant icon for the current theme
  if (theme === 'pink') {
    heartIcon.style.display = 'block';
  } else if (theme === 'dark') {
    moonIcon.style.display = 'block';
  } else if (theme === 'light') {
    sunIcon.style.display = 'block';
  }
}

// Easter Egg Logic
const creditsOverlay = document.getElementById('credits-overlay');
let themePressTimer;
let isLongPress = false;

function startThemePress(e) {
  isLongPress = false;
  themePressTimer = setTimeout(() => {
    isLongPress = true;
    creditsOverlay.classList.add('active');
  }, 1500); // 1.5 seconds hold
}

function cancelThemePress() {
  clearTimeout(themePressTimer);
}

themeToggleBtn.addEventListener('mousedown', startThemePress);
themeToggleBtn.addEventListener('touchstart', startThemePress, {passive: true});

themeToggleBtn.addEventListener('mouseup', cancelThemePress);
themeToggleBtn.addEventListener('mouseleave', cancelThemePress);
themeToggleBtn.addEventListener('touchend', cancelThemePress);

creditsOverlay.addEventListener('click', () => {
  creditsOverlay.classList.remove('active');
});

themeToggleBtn.addEventListener('click', () => {
  if (isLongPress) return; // Prevent theme toggle if the user held the button for the easter egg
  
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const newTheme = themes[currentThemeIndex];
  htmlEl.setAttribute('data-theme', newTheme);

  // Update Icons
  heartIcon.style.display = newTheme === 'pink' ? 'block' : 'none';
  moonIcon.style.display = newTheme === 'dark' ? 'block' : 'none';
  sunIcon.style.display = newTheme === 'light' ? 'block' : 'none';

  // Show Toast
  themeToast.textContent = themeNames[newTheme];
  themeToast.classList.add('show');
  
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    themeToast.classList.remove('show');
  }, 1200);
});

// Initialize
updateThemeIcon();

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// Debug Console Toggle
const terminalToggleBtn = document.getElementById('terminal-toggle');
const debugConsole = document.getElementById('debug-console');
const debugOutput = document.getElementById('debug-output');

terminalToggleBtn.addEventListener('click', () => {
  if (debugConsole.style.display === 'none') {
    debugConsole.style.display = 'block';
  } else {
    debugConsole.style.display = 'none';
  }
});

// Download Logic
const urlInput = document.getElementById('url-input');
const audioBtn = document.getElementById('audio-btn');
const playBtn = document.getElementById('play-btn'); // video button
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const stopBtn = document.getElementById('stop-btn');
const folderBtn = document.getElementById('folder-btn');

let isDownloading = false;

function setButtonsState(disabled) {
  audioBtn.disabled = disabled;
  playBtn.disabled = disabled;
  if (disabled) {
    audioBtn.classList.add('disabled');
    playBtn.classList.add('disabled');
  } else {
    audioBtn.classList.remove('disabled');
    playBtn.classList.remove('disabled');
  }
}

function updateProgress(percentage, state = 'downloading') {
  progressFill.className = 'progress-bar-fill'; // reset classes
  
  if (state === 'init') {
    progressFill.classList.add('loading');
    progressFill.style.width = '100%';
    progressText.textContent = 'Preparando...';
  } else if (state === 'processing') {
    progressFill.classList.add('processing');
    progressFill.style.width = '100%';
    progressText.textContent = 'Procesando...';
  } else if (state === 'done') {
    progressFill.style.width = '100%';
    progressText.textContent = '¡Completado!';
  } else {
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}%`;
    if (percentage >= 100) {
      progressFill.classList.add('processing');
      progressText.textContent = 'Procesando...';
    }
  }
}

function appendLog(text) {
  debugOutput.textContent += text + '\n';
  debugConsole.scrollTop = debugConsole.scrollHeight;
}

async function startDownload(format) {
  if (isDownloading) return;
  const url = urlInput.value.trim();
  if (!url) {
    progressFill.style.width = '0%';
    progressText.textContent = '⚠️ Pon un enlace primero';
    setTimeout(() => {
      if (!isDownloading) {
        progressText.textContent = '0%';
      }
    }, 2500);
    return;
  }

  isDownloading = true;
  setButtonsState(true);
  stopBtn.style.display = 'flex';
  folderBtn.style.display = 'none';

  // Reset UI
  updateProgress(0, 'init');
  debugOutput.textContent = '';
  
  try {
    appendLog(`Starting download for: ${url} (Format: ${format})`);
    await invoke('download_media', { url, format });
  } catch (error) {
    appendLog(`Error: ${error}`);
    updateProgress(0, 'downloading');
    progressText.textContent = 'Error';
    isDownloading = false;
    setButtonsState(false);
    stopBtn.style.display = 'none';
  }
}

audioBtn.addEventListener('click', () => startDownload('audio'));
playBtn.addEventListener('click', () => startDownload('video'));

stopBtn.addEventListener('click', async () => {
  appendLog('Cancelando descarga...');
  await invoke('cancel_download');
});

folderBtn.addEventListener('click', async () => {
  await invoke('open_download_folder');
});

// Listen for progress events from Rust
listen('download-event', (event) => {
  const data = event.payload;
  
  if (data.type === 'log') {
    appendLog(data.text);
  } else if (data.type === 'progress') {
    appendLog(data.text);
    if (data.percentage !== null && data.percentage !== undefined) {
      updateProgress(data.percentage, 'downloading');
    }
  } else if (data.type === 'done') {
    appendLog('Download completed!');
    updateProgress(100, 'done');
    isDownloading = false;
    setButtonsState(false);
    stopBtn.style.display = 'none';
    folderBtn.style.display = 'flex';
  } else if (data.type === 'error') {
    appendLog(`Error: ${data.text}`);
    updateProgress(0, 'downloading');
    progressText.textContent = data.text.includes('cancelada') ? 'Cancelado' : 'Error';
    isDownloading = false;
    setButtonsState(false);
    stopBtn.style.display = 'none';
  }
});

// Disable right-click context menu to make it feel like a native app
document.addEventListener('contextmenu', event => {
  // Allow right click only on input fields if needed, or disable globally.
  // We disable it globally except for the url input to allow paste via right-click
  if (event.target.tagName !== 'INPUT') {
    event.preventDefault();
  }
});

