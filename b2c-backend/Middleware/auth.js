import jwt from "jsonwebtoken";

function extractAuthToken(req) {
  const raw = req.headers.authorization;

  if (!raw || typeof raw !== "string") {
    return null;
  }

  if (raw.toLowerCase().startsWith("bearer ")) {
    return raw.slice(7).trim();
  }

  return raw.trim();
}

function decodeToken(token, callback) {
  jwt.verify(token, process.env.JWT_SECRET, (error, user) => {
    callback(error, user);
  });
}

export const verifyToken = (req, res, next) => {
  const token = extractAuthToken(req);

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  decodeToken(token, (error, user) => {
    if (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Session expired. Please log in again." });
      }
      return res.status(403).json({ message: "Invalid token." });
    }

    req.user = user;
    return next();
  });
};

export const attachUserIfToken = (req, _res, next) => {
  const token = extractAuthToken(req);

  if (!token) {
    req.user = null;
    next();
    return;
  }

  decodeToken(token, (error, user) => {
    req.user = error ? null : user;
    next();
  });
};
