import express from "express";
import { createChannel, updateMyChannel, getMyChannel } from "../channel/channel.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";
import { uploadPublic } from "../../middlewares/uploadPublic.js";

const router = express.Router();


router.post("/create", verifyUser, uploadPublic.single("channelIcon"), createChannel);


router.put("/edit", verifyUser, uploadPublic.single("channelIcon"), updateMyChannel);


router.get("/my_channel",verifyUser, getMyChannel); 

export default router;
                  