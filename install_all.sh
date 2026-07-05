#!/bin/bash
set -e

echo "========================================================"
echo "  Configuring Environment Variables for Bazarix Storefront"
echo "========================================================"
echo

if [ ! -f "server/.env" ]; then
    echo "[INFO] server/.env not found, creating from server/.env.example..."
    cp server/.env.example server/.env
else
    echo "[INFO] server/.env already exists."
fi

if [ ! -f "my-project/.env" ]; then
    echo "[INFO] my-project/.env not found, creating from my-project/.env.example..."
    cp my-project/.env.example my-project/.env
else
    echo "[INFO] my-project/.env already exists."
fi
echo

echo "========================================================"
echo "  Installing all dependencies for Bazarix Storefront"
echo "========================================================"
echo

echo "[1/2] Installing backend dependencies (server)..."
cd server
npm install
echo

echo "[2/2] Installing frontend dependencies (my-project)..."
cd ../my-project
npm install
echo

echo "========================================================"
echo "  Setup Complete! All dependencies have been installed."
echo "========================================================"
echo
