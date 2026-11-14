pub mod archive;
pub mod db;

use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::sync::Mutex;
use tauri::Manager;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub app_name: String,
    pub version: String,
    pub os: String,
    pub arch: String,
    pub local_first: bool,
}

pub struct StartupFileState(pub Mutex<Option<String>>);
pub struct CachedReadHandle(pub Mutex<Option<(String, File)>>);

#[tauri::command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        app_name: "Lumina Reader".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        os: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
        local_first: true,
    }
}

#[tauri::command]
fn ping() -> String {
    "pong".into()
}

/// Returns and clears the file path passed via OS file association / CLI args on launch.
#[tauri::command]
fn take_startup_file_path(state: tauri::State<'_, StartupFileState>) -> Option<String> {
    state.0.lock().ok().and_then(|mut guard| guard.take())
}

/// Returns file byte length without reading file contents into RAM.
#[tauri::command]
fn get_file_size(path: String) -> Result<u64, String> {
    std::fs::metadata(&path)
        .map(|m| m.len())
        .map_err(|e| format!("Failed to stat '{}': {}", path, e))
}

/// Streams only a requested byte range `[offset .. offset + length)` directly from disk.
#[tauri::command]
fn read_file_range(
    path: String,
    offset: u64,
    length: usize,
    handle_cache: tauri::State<'_, CachedReadHandle>,
) -> Result<tauri::ipc::Response, String> {
    let mut guard = handle_cache
        .0
        .lock()
        .map_err(|_| "Failed to lock file handle cache".to_string())?;

    let needs_open = match guard.as_ref() {
        Some((cached_path, _)) => cached_path != &path,
        None => true,
    };

    if needs_open {
        let opened = File::open(&path).map_err(|e| format!("Failed to open '{}': {}", path, e))?;
        *guard = Some((path.clone(), opened));
    }

    let file = &mut guard.as_mut().unwrap().1;
    file.seek(SeekFrom::Start(offset))
        .map_err(|e| format!("Seek error: {e}"))?;

    let capped_len = length.min(16 * 1024 * 1024);
    let mut buf = vec![0u8; capped_len];
    let mut total_read = 0usize;
    while total_read < capped_len {
        match file.read(&mut buf[total_read..]) {
            Ok(0) => break,
            Ok(n) => total_read += n,
            Err(e) => return Err(format!("Read error: {e}")),
        }
    }
    buf.truncate(total_read);
    Ok(tauri::ipc::Response::new(buf))
}

/// Reads a full local file from disk as raw binary bytes (used for non-range formats).
#[tauri::command]
fn read_local_file(path: String) -> Result<tauri::ipc::Response, String> {
    let bytes = std::fs::read(&path).map_err(|e| format!("Failed to read file '{}': {}", path, e))?;
    Ok(tauri::ipc::Response::new(bytes))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let startup_file = std::env::args()
        .skip(1)
        .find(|arg| !arg.starts_with('-') && std::path::Path::new(arg).is_file());

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(move |app| {
            let app_data = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            let db_path = app_data.join("lumina_library.db");
            let conn = db::init_db(db_path).map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            app.manage(db::DbState {
                conn: Mutex::new(conn),
            });
            app.manage(StartupFileState(Mutex::new(startup_file)));
            app.manage(CachedReadHandle(Mutex::new(None)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            ping,
            take_startup_file_path,
            get_file_size,
            read_file_range,
            read_local_file,
            archive::inspect_epub_archive,
            archive::read_archive_entry_text,
            archive::read_archive_entry_bytes,
            db::save_book_record,
            db::get_all_books_from_db,
            db::delete_book_from_db,
            db::update_progress_in_db,
            db::save_bookmark_to_db,
            db::get_bookmarks_from_db,
            db::delete_bookmark_from_db,
            db::save_annotation_to_db,
            db::get_annotations_from_db,
            db::delete_annotation_from_db
        ])
        .run(tauri::generate_context!())
        .expect("error while running Lumina Reader");
}
