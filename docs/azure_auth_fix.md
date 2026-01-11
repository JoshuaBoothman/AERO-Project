Critical: Azure Authentication & Header Overwriting
The Issue
When hosting on Azure App Service or Static Web Apps, if "Authentication" (EasyAuth) is enabled or interacting with the service, Azure intercepts and overwrites the standard Authorization header.

Client Sends: Authorization: Bearer <Your-App-JWT>
Azure Receives: Authorization: Bearer <Azure-Management-Token>
This mismatch causes signature verification to fail because the backend tries to verify Microsoft's token (signed with their keys) using your application's JWT_SECRET.

Symptoms
JWT Verify Failed: invalid signature despite correct JWT_SECRET.
Decoded token has iss: ...scm.azurewebsites.net (Azure) instead of your app's issuer.
Public routes work; protected routes return 401/403.
The Fix: X-Auth-Token Bypass
To ensure the backend receives the correct application token, pass it in a custom header that Azure ignores.

1. Frontend Update
In your 
fetch
 calls (e.g., 
AdminDashboard.jsx
, 
AdminOrders.jsx
), send the token in X-Auth-Token as well:

headers: {
    'Authorization': `Bearer ${token}`, // Still send this for standard compliance/local dev
    'X-Auth-Token': token               // The critical bypass header
}
2. Backend Update (
lib/auth.js
)
Update the token extraction logic to prioritize the custom header:

function validateToken(request) {
    const SECRET_KEY = process.env.JWT_SECRET;
    
    // Check custom header first to bypass Azure overwrites
    const customHeader = request.headers.get('x-auth-token');
    const authHeader = request.headers.get('Authorization');
    
    let token = null;
    if (customHeader) {
        token = customHeader;
    } else if (authHeader) {
        token = authHeader.split(' ')[1];
    }
    
    if (!token) return null;
    
    // ... verify logic ...
}
Troubleshooting
If auth fails again, use 
api/src/functions/debugStatus.js
 (if deployed) to inspect the incoming headers and token claims. Look specifically at the iss (Issuer) field of the received token.

