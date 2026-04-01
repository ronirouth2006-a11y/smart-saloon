# Smart Saloon: Professional UI & Backend Overview

## 1. The Vision: "Skip the Wait" Interface
The goal is to provide a high-end, **Dark Mode** user experience using React and **Glassmorphism** (semi-transparent, blurred backgrounds).

- **Dynamic Landing Page:** A "Find a Salon" button that instantly triggers the Public API to find shops near your current location (e.g., Kolaghat).
- **Visual Hierarchy:** Uses a premium dark theme (`#121212`) with neon accents (`#2ecc71` for success, `#3498db` for buttons) to guide the user's eye.
- **Responsive Cards:** Each saloon is displayed as a card showing **Live Count**, **Distance (km)**, and **Predicted Wait Time**.

## 2. Fixed UI Bugs & Improvements
During the analysis of the `frontend-react/src` directory, the following fixes were applied:

- **Dependency Resolution:** Ran `npm install` to ensure all React hooks and routing libraries are properly linked.
- **Linting & Compilation:** Fixed errors in the pages directory to ensure the Nearby API calls don't crash the browser.
- **CORS Integration:** Configured the React frontend to communicate seamlessly with the FastAPI backend on `127.0.0.1:8000`.

## 3. The "Smart" Technical Core
The beauty of this project lies in how the code handles your movement between Kolkata and Kolaghat.

- **Precision Sorting:** The backend uses the **Haversine Formula** to calculate distances. If you are in Kolaghat, the React UI will automatically sort the "Kolaghat Saloon" to the top.
- **AI Data Loop:** The AI Camera detects people, sends the count to the FastAPI Camera Router, and the React Frontend updates the UI in real-time.
- **IST Synchronization:** Every "Last Updated" timestamp in the UI is rendered in **Indian Standard Time** for local relevance.

## 4. Final Execution Plan (Step-by-Step)
To see your new attractive UI in action, follow these commands:

**Backend:** In Terminal 1, run:
```bash
uvicorn main:app --reload
```

**AI Feed:** In Terminal 2, run:
```bash
python camera.py
```
*(Note: Start the person-detection loop to feed live data).*

**React Frontend:** In Terminal 3 (inside `frontend-react` folder), run:
```bash
npm install
npm run dev
```

**Verification:** Open the browser. Your Kolaghat-registered shop should now appear with its live count and an accurate distance based on your current GPS.

## 5. Security & Browser Warnings ("Not Secure")

When running this app locally, your browser (Edge, Chrome, etc.) may show a **"Not Secure"** warning in the address bar. 

### Why this happens:
- **HTTP vs HTTPS:** This is a local development environment. By default, it uses **HTTP**. Modern browsers flag any HTTP website as "Not Secure" because the data is not encrypted.
- **Localhost Safety:** Since the app is running entirely on your computer (on `localhost` or `127.0.0.1`), your data is not leaving your machine. It is **SAFE** to use and is NOT harmful to your phone or PC.

### How to ignore/bypass:
1. Click on the **"Not Secure"** or **"Advanced"** button in your browser.
2. Select **"Continue to 127.0.0.1 (unsafe)"** or **"Proceed to localhost"**.
3. The app will then load normally.

> [!NOTE]
> For a professional production release, an SSL certificate would be used to enable **HTTPS** and remove this warning.
