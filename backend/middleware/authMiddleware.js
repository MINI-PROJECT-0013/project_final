const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
    const authHeader = req.header("Authorization");

    console.log("Authorization Header:", authHeader); // Debugging

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized: No or invalid token provided" });
    }

    const token = authHeader.split(" ")[1];

    console.log("Extracted Token:", token); // Debugging

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        console.log("Decoded Token:", decoded); // Debugging

        if (!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token: Missing user ID" });
        }

        req.user = decoded; // Attach user data to request
        console.log("req.user set:", req.user);
        next();
    } catch (error) {
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = { protect };
