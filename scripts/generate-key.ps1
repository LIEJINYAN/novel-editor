# Tauri signing key generation script
# Run: npx tauri signer generate -w novel-engine.key
# When prompted for password, just press Enter (empty password)

Write-Host "Generating Tauri signing key..."
Write-Host "When prompted for password, press Enter twice (empty password)"

npx tauri signer generate -w novel-engine.key
