import express from "express";
import { createChannel, updateMyChannel, getMyChannel,getAllChannels } from "../channel/channel.controller.js";
import { verifyUser } from "../../middlewares/auth.middleware.js";
import { uploadPublic } from "../../middlewares/uploadPublic.js";


const router = express.Router();


router.post("/create", verifyUser, uploadPublic.single("channelIcon"), createChannel);


router.put("/edit", verifyUser, uploadPublic.single("channelIcon"), updateMyChannel);


router.get("/my_channel",verifyUser, getMyChannel); 
router.get("/all", getAllChannels);

export default router;
                  