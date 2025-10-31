import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Expecting "Bearer <token>"
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized access, token required" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { publicKey: decoded.publicKey }; // Attach the publicKey to the request object
    next();
  } catch (error) {
    console.error("Invalid token:", error);
    return res.status(403).json({ 
      success: false, 
      message: "Invalid token" 
    });
  }
};

export default authenticate;
