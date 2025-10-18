import NodeCache from "node-cache";
import MarketModel from "../models/marketModel.js";

// Unified cache instance (TTL = 10 minutes)
const cache = new NodeCache({ stdTTL: 600 });

// Get sections by category (batched + cached)
export const getSectionsByCategory = async (req, res) => {
  const { market, id } = req.params;
  const page = parseInt(req.query.page) || 1;  
  const limit = parseInt(req.query.limit) || 3; 
  const cacheKey = `sections:${market}:${id}:page:${page}:limit:${limit}`;

  try {
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ fromCache: true, ...cached });

    const docs = await MarketModel.aggregate([
      { $match: { market } },
      { $unwind: "$sections" },
      { $match: { "sections.categoryId": id } },
      { $sort: { "sections.title": 1 } },
      {
        $project: {
          _id: "$sections._id",
          title: "$sections.title",
          categoryId: "$sections.categoryId",
          contents: "$sections.contents"
        }
      },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const result = { page, limit, total: docs.length, data: docs };
    cache.set(cacheKey, result);
    res.json({ fromCache: false, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get random sections by market
export const getRandomSections = async (req, res) => {
  const { market } = req.params;
  const limit = parseInt(req.query.limit) || 5;
  try {
    const docs = await MarketModel.aggregate([
      { $match: { market } },
      { $unwind: "$sections" },
      { $sample: { size: limit } },
      { $replaceRoot: { newRoot: "$sections" } }
    ]);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get market sections (batched + cached)
export const getMarketSections = async (req, res) => {
  const { market } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3; 
  const playlistLimit = 8;
  const cacheKey = `market:${market}:page:${page}:limit:${limit}`;

  try {
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ fromCache: true, ...cached });

    const docs = await MarketModel.aggregate([
      { $match: { market } },
      { $unwind: "$sections" },
      {
        $match: {
          "sections.title": {
            $regex: "^(radio|popular|today|latest)",
            $options: "i"
          }
        }
      },
      { $sort: { "sections.title": 1 } },
      {
        $project: {
          _id: "$sections._id",
          title: "$sections.title",
          contents: {
            totalCount: { $size: { $ifNull: ["$sections.contents.items", []] } },
            items: {
              $slice: [
                { $ifNull: ["$sections.contents.items", []] },
                playlistLimit
              ]
            }
          }
        }
      },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const result = { page, limit, playlistLimit, data: docs };
    cache.set(cacheKey, result);
    res.json({ fromCache: false, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get section details (batched 10-by-10 + cached)
export const getSectionDetails = async (req, res) => {
  const { id, market } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const cacheKey = `section:${market}:${id}:page:${page}:limit:${limit}`;

  try {
    const cached = cache.get(cacheKey);
    if (cached) return res.json({ fromCache: true, ...cached });

    const docs = await MarketModel.aggregate([
      { $match: { market } },
      { $unwind: "$sections" },
      { $match: { "sections._id": id } },
      { $replaceRoot: { newRoot: "$sections" } }
    ]);

    if (!docs.length) return res.status(404).json({ error: "Section not found" });

    const section = docs[0];
    const items = section.contents?.items || [];
    const total = items.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const batchItems = items.slice(startIndex, endIndex);

    const result = {
      _id: section._id,
      market,
      title: section.title,
      page,
      limit,
      total,
      totalPages,
      items: batchItems
    };

    cache.set(cacheKey, result);
    res.json({ fromCache: false, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

