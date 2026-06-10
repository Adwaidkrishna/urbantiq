import User from "../../models/User.js";

/**
 * Get all customers with search, pagination, order counts, and wallet balance
 * GET /api/admin/customers
 */
export const getCustomersList = async (req, res) => {
  try {
    // 1. Parse and validate pagination parameters
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    // 2. Build search query
    const { search } = req.query;
    const matchQuery = {};

    if (search && search.trim() !== "") {
      const cleanSearch = search.trim();
      const regex = new RegExp(cleanSearch, "i");
      matchQuery.$or = [
        { name: regex },
        { email: regex },
        { phone: regex }
      ];
    }

    // 3. Assemble and execute the aggregation pipeline
    // We use $facet to run the total matching count and the paginated data query in a single query
    const pipeline = [
      // Stage A: Filter customers matching search criteria
      { $match: matchQuery },

      // Stage B: Facet for parallel execution of count and paginated retrieval
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            // Sort by newest registrations first
            { $sort: { createdAt: -1 } },

            // Paginate
            { $skip: (page - 1) * limit },
            { $limit: limit },

            // Optimization: Only lookup order count for the paginated slice (max 10 customers)
            // This prevents fetching order collections for the entire database (N+1 query resolution)
            {
              $lookup: {
                from: "orders",
                let: { userId: "$_id" },
                pipeline: [
                  { $match: { $expr: { $eq: ["$user", "$$userId"] } } },
                  { $count: "count" }
                ],
                as: "orderCount"
              }
            },

            // Project only the required properties to the client
            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                createdAt: 1,
                status: { $ifNull: ["$status", "active"] },
                walletBalance: { $ifNull: ["$wallet", 0] },
                totalOrders: {
                  $ifNull: [{ $arrayElemAt: ["$orderCount.count", 0] }, 0]
                }
              }
            }
          ]
        }
      }
    ];

    const [result] = await User.aggregate(pipeline);

    // 4. Extract total count and paginated list
    const totalCustomers = result.metadata[0] ? result.metadata[0].total : 0;
    const customers = result.data;
    const totalPages = Math.ceil(totalCustomers / limit);

    // 5. Structure final response
    res.status(200).json({
      customers,
      pagination: {
        currentPage: page,
        totalPages: totalPages || 1,
        totalCustomers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Error in getCustomersList controller:", error);
    res.status(500).json({ message: "Internal server error while fetching customers" });
  }
};
