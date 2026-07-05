@echo off
echo ========================================================
echo   Configuring Environment Variables for Bazarix Storefront
echo ========================================================
echo.

if not exist "server\.env" (
    echo [INFO] server/.env not found, creating from server/.env.example...
    copy "server\.env.example" "server\.env"
) else (
    echo [INFO] server/.env already exists.
)

if not exist "my-project\.env" (
    echo [INFO] my-project/.env not found, creating from my-project/.env.example...
    copy "my-project\.env.example" "my-project\.env"
) else (
    echo [INFO] my-project/.env already exists.
)
echo.

echo ========================================================
echo   Installing all dependencies for Bazarix Storefront
echo ========================================================
echo.
echo [1/2] Installing backend dependencies (server)...
cd server
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install server dependencies.
    pause
    exit /b %errorlevel%
)
echo.
echo [2/2] Installing frontend dependencies (my-project)...
cd ../my-project
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install frontend dependencies.
    pause
    exit /b %errorlevel%
)
echo.
echo ========================================================
echo   Setup Complete! All dependencies have been installed.
echo ========================================================
echo.
pause
