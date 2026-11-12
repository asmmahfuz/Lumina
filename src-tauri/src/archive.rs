//! Lumina Reader - Native Archive Decompression & Zip-Slip Guard
//! Hardened archive extraction for desktop shell

use std::fs::File;
use std::io::Read;
use std::path::{Component, Path};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct SafeArchiveEntry {
    pub path: String,
    pub size: u64,
    pub is_dir: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArchiveInspectionResult {
    pub is_valid: bool,
    pub total_files: usize,
    pub entries: Vec<SafeArchiveEntry>,
    pub zip_slip_detected: bool,
    pub rejected_entries: Vec<String>,
}

/// Validates that an archive relative path does not escape extraction root (Zip-Slip defense)
pub fn is_safe_archive_path(entry_path: &str) -> bool {
    // Prohibit leading slashes, backslashes, empty paths, null bytes, and drive prefixes
    if entry_path.is_empty()
        || entry_path.starts_with('/')
        || entry_path.starts_with('\\')
        || entry_path.contains('\0')
    {
        return false;
    }

    let path = Path::new(entry_path);
    // Disallow absolute paths or Windows prefixes (e.g. C:)
    if path.is_absolute() {
        return false;
    }

    // Inspect each component: reject ParentDir (..) and Prefix components
    for component in path.components() {
        match component {
            Component::ParentDir => return false,
            Component::Prefix(_) => return false,
            Component::RootDir => return false,
            Component::CurDir | Component::Normal(_) => {}
        }
    }

    true
}

#[command]
pub fn inspect_epub_archive(file_path: String) -> Result<ArchiveInspectionResult, String> {
    let file = File::open(&file_path).map_err(|e| format!("Failed to open file: {e}"))?;
    let mut zip = zip::ZipArchive::new(file).map_err(|e| format!("Failed to parse zip archive: {e}"))?;

    let mut entries = Vec::new();
    let mut rejected_entries = Vec::new();
    let mut zip_slip_detected = false;

    for i in 0..zip.len() {
        let entry = zip.by_index(i).map_err(|e| format!("Zip entry error at index {i}: {e}"))?;
        let entry_name = entry
            .name()
            .map_err(|e| format!("Failed to read entry name: {e}"))?
            .to_string();

        if !is_safe_archive_path(&entry_name) {
            zip_slip_detected = true;
            rejected_entries.push(entry_name);
            continue;
        }

        entries.push(SafeArchiveEntry {
            path: entry_name,
            size: entry.size(),
            is_dir: entry.is_dir(),
        });
    }

    Ok(ArchiveInspectionResult {
        is_valid: true,
        total_files: entries.len(),
        entries,
        zip_slip_detected,
        rejected_entries,
    })
}

#[command]
pub fn read_archive_entry_text(file_path: String, entry_name: String) -> Result<String, String> {
    if !is_safe_archive_path(&entry_name) {
        return Err(format!("Security error: Path traversal detected for entry: {entry_name}"));
    }

    let file = File::open(&file_path).map_err(|e| format!("Failed to open file: {e}"))?;
    let mut zip = zip::ZipArchive::new(file).map_err(|e| format!("Failed to parse zip: {e}"))?;

    let mut entry = zip.by_name(&entry_name)
        .map_err(|e| format!("Entry not found: {e}"))?;

    let mut content = String::new();
    entry.read_to_string(&mut content)
        .map_err(|e| format!("Failed to read entry content: {e}"))?;

    Ok(content)
}
