import MarketModel from "../models/marketModel.js";

export const getMarkets = async (req, res) => {
  try {
    const markets = await MarketModel.find({}, "market");
    res.json(markets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

export const getCategoryDetails = async (req, res) => {
  try {
    const market = await MarketModel.findOne({ market: req.params.market });
    if (!market) return res.status(404).json({ error: "Market not found" });

    const category = market.categories.find(
      c => c.content?.id === req.params.id
    );
    if (!category) return res.status(404).json({ error: "Category not found" });

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
