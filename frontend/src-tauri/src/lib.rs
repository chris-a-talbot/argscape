use std::process::{Command, Child};
use std::thread;
use std::time::Duration;

static mut BACKEND_PROCESS: Option<Child> = None;

fn start_backend() -> Result<(), Box<dyn std::error::Error>> {
    // Check if backend is already running on port 8000
    if port_check::is_port_reachable("127.0.0.1:8000") {
        println!("Backend already running on port 8000");
        return Ok(());
    }

    println!("Starting Python backend...");
    
    // Try to find Python executable
    let python_cmd = if cfg!(windows) {
        "python"
    } else {
        "python3"
    };

    // Start the FastAPI backend from the correct directory
    let backend_process = Command::new(python_cmd)
        .args(&["-c", "
import sys
import os
# We're running from frontend directory, need to go up one level to find backend
current_dir = os.getcwd()
project_root = os.path.dirname(current_dir)
backend_path = os.path.join(project_root, 'backend')
print(f'Looking for backend at: {backend_path}')
if not os.path.exists(backend_path):
    raise FileNotFoundError(f'Backend directory not found at {backend_path}')
sys.path.append(backend_path)
os.chdir(backend_path)
import uvicorn
from main import app
uvicorn.run(app, host='127.0.0.1', port=8000, log_level='info')
        "])
        .spawn()?;

    unsafe {
        BACKEND_PROCESS = Some(backend_process);
    }

    // Wait a moment for the backend to start
    thread::sleep(Duration::from_secs(3));

    // Verify backend is running
    for _i in 0..10 {
        if port_check::is_port_reachable("127.0.0.1:8000") {
            println!("Backend started successfully!");
            return Ok(());
        }
        thread::sleep(Duration::from_millis(500));
    }

    Err("Failed to start backend server".into())
}

fn stop_backend() {
    unsafe {
        if let Some(mut process) = BACKEND_PROCESS.take() {
            let _ = process.kill();
            println!("Backend process terminated");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Start the backend in a separate thread
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                match start_backend() {
                    Ok(_) => {
                        println!("✅ ARGscape backend is ready!");
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to start backend: {}", e);
                        app_handle.exit(1);
                    }
                }
            });

            Ok(())
        })
        .on_window_event(|_window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Clean up backend when window closes
                stop_backend();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
