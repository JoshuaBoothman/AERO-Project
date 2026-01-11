const jwt = require('jsonwebtoken');

function validateToken(request) {
    // NUCLEAR FIX: Hardcoded secret to bypass Env Var issues
    const SECRET_KEY = "super-secret-azure-fix-2025";
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return null;

    const token = authHeader.split(' ')[1]; // Bearer <token>
    if (!token) return null;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        return decoded; // Returns { userId, email, iat, exp }
    } catch (error) {
        return null;
    }
}

module.exports = { validateToken };