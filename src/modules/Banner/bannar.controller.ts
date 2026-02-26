import { Request, Response } from "express";
import { Banner } from "./bannar.model.js";

// =============================
// Create Banner (Admin)
// =============================
export const createBanner = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                status: "fail",
                message: "Banner image is required",
            });
        }

        const imageUrl = (req.file as any).location; // S3 URL

        const banner = await Banner.create({
            title: req.body.title,
            description: req.body.description,
            imageUrl,
            createdBy: req.adminId,
        });

        res.status(201).json({
            status: "success",
            message: "Banner created successfully",
            data: banner,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to create banner",
        });
    }
};

// =============================
// Get Active Banners (Public)
// =============================
export const getBanners = async (_req: Request, res: Response) => {
    try {
        const banners = await Banner.find({ isActive: true })
            .sort({ createdAt: -1 });

        res.status(200).json({
            status: "success",
            results: banners.length,
            data: banners,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to fetch banners",
        });
    }
};



// =============================
// UPDATE Banner (Admin)
// =============================
export const updateBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                status: "fail",
                message: "Banner not found",
            });
        }

        // if new image uploaded → replace
        if (req.file) {
            banner.imageUrl = (req.file as any).location;
        }

        if (req.body.title !== undefined) {
            banner.title = req.body.title;
        }

        if (req.body.description !== undefined) {
            banner.description = req.body.description;
        }

        await banner.save();

        res.status(200).json({
            status: "success",
            message: "Banner updated successfully",
            data: banner,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to update banner",
        });
    }
};

// =============================
// DELETE Banner (Admin)
// =============================
export const deleteBanner = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findByIdAndDelete(id);

        if (!banner) {
            return res.status(404).json({
                status: "fail",
                message: "Banner not found",
            });
        }

        res.status(200).json({
            status: "success",
            message: "Banner deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to delete banner",
        });
    }
};

// =============================
// TOGGLE Banner Active Status
// =============================
export const toggleBannerStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                status: "fail",
                message: "Banner not found",
            });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        res.status(200).json({
            status: "success",
            message: `Banner ${banner.isActive ? "activated" : "deactivated"}`,
            data: banner,
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            message: "Failed to toggle banner status",
        });
    }
};