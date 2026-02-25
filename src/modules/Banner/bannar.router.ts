import express from "express";
import {
    createBanner,
    getBanners,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
} from "./bannar.controller.js";
import { verifyAdmin } from "../../middlewares/auth.middleware.js";
import { uploadPublic } from "../../middlewares/uploadPublic.js";

const router = express.Router();

// Admin Upload Banner
router.post(
    "/",
    verifyAdmin,
    uploadPublic.single("banner"),
    createBanner
);

// Public Get Banners
router.get("/", getBanners);


router.patch(
    "/:id",
    verifyAdmin,
    uploadPublic.single("banner"),
    updateBanner
);

router.delete("/:id", verifyAdmin, deleteBanner);

router.patch("/:id/toggle", verifyAdmin, toggleBannerStatus);

export default router;