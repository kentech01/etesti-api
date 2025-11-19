import { Response } from "express";
import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { AuthRequest } from "../middleware/auth";

const userRepository = AppDataSource.getRepository(User);

/**
 * Helper function to get or create a user from Firebase authentication
 * This ensures users are automatically synced from Firebase to the database
 */
export async function getOrCreateUser(
  firebaseUid: string,
  email: string,
  name?: string,
  picture?: string
): Promise<User> {
  let user = await userRepository.findOne({
    where: { firebaseUid },
  });

  if (!user) {
    // Try to extract firstName and lastName from Firebase name
    let firstName: string | null = null;
    let lastName: string | null = null;

    if (name) {
      const nameParts = name.trim().split(/\s+/);
      if (nameParts.length > 0) {
        firstName = nameParts[0];
        if (nameParts.length > 1) {
          lastName = nameParts.slice(1).join(" ");
        }
      }
    }

    // If no name available, try to extract from email
    if (!firstName && email) {
      const emailParts = email.split("@")[0];
      firstName = emailParts;
    }

    user = userRepository.create({
      firebaseUid,
      email,
      firstName: firstName || "User",
      lastName: lastName || "",
      avatarUrl: picture || null,
    });

    user = await userRepository.save(user);
  }

  return user;
}

export class UserController {
  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const existingUser = await userRepository.findOne({
        where: { firebaseUid: req.user.uid },
      });

      if (existingUser) {
        res.status(400).json({ error: "User already exists" });
        return;
      }

      const user = userRepository.create({
        firebaseUid: req.user.uid,
        email: req.user.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatarUrl: req.body.avatarUrl,
      });

      const savedUser = await userRepository.save(user);
      res.status(201).json(savedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to create user" });
    }
  }

  static async getUserProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email,
        req.user.name,
        req.user.picture
      );

      res.json(user);
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      res.status(500).json({ error: "Failed to get user profile" });
    }
  }

  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await userRepository.findOne({
        where: { firebaseUid: req.user.uid },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      userRepository.merge(user, req.body);
      const updatedUser = await userRepository.save(user);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user" });
    }
  }

  static async deleteUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "User not authenticated" });
        return;
      }

      const user = await userRepository.findOne({
        where: { firebaseUid: req.user.uid },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await userRepository.remove(user);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
}
