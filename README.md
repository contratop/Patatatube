<!-- Header Image Placeholder (21:9 ratio) -->
<p align="center">
  <img src="https://github.com/contratop/Patatatube/blob/main/media/banner.PNG?raw=true" alt="PatataTube" width="100%">
</p>

<h1 align="center">🥔 PatataTube</h1>

<p align="center">
  <strong>El descargador de contenido multimedia definitivo: minimalista, nativo y ridículamente rápido.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-2.0-FFC131?style=for-the-badge&logo=tauri&logoColor=white" alt="Tauri">
  <img src="https://img.shields.io/badge/Rust-000000?style=for-the-badge&logo=rust&logoColor=white" alt="Rust">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/Multiplatform-Windows%20|%20Mac%20|%20Linux-blue?style=for-the-badge" alt="Multiplatform">
</p>

---

## ✨ Características

PatataTube no es solo otro wrapper de `yt-dlp`. Está diseñado para ofrecer una **experiencia de usuario (UX) impecable**, simple y cómoda.

- 🎧 **Audio & Vídeo en Máxima Calidad:** Descarga en formato `.mp3` o `.mp4` con un solo clic. La app busca la mayor calidad disponible por ti.
- 🎨 **Elige tu estilo:** Personaliza la interfaz en cualquier momento. Incluye Modo Oscuro 🌙, Modo Claro ☀️ y el exclusivo Modo Poke 💖.
- ⚡ **Sin dependencias para el usuario:** Incluye de fabrica los binarios estáticos de `yt-dlp` y `ffmpeg` para **Windows, macOS y Linux**. Tu solo tienes que hacer doble clic y usar la app.
- 🛑 **Stop de Emergencia (Kill Switch):** Aborta cualquier descarga instantaneamente gracias a la aniquilación directa de sub-procesos en el sistema operativo.
- 📁 **Navegación Nativa:** Abre la carpeta de descargas directamente en tu explorador de archivos nativo (Finder, Explorer, o gestores de Linux) una vez se finalice la descarga.
- 🖥️ **Consola Debug:** Abre la terminal para ver el progreso real y la salida de `yt-dlp`, todo en vivo.
- 🚫 **Protección Anti-Playlists:** Descargas garantizadas de un solo elemento (`--no-playlist`) para evitar descargas accidentales masivas.

## 🚀 Instalación y Desarrollo

Al estar construido sobre [Tauri v2](https://v2.tauri.app/), el rendimiento es nativo y el peso de la aplicación es ínfimo.

### 📋 Prerrequisitos

Necesitarás tener instalados:

- [Node.js](https://nodejs.org/) (v16+)
- [Rust](https://www.rust-lang.org/tools/install)

### 📥 Descargas (Compilados Oficiales)

¿No quieres pelear con compiladores o código fuente?
Hemos preparado las **versiones compiladas listas para usar** para Windows, macOS y Linux. ¡Ahorrate complicaciones!

Ve directamente a la pestaña de [**Releases**](https://github.com/tu-usuario/PatataTube/releases/latest) aquí en GitHub y descarga la última versión mágica instalable (`.exe`, `.dmg`, `.AppImage`, etc.). ¡Doble clic y a descargar!

### 🛠️ Levantar el Entorno (Para Desarrolladores)

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/tu-usuario/PatataTube.git
   cd PatataTube
   ```

2. **Instala las dependencias web:**

   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo:**
   _(Esto compilará el backend en Rust y lanzará la ventana de Tauri)_
   ```bash
   npm run tauri dev
   ```

### 📦 Compilación para Producción

Para generar los instaladores finales (`.exe`, `.dmg`, `.AppImage`, `.deb`):

```bash
npm run tauri build
```

Los archivos finales se generarán mágicamente en la ruta `src-tauri/target/release/bundle/`.

## 🧠 Arquitectura

- **Frontend:** HTML5, CSS3 Vanilla (cero frameworks inflados, animaciones ultra-optimizadas) y Vanilla JavaScript.
- **Backend:** Rust puro.
- **Core Logic:** Ejecución paralela en hilos de Rust que capturan y parsean el `stdout`/`stderr` de los binarios estáticos de `yt-dlp` y los emiten de vuelta al frontend usando eventos de Tauri en tiempo real.

---

## Nota

La rama MobileVer esta abandonada, es un proyecto experimental que no se piensa continuar.
Se recomienda mantenerse en la rama Main

<p align="center">
  Desarrollado con 💖 y muchas 🥔
</p>
