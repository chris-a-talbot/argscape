use std::thread;
use std::time::Duration;
use std::sync::Mutex;
use tauri_plugin_shell::process::CommandChild;

static BACKEND_PROCESS: Mutex<Option<CommandChild>> = Mutex::new(None);

fn start_backend(app_handle: tauri::AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Check if backend is already running on port 8000
    if port_check::is_port_reachable("127.0.0.1:8000") {
        println!("Backend already running on port 8000");
        return Ok(());
    }

    println!("Starting ARGscape backend...");
    
    // Get the sidecar command using the shell plugin
    let sidecar = tauri_plugin_shell::ShellExt::shell(&app_handle)
        .sidecar("argscape-backend")?;
    
    // Start the backend sidecar
    let (_rx, backend_process) = sidecar.spawn()?;

    // Store the process safely
    if let Ok(mut process_guard) = BACKEND_PROCESS.lock() {
        *process_guard = Some(backend_process);
    }

    // Wait a moment for the backend to start
    thread::sleep(Duration::from_secs(3));

    // Verify backend is running
    for _i in 0..10 {
        if port_check::is_port_reachable("127.0.0.1:8000") {
            println!("✅ ARGscape backend is ready!");
            return Ok(());
        }
        thread::sleep(Duration::from_millis(500));
    }

    Err("Failed to start backend server".into())
}

fn stop_backend() {
    if let Ok(mut process_guard) = BACKEND_PROCESS.lock() {
        if let Some(mut process) = process_guard.take() {
            let _ = process.kill();
            println!("Backend process terminated");
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Start the backend in a separate thread
            let app_handle = app.handle().clone();
            thread::spawn(move || {
                match start_backend(app_handle.clone()) {
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
