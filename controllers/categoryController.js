import MarketModel from "../models/marketModel.js";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 600 }); // Cache with 10 minutes TTL

// Get all available markets
export const getMarkets = async (req, res) => {
  try {
    const markets = await MarketModel.find({}, "market");
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get categories for a specific market
export const getCategories = async (req, res) => {
  try {
    const market = await MarketModel.findOne({ market: req.params.market });
    if (!market) return res.status(404).json({ error: "Market not found" });

    const categories = market.categories.map(c => ({
      id: c.content?.id,
      name: c.name,
      image:c.image,
    }));

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get category details with batching and caching
export const getCategoryDetails = async (req, res) => {
  const { market: marketParam, id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const cacheKey = `category:${marketParam}:${id}:page:${page}:limit:${limit}`;

  try {
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ fromCache: true, ...cached });
    }

    const market = await MarketModel.findOne({ market: marketParam });
    if (!market) return res.status(404).json({ error: "Market not found" });

    const category = market.categories.find(
      c => c.content?.id === id
    );
    if (!category) return res.status(404).json({ error: "Category not found" });

    const allItems = category.contents?.items || [];
    const totalItems = category?.contents?.totalCount;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const batchedItems = allItems.slice(startIndex, endIndex);

    const result = {
      fromCache: false,
      page,
      limit,
      totalPages: Math.ceil(totalItems / limit),
      category: {
        id: category?.category_id,
        name: category?.name,
        description: category?.description,
        image: category?.image,
        totalItems,
        contents:{
          items: batchedItems
        }
      }
    };

    cache.set(cacheKey, result);

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// export const getCategoryDetails = async (req, res) => {
//   try {
//     const market = await MarketModel.findOne({ market: req.params.market });
//     if (!market) return res.status(404).json({ error: "Market not found" });

//     const category = market.categories.find(
//       c => c.content?.id === req.params.id
//     );
//     if (!category) return res.status(404).json({ error: "Category not found" });

//     res.json(category);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };



export const getPlaylists = async (req, res) => {
  try {
    const market = await MarketModel.findOne({ market: req.params.market });
    if (!market) return res.status(404).json({ error: "Market not found" });

    const category = market.categories.find(
      c => c.content?.id === req.params.id
    );
    if (!category) return res.status(404).json({ error: "Category not found" });

    const playlists = [];
    category.content?.contents?.items.forEach(section => {
      section.contents?.items.forEach(item => {
        if (item.type === "playlist") {
          playlists.push({
            id: item.id,
            name: item.name,
            url: item.shareUrl,
            description: item.description,
            image: item.images?.[0]?.[0]?.url,
          });
        }
      });
    });

    res.json(playlists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
