$envVars = @{
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
    Write-Host "Adding $key..."
    $envVars[$key] | npx -y vercel env add $key production --force
}

Write-Host "All environment variables added!"
