import { Router } from "express";
import {
  getAllUsers,
  getUserDetails,
  banUser,
} from "./userManagement.controller.js";
import { verifyAdmin } from "../../middlewares/auth.middleware.js";

const router = Router();

// All routes protected by admin middleware
router.use(verifyAdmin);

router.get("/users", getAllUsers);           // List all users
router.get("/users/:userId", getUserDetails); // Get single user details
router.patch("/users/:userId/ban", banUser); // Ban / Unban toggle

export default router;