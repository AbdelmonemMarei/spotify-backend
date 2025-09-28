import MarketModel from "../models/marketModel.js";

// Get sections by category
export const getSectionsByCategory = async (req, res) => {
  const { market, id } = req.params;
  try {
    const docs = await MarketModel.aggregate([
      { $match: { market } },
      { $unwind: "$sections" },
      { $match: { "sections.categoryId": id } },
      { $replaceRoot: { newRoot: "$sections" } }
    ]);
    res.json(docs);
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
    console.log(docs);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get market sections (e.g., popular sections)
export const getMarketSections = async (req, res) => {
  const { market } = req.params;

  try {
    const docs = await MarketModel.aggregate([
      { $match: { market } },
      { $unwind: "$sections" },


      { $match: { "sections.title": { $regex: "popular", $options: "i" } } },

      { $limit: 20 }, 
      { $replaceRoot: { newRoot: "$sections" } }
    ]);

    res.json({
      total: docs.length, 
      data: docs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// Get section details
export const getSectionDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const docs = await MarketModel.aggregate([
      { $unwind: "$sections" },
      { $match: { "sections._id": id } },
      { $replaceRoot: { newRoot: "$sections" } }
    ]);
    res.json(docs[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
