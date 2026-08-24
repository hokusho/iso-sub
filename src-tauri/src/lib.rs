use std::process::Command;

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

      // Automatically launch internal backend server sidecar in production
      std::thread::spawn(|| {
        let exe_dir = std::env::current_exe()
          .ok()
          .and_then(|p| p.parent().map(|p| p.to_path_buf()));

        if let Some(dir) = exe_dir {
          let server_path = dir.join("server-x86_64-pc-windows-msvc.exe");
          let alt_server_path = dir.join("bin").join("server-x86_64-pc-windows-msvc.exe");
          let target = if server_path.exists() {
            Some(server_path)
          } else if alt_server_path.exists() {
            Some(alt_server_path)
          } else {
            None
          };

          if let Some(path) = target {
            #[cfg(target_os = "windows")]
            use std::os::windows::process::CommandExt;
            #[cfg(target_os = "windows")]
            const CREATE_NO_WINDOW: u32 = 0x08000000;

            let mut cmd = Command::new(path);
            #[cfg(target_os = "windows")]
            cmd.creation_flags(CREATE_NO_WINDOW);

            let _ = cmd.spawn();
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
