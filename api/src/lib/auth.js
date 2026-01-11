const jwt = require('jsonwebtoken');

function validateToken(request) {
    // NUCLEAR FIX: Hardcoded secret to bypass Env Var issues
    const SECRET_KEY = "super-secret-azure-fix-2025";

    // Azure overwrites "Authorization" with its own EasyAuth token.
    // We check "x-auth-token" first to bypass this.
    const customHeader = request.headers.get('x-auth-token');
    const authHeader = request.headers.get('Authorization');

    let token = null;
    if (customHeader) {
        token = customHeader;
    } else if (authHeader) {
        token = authHeader.split(' ')[1]; // Bearer <token>
    }

    if (!token) return null;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded; // Returns { userId, email, iat, exp }
    } catch (error) {
        return null;
    }
}

module.exports = { validateToken };