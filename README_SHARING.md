# Sharing & Automated Setup Guide - Bazarix Storefront

This project is configured with a fully automated developer workspace. If you are pair programming with **Antigravity**, you can simply ask it to execute the steps in this file, and it will handle the environment installation, seeding, and server execution automatically!

---

## 🤖 Instructions for Antigravity (Skill Execution)

Dear Antigravity, please configure this workspace by executing the following step-by-step checklist:

### Step 1: Install Dependencies
- Propose a command to run `npm install` in the [server](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/server) directory.
- Propose a command to run `npm install` in the [my-project](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/my-project) directory.

### Step 2: Configure Environment Variables
- Check if [server/.env](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/server/.env) exists. If not, create it by copying [server/.env.example](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/server/.env.example).
- Check if [my-project/.env](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/my-project/.env) exists. If not, create it by copying [my-project/.env.example](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/my-project/.env.example).
- *(Note: Ask the user to double-check their MongoDB connection string in `server/.env` before proceeding).*

### Step 3: Run Database Seeds
- Propose a command to run the main seeding script:
  `node seed/seedDatabase.js` inside the [server](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/server) folder.
- Propose a command to run the clean images seed script to upload product photos to Cloudinary:
  `node seed/seedSindhiProducts.js` inside the [server](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/server) folder.

### Step 4: Run Application Servers
- Run the API server as a background task:
  `node server.js` in the [server](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/server) directory.
- Run the Web Client dev server as a background task:
  `npm run dev` in the [my-project](file:///c:/Users/yaser/Desktop/multivendor%20ecommerce%20store/my-project) directory.

### Step 5: Verify
- Launch the browser subagent to open `http://localhost:5173/` to ensure the storefront is running successfully.

---

## 👤 Manual Setup (For Humans)

If you are running the setup manually, please follow these terminal commands:

1. **Install backend dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd ../my-project
   npm install
   ```

3. **Database & Cloudinary Environment Configurations**:
   Make sure you copy the environment examples to `.env` files in both `server/` and `my-project/` directories, and fill in your MongoDB connection details, Stripe test keys, and Cloudinary dashboard details.

4. **Seed Database Products**:
   In the `server/` folder:
   ```bash
   node seed/seedDatabase.js
   node seed/seedSindhiProducts.js
   ```

5. **Start Servers**:
   * **Terminal A (Backend)**: `cd server && node server.js`
   * **Terminal B (Frontend)**: `cd my-project && npm run dev`
   * Now open **http://localhost:5173/** in your browser.
