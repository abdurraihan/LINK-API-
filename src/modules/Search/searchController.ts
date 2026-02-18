import { Request, Response } from 'express';
import Video from '../video/video.model.js';
import Post from '../post/post.model.js';
import Short from '../shorts/shorts.model.js';

export const search = async (req: Request, res: Response) => {
  try {
    const { query, visibility = 'public', category, language, page = 1, limit = 10 } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Initialize the search query object
    const searchQuery: any = { visibility };

    // Perform a case-insensitive search with more specific field matching
    if (query) {
      searchQuery.$or = [
        { title: { $regex: query, $options: 'i' } },  // Search in title
        { description: { $regex: query, $options: 'i' } },  // Search in description
        { category: { $regex: query, $options: 'i' } },  // Search in category
      ];
    }

    // Optionally filter by category and language
    if (category) searchQuery.category = category;
    if (language) searchQuery.language = language;

    // Pagination setup
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch paginated results for videos, posts, and shorts
    const videos = await Video.find(searchQuery)
      .skip(skip)
      .limit(limitNumber);
    const posts = await Post.find(searchQuery)
      .skip(skip)
      .limit(limitNumber);
    const shorts = await Short.find(searchQuery)
      .skip(skip)
      .limit(limitNumber);

    // Count total matching documents for each category
    const totalVideos = await Video.countDocuments(searchQuery);
    const totalPosts = await Post.countDocuments(searchQuery);
    const totalShorts = await Short.countDocuments(searchQuery);

    // Return search results with pagination details
    return res.status(200).json({
      videos,
      posts,
      shorts,
      total: {
        videos: totalVideos,
        posts: totalPosts,
        shorts: totalShorts,
      },
      page: pageNumber,
      limit: limitNumber,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
