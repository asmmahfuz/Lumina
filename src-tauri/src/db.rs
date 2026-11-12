//! Lumina Reader - Native SQLite Database Engine
//! Local-first relational storage for book metadata, reading progress, and covers

use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SqliteBookRecord {
    pub id: String,
    pub title: String,
    pub creator: Option<String>,
    pub description: Option<String>,
    pub publisher: Option<String>,
    pub language: Option<String>,
    pub pubdate: Option<String>,
    pub format: String,
    pub file_size_bytes: i64,
    pub imported_at: i64,
    pub last_read_at: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SqliteReadingProgress {
    pub book_id: String,
    pub cfi: Option<String>,
    pub page_number: Option<i32>,
    pub current_spine_index: Option<i32>,
    pub total_spine_items: Option<i32>,
    pub percent: f64,
    pub updated_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SqliteBookmark {
    pub id: String,
    pub book_id: String,
    pub title: String,
    pub spine_index: Option<i32>,
    pub cfi: Option<String>,
    pub snippet: Option<String>,
    pub created_at: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SqliteAnnotation {
    pub id: String,
    pub book_id: String,
    pub spine_index: i32,
    pub cfi: Option<String>,
    pub text: String,
    pub color: String,
    pub note: Option<String>,
    pub created_at: i64,
    pub updated_at: Option<i64>,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

/// Initializes local SQLite database file and tables
pub fn init_db(db_path: PathBuf) -> SqliteResult<Connection> {
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).ok();
    }

    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS books (
            id TEXT PRIMARY KEY, title TEXT NOT NULL, creator TEXT, description TEXT,
            publisher TEXT, language TEXT, pubdate TEXT, format TEXT NOT NULL,
            file_size_bytes INTEGER NOT NULL, imported_at INTEGER NOT NULL, last_read_at INTEGER
        );
        CREATE TABLE IF NOT EXISTS reading_progress (
            book_id TEXT PRIMARY KEY, cfi TEXT, page_number INTEGER, current_spine_index INTEGER,
            total_spine_items INTEGER, percent REAL NOT NULL, updated_at INTEGER NOT NULL,
            FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS book_covers (
            book_id TEXT PRIMARY KEY, mime_type TEXT, data BLOB NOT NULL,
            FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS bookmarks (
            id TEXT PRIMARY KEY, book_id TEXT NOT NULL, title TEXT NOT NULL, spine_index INTEGER,
            cfi TEXT, snippet TEXT, created_at INTEGER NOT NULL,
            FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS annotations (
            id TEXT PRIMARY KEY, book_id TEXT NOT NULL, spine_index INTEGER NOT NULL, cfi TEXT,
            text TEXT NOT NULL, color TEXT NOT NULL, note TEXT, created_at INTEGER NOT NULL, updated_at INTEGER,
            FOREIGN KEY(book_id) REFERENCES books(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY, theme TEXT NOT NULL, typography_json TEXT NOT NULL, zen_mode_on_idle INTEGER NOT NULL
        );",
    )?;

    Ok(conn)
}

#[command]
pub fn save_book_record(state: tauri::State<DbState>, book: SqliteBookRecord) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO books (
            id, title, creator, description, publisher, language, pubdate, format, file_size_bytes, imported_at, last_read_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            book.id,
            book.title,
            book.creator,
            book.description,
            book.publisher,
            book.language,
            book.pubdate,
            book.format,
            book.file_size_bytes,
            book.imported_at,
            book.last_read_at
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn get_all_books_from_db(state: tauri::State<DbState>) -> Result<Vec<SqliteBookRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, title, creator, description, publisher, language, pubdate, format, file_size_bytes, imported_at, last_read_at
         FROM books ORDER BY imported_at DESC"
    ).map_err(|e| e.to_string())?;

    let book_iter = stmt.query_map([], |row| {
        Ok(SqliteBookRecord {
            id: row.get(0)?,
            title: row.get(1)?,
            creator: row.get(2)?,
            description: row.get(3)?,
            publisher: row.get(4)?,
            language: row.get(5)?,
            pubdate: row.get(6)?,
            format: row.get(7)?,
            file_size_bytes: row.get(8)?,
            imported_at: row.get(9)?,
            last_read_at: row.get(10)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut books = Vec::new();
    for book in book_iter {
        if let Ok(b) = book {
            books.push(b);
        }
    }

    Ok(books)
}

#[command]
pub fn delete_book_from_db(state: tauri::State<DbState>, book_id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM books WHERE id = ?1", params![book_id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM reading_progress WHERE book_id = ?1", params![book_id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM book_covers WHERE book_id = ?1", params![book_id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM annotations WHERE book_id = ?1", params![book_id])
        .ok();

    Ok(())
}

#[command]
pub fn update_progress_in_db(state: tauri::State<DbState>, progress: SqliteReadingProgress) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO reading_progress (
            book_id, cfi, page_number, current_spine_index, total_spine_items, percent, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            progress.book_id,
            progress.cfi,
            progress.page_number,
            progress.current_spine_index,
            progress.total_spine_items,
            progress.percent,
            progress.updated_at
        ],
    ).map_err(|e| e.to_string())?;

    // Also update last_read_at on books table
    conn.execute(
        "UPDATE books SET last_read_at = ?1 WHERE id = ?2",
        params![progress.updated_at, progress.book_id],
    ).ok();

    Ok(())
}

#[command]
pub fn save_bookmark_to_db(state: tauri::State<DbState>, bookmark: SqliteBookmark) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO bookmarks (
            id, book_id, title, spine_index, cfi, snippet, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
            bookmark.id,
            bookmark.book_id,
            bookmark.title,
            bookmark.spine_index,
            bookmark.cfi,
            bookmark.snippet,
            bookmark.created_at
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn get_bookmarks_from_db(state: tauri::State<DbState>, book_id: String) -> Result<Vec<SqliteBookmark>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, book_id, title, spine_index, cfi, snippet, created_at
         FROM bookmarks WHERE book_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;

    let b_iter = stmt.query_map(params![book_id], |row| {
        Ok(SqliteBookmark {
            id: row.get(0)?,
            book_id: row.get(1)?,
            title: row.get(2)?,
            spine_index: row.get(3)?,
            cfi: row.get(4)?,
            snippet: row.get(5)?,
            created_at: row.get(6)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut bookmarks = Vec::new();
    for b in b_iter {
        if let Ok(item) = b {
            bookmarks.push(item);
        }
    }

    Ok(bookmarks)
}

#[command]
pub fn delete_bookmark_from_db(state: tauri::State<DbState>, bookmark_id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM bookmarks WHERE id = ?1", params![bookmark_id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn save_annotation_to_db(state: tauri::State<DbState>, annotation: SqliteAnnotation) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR REPLACE INTO annotations (id, book_id, spine_index, cfi, text, color, note, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            annotation.id,
            annotation.book_id,
            annotation.spine_index,
            annotation.cfi,
            annotation.text,
            annotation.color,
            annotation.note,
            annotation.created_at,
            annotation.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn get_annotations_from_db(state: tauri::State<DbState>, book_id: String) -> Result<Vec<SqliteAnnotation>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, book_id, spine_index, cfi, text, color, note, created_at, updated_at
         FROM annotations WHERE book_id = ?1 ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    let a_iter = stmt.query_map(params![book_id], |row| {
        Ok(SqliteAnnotation {
            id: row.get(0)?,
            book_id: row.get(1)?,
            spine_index: row.get(2)?,
            cfi: row.get(3)?,
            text: row.get(4)?,
            color: row.get(5)?,
            note: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?;
    let mut annotations = Vec::new();
    for a in a_iter {
        if let Ok(item) = a {
            annotations.push(item);
        }
    }
    Ok(annotations)
}

#[command]
pub fn delete_annotation_from_db(state: tauri::State<DbState>, annotation_id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM annotations WHERE id = ?1", params![annotation_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}


