PowerShell instructions for testing verify_ocr.php

1. Invoke-RestMethod (PowerShell native)

$payload = @{
supabase_user_id = "<uuid>"
email = 'user@example.com'
ocrMeta = @{ blur_score = 150; keyword_hits = 2; fields_count = 3 }
ocrData = @{ firstName = 'Juan'; lastName = 'Dela Cruz'; middleName = 'S.'; address = 'Quezon City'; contactNo = '09171234567' }
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri 'https://banwa-2ujo.onrender.com/server/api/shared/verify_ocr.php' -Method Post -Body $payload -ContentType 'application/json' -Headers @{ 'X-VERIFY-KEY' = 'YOUR_STRONG_KEY_HERE' }

2. curl.exe (PowerShell passes args differently; use the real curl binary)

# Use --% so PowerShell stops parsing the rest of the line

curl.exe --% -X POST "https://banwa-2ujo.onrender.com/server/api/shared/verify_ocr.php" -H "Content-Type: application/json" -H "X-VERIFY-KEY: YOUR_STRONG_KEY_HERE" -d "{\"supabase_user_id\":\"<uuid>\",\"email\":\"user@example.com\",\"ocrMeta\":{\"blur_score\":150,\"keyword_hits\":2,\"fields_count\":3},\"ocrData\":{\"firstName\":\"Juan\",\"lastName\":\"Dela Cruz\",\"middleName\":\"S.\",\"address\":\"Quezon City\",\"contactNo\":\"09171234567\"}}"

3. Quick debugging notes

- If running locally, the frontend already sends `debug:true` automatically and prints `verify_ocr result` and `verify_ocr debug:` in the browser console.
- If you see API key errors, either remove the header (if VERIFY_OCR_KEY not set) or set the env var `VERIFY_OCR_KEY` before starting your PHP server.
- Use the PHP server terminal (where you ran `php -S`) to view PHP error traces.
