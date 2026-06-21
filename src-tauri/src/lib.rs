use tauri::{AppHandle, Emitter, Manager};
use std::process::{Command, Stdio};
use std::io::{BufRead, BufReader};
use std::thread;
use serde::Serialize;
use regex::Regex;
use std::sync::atomic::{AtomicU32, Ordering};

struct AppState {
    current_pid: AtomicU32,
}

#[derive(Clone, Serialize)]
struct DownloadEvent {
    #[serde(rename = "type")]
    event_type: String, // "log", "progress", "done", "error"
    text: String,
    percentage: Option<f64>,
}

#[tauri::command]
fn download_media(app: AppHandle, url: String, format: String) -> Result<(), String> {
    // Resolve yt-dlp path depending on OS
    let binary_name = if cfg!(target_os = "windows") {
        "bin/yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "bin/yt-dlp_macos"
    } else {
        "bin/yt-dlp_linux"
    };

    let ffmpeg_name = if cfg!(target_os = "windows") {
        "bin/ffmpeg.exe"
    } else if cfg!(target_os = "macos") {
        "bin/ffmpeg_macos"
    } else {
        "bin/ffmpeg_linux"
    };

    let yt_dlp_path = app
        .path()
        .resolve(binary_name, tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve yt-dlp path: {}", e))?;

    let ffmpeg_path = app
        .path()
        .resolve(ffmpeg_name, tauri::path::BaseDirectory::Resource)
        .map_err(|e| format!("Failed to resolve ffmpeg path: {}", e))?;

    if !yt_dlp_path.exists() {
        return Err(format!("yt-dlp executable not found at {}. Please add it.", yt_dlp_path.display()));
    }
    
    if !ffmpeg_path.exists() {
        return Err(format!("ffmpeg executable not found at {}. Please add it.", ffmpeg_path.display()));
    }

    // Determine download path
    let download_dir = app
        .path()
        .download_dir()
        .map_err(|e| format!("Failed to get download directory: {}", e))?;

    let app_clone = app.clone();
    let ffmpeg_path_str = ffmpeg_path.to_string_lossy().to_string();
    
    thread::spawn(move || {
        let mut args = vec![
            "--no-playlist",
            "--newline",
            "--ffmpeg-location",
            &ffmpeg_path_str,
            "-o",
            "%(title)s.%(ext)s",
            "-P",
            download_dir.to_str().unwrap_or("."),
        ];

        if format == "audio" {
            args.extend(&["-x", "--audio-format", "mp3", "--audio-quality", "0"]);
        } else {
            args.extend(&["-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"]);
        }
        
        args.push(&url);

        let mut child = match Command::new(&yt_dlp_path)
            .args(&args)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
        {
            Ok(c) => c,
            Err(e) => {
                let _ = app_clone.emit("download-event", DownloadEvent {
                    event_type: "error".into(),
                    text: format!("Failed to start yt-dlp: {}", e),
                    percentage: None,
                });
                return;
            }
        };

        app_clone.state::<AppState>().current_pid.store(child.id(), Ordering::SeqCst);

        let stdout = child.stdout.take().unwrap();
        let stderr = child.stderr.take().unwrap();
        
        let app_clone_err = app_clone.clone();
        thread::spawn(move || {
            let reader = BufReader::new(stderr);
            for line in reader.lines() {
                if let Ok(line) = line {
                    let _ = app_clone_err.emit("download-event", DownloadEvent {
                        event_type: "log".into(),
                        text: format!("STDERR: {}", line),
                        percentage: None,
                    });
                }
            }
        });

        let reader = BufReader::new(stdout);
        let progress_regex = Regex::new(r"\[download\]\s+([\d\.]+)%").unwrap();

        for line in reader.lines() {
            if let Ok(line) = line {
                let mut percentage = None;
                if let Some(caps) = progress_regex.captures(&line) {
                    if let Ok(p) = caps[1].parse::<f64>() {
                        percentage = Some(p);
                    }
                }

                let event_type = if percentage.is_some() { "progress" } else { "log" };
                
                let _ = app_clone.emit("download-event", DownloadEvent {
                    event_type: event_type.into(),
                    text: line,
                    percentage,
                });
            }
        }

        let status = child.wait().unwrap();
        app_clone.state::<AppState>().current_pid.store(0, Ordering::SeqCst);

        if status.success() {
            let _ = app_clone.emit("download-event", DownloadEvent {
                event_type: "done".into(),
                text: "Download completed successfully.".into(),
                percentage: Some(100.0),
            });
        } else {
            let _ = app_clone.emit("download-event", DownloadEvent {
                event_type: "error".into(),
                text: "Download failed or finished with errors (o fue cancelada).".into(),
                percentage: None,
            });
        }
    });

    Ok(())
}

#[tauri::command]
fn cancel_download(state: tauri::State<'_, AppState>) {
    let pid = state.current_pid.load(Ordering::SeqCst);
    if pid > 0 {
        #[cfg(target_os = "windows")]
        let _ = Command::new("taskkill").args(["/F", "/T", "/PID", &pid.to_string()]).spawn();
        
        #[cfg(not(target_os = "windows"))]
        {
            // Mata el proceso principal
            let _ = Command::new("kill").args(["-9", &pid.to_string()]).spawn();
            
            // Fallback agresivo: mata yt-dlp y ffmpeg por nombre para evitar procesos huérfanos (hijos)
            let _ = Command::new("killall").args(["-9", "yt-dlp_macos"]).spawn();
            let _ = Command::new("killall").args(["-9", "yt-dlp_linux"]).spawn();
            let _ = Command::new("killall").args(["-9", "yt-dlp"]).spawn();
            let _ = Command::new("killall").args(["-9", "ffmpeg_macos"]).spawn();
            let _ = Command::new("killall").args(["-9", "ffmpeg_linux"]).spawn();
            let _ = Command::new("killall").args(["-9", "ffmpeg"]).spawn();
        }
    }
}

#[tauri::command]
fn open_download_folder(app: AppHandle) {
    if let Ok(download_dir) = app.path().download_dir() {
        #[cfg(target_os = "windows")]
        let _ = Command::new("explorer").arg(&download_dir).spawn();
        
        #[cfg(target_os = "macos")]
        let _ = Command::new("open").arg(&download_dir).spawn();
        
        #[cfg(target_os = "linux")]
        let _ = Command::new("xdg-open").arg(&download_dir).spawn();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      app.manage(AppState { current_pid: AtomicU32::new(0) });
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![download_media, cancel_download, open_download_folder])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
