const jwt = require('jsonwebtoken');

const jwt = require('jsonwebtoken');

function validateToken(request) {
    const SECRET_KEY = process.env.JWT_SECRET || "dev-secret-key-change-me";
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