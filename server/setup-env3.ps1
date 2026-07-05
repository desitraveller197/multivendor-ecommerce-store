$envVars = @{
    "NODE_ENV" = "production"
    "MONGO_URI" = "mongodb+srv://esha:EshaPass123@cluster0.hkigvl5.mongodb.net/multivendor?retryWrites=true&w=majority"
    "JWT_SECRET" = "k9X2mP7vR4wL8nQ1jF6bT3hY5sA0dG9c"
    "JWT_EXPIRES" = "7d"
    "STRIPE_SECRET_KEY" = "sk_test_xxxxx"
    "STRIPE_WEBHOOK_SECRET" = "whsec_xxxxx"
    "CLOUDINARY_CLOUD_NAME" = "dyugthwsu"
    "CLOUDINARY_API_KEY" = "476541276681953"
    "CLOUDINARY_API_SECRET" = "qNQGuo0pyabrmez-V7KoMYP_xa8"
    "CLIENT_URL" = "https://placeholder.web.app"
}

foreach ($key in $envVars.Keys) {
    Write-Host "Removing $key..."
    npx -y vercel env rm $key production --yes 2>$null | Out-Null

    Write-Host "Adding $key..."
    $tmpFile = Join-Path $env:TEMP "vercel_env_$key.txt"
    # Write without BOM and without trailing newline
    [System.IO.File]::WriteAllText($tmpFile, $envVars[$key], [System.Text.UTF8Encoding]::new($false))
    
    # Use cmd.exe to pipe without PowerShell newline issues
    cmd /c "type `"$tmpFile`" | npx -y vercel env add $key production"
    
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
}

Write-Host "`nDone! All environment variables set cleanly."
