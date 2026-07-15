const jwt = require("jsonwebtoken");

// Verifies the JWT sent in the Authorization header as "Bearer <token>"
// On success, attaches the decoded payload (customer_id, email) to req.user.
// `customerId` is accepted too so tokens created before the payload was
// standardised continue to work.
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    const customer_id = decoded.customer_id ?? decoded.customerId;
    if (!Number.isInteger(customer_id)) {
      return res.status(401).json({ error: "Token does not contain a customer id" });
    }

    req.user = { ...decoded, customer_id };
    next();
  });
}

module.exports = verifyToken;
