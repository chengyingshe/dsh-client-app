#[tauri::command]
fn set_refresh_token(token: String) -> Result<(), String> {
    keyring::Entry::new("dsh-tauri-client", "refresh-token").map_err(|e| e.to_string())?.set_password(&token).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_refresh_token() -> Result<Option<String>, String> {
    match keyring::Entry::new("dsh-tauri-client", "refresh-token").map_err(|e| e.to_string())?.get_password() { Ok(token) => Ok(Some(token)), Err(keyring::Error::NoEntry) => Ok(None), Err(e) => Err(e.to_string()) }
}

#[tauri::command]
fn clear_refresh_token() -> Result<(), String> { keyring::Entry::new("dsh-tauri-client", "refresh-token").map_err(|e| e.to_string())?.delete_credential().map_err(|e| e.to_string()) }

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() { tauri::Builder::default().invoke_handler(tauri::generate_handler![set_refresh_token, get_refresh_token, clear_refresh_token]).run(tauri::generate_context!()).expect("error while running tauri application"); }
