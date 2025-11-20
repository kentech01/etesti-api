import { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
    picture?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!auth) {
      res.status(503).json({ error: "Authentication service unavailable" });
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || "",
      name: decodedToken.name,
      picture: decodedToken.picture,
    };
    next();
  } catch (error: any) {
    // Log the actual error for debugging
    console.error("Token verification failed:", {
      error: error?.message || error,
      code: error?.code,
      stack: error?.stack,
    });

    // Provide more specific error messages based on error type
    if (error?.code === "auth/id-token-expired") {
      res.status(401).json({ 
        error: "Token expired", 
        code: "TOKEN_EXPIRED",
        message: "Your authentication token has expired. Please refresh your token." 
      });
      return;
    }

    if (error?.code === "auth/argument-error") {
      res.status(401).json({ 
        error: "Invalid token format", 
        code: "INVALID_TOKEN_FORMAT",
        message: "The provided token is malformed." 
      });
      return;
    }

    if (error?.code === "auth/id-token-revoked") {
      res.status(401).json({ 
        error: "Token revoked", 
        code: "TOKEN_REVOKED",
        message: "Your authentication token has been revoked. Please sign in again." 
      });
      return;
    }

    // Generic error for other cases
    res.status(403).json({ 
      error: "Invalid token", 
      code: "INVALID_TOKEN",
      message: error?.message || "Token verification failed" 
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!auth) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || "",
        name: decodedToken.name,
        picture: decodedToken.picture,
      };
    }
    next();
  } catch (error: any) {
    // For optional auth, we silently fail and continue
    // but log for debugging purposes
    if (error?.code && error?.code !== "auth/id-token-expired") {
      console.warn("Optional auth token verification failed:", {
        error: error?.message || error,
        code: error?.code,
      });
    }
    next();
  }
};
