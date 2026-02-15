🚀 GO LIVE PROCEDURE (Switching to Square Production)
Prerequisite: Get the Production credentials ready from the Square Developer Dashboard.

Phase 1: Update the Frontend (The Code)
Open client/.env.production in VS Code.

Replace the values with the Production keys:

VITE_SQUARE_APP_ID = sq0idb-...... (Real App ID)

VITE_SQUARE_LOCATION_ID = L...... (Real Location ID)

Commit and Push:

git add client/.env.production

git commit -m "Switch payment keys to Production"

git push

Wait ~3 minutes for GitHub/Azure to rebuild and deploy the site.

Phase 2: Update the Backend (Azure Portal)
Log in to the Azure Portal and go to the AERO Static Web App.

Go to Settings -> Environment variables.

Update these 4 existing variables with Production values:

SQUARE_ACCESS_TOKEN = EAAA...... (The Real Secret Token)

SQUARE_ENVIRONMENT = production (Change from 'sandbox')

SQUARE_APP_ID = sq0idb-...... (Real App ID)

SQUARE_LOCATION_ID = L...... (Real Location ID)

Delete the 2 VITE_ variables (Clean up):

Delete VITE_SQUARE_APP_ID

Delete VITE_SQUARE_LOCATION_ID

Click Apply (at the bottom) to restart the server.

Phase 3: Final Verification
Go to the live website.

Add a $1 test item to the cart (or create a dummy product).

Go to Checkout.

Verify: The credit card form should now ask for "Postcode" (Australia) instead of "ZIP" (US).

This is the quickest visual check that you are in Production mode.

Test: Process a real transaction for $1.00 using a real credit card.

Refund: Go to the Square Dashboard and refund your $1.00.