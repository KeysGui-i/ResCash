import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      success: false, 
      message: "Unauthorized access, token required" 
    });
  }
  
  const token = authHeader.split(" ")[1];

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
