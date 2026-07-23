// Lervyn Ang
// Verifies the JWT sent by a STALL OWNER as "Bearer <token>".
// Mirrors middleware/authMiddleware.js (customer) but attaches req.owner instead
// of req.user, so owner-only routes never get mixed up with customer routes.

const jwt = require("jsonwebtoken");

function verifyOwnerToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const owner_id = decoded.owner_id ?? decoded.ownerId;
    if (!Number.isInteger(owner_id)) {
      return res.status(401).json({ error: "Token does not contain an owner id" });
    }

    req.owner = { ...decoded, owner_id };
    next();
  });
}

module.exports = verifyOwnerToken;