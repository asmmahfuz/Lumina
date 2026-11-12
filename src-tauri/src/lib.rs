pub mod archive;
pub mod db;

use serde::{Deserialize, Serialize};
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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data = app.path().app_data_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            let db_path = app_data.join("lumina_library.db");
            let conn = db::init_db(db_path).map_err(|e| Box::new(e) as Box<dyn std::error::Error>)?;
            app.manage(db::DbState {
                conn: Mutex::new(conn),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            ping,
            archive::inspect_epub_archive,
            archive::read_archive_entry_text,
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
