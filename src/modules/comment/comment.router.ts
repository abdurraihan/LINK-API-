import { Router } from "express";
import {
  createComment,
  getComments,
  getReplies,
  updateComment,
  deleteComment,
} from "./comment.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";

const router = Router();


router.post("/", verifyUser, createComment);


router.get("/:commentId/replies", getReplies);


router.get("/:targetType/:targetId", getComments);


router.put("/:commentId", verifyUser, updateComment);

router.delete("/:commentId", verifyUser, deleteComment);

export default router;