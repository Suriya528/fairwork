const Project = require("../models/Project");
const User = require("../models/User");

/**
 * Production Global Search Controller
 * Multi-entity search across Projects, Users/Freelancers/Clients, Wallets, and Navigation Shortcuts.
 */
exports.globalSearch = async (req, res) => {
  try {
    const rawQuery = (req.query.q || "").trim();
    if (!rawQuery) {
      return res.json({
        query: "",
        projects: [],
        users: [],
        wallets: [],
        pages: [],
      });
    }

    const searchRegex = new RegExp(rawQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

    // 1. Search Projects (title, description, category)
    const projectsPromise = Project.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ],
    })
      .populate("clientId", "firstName lastName")
      .select("title category description budget status createdAt clientId")
      .limit(10)
      .lean();

    // 2. Search Users (firstName, lastName, email, role, skills, bio, walletAddress)
    const usersPromise = User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { role: searchRegex },
        { skills: searchRegex },
        { bio: searchRegex },
        { walletAddress: searchRegex },
      ],
    })
      .select("firstName lastName email role skills bio walletAddress avatarUrl")
      .limit(10)
      .lean();

    const [projects, users] = await Promise.all([projectsPromise, usersPromise]);

    // 3. Match Web3 Wallets & Escrow Contracts
    const wallets = [];
    const sepoliaEscrow = "0x7d51b87db4df857cdd76ad63a9ace7b5c5599385";
    const sepoliaDispute = "0x8ddbfe20695a1ddf8488ab80b443574c28024962";
    const sepoliaUsdc = "0xf21bdf6737a3009359f9ec1fa515e6d74702f575";

    if ("fairwork escrow contract".includes(rawQuery.toLowerCase()) || sepoliaEscrow.toLowerCase().includes(rawQuery.toLowerCase())) {
      wallets.push({
        id: "escrow-contract",
        name: "EscrowContract.sol",
        type: "Smart Contract",
        address: sepoliaEscrow,
        network: "Ethereum Sepolia",
      });
    }
    if ("dispute contract".includes(rawQuery.toLowerCase()) || sepoliaDispute.toLowerCase().includes(rawQuery.toLowerCase())) {
      wallets.push({
        id: "dispute-contract",
        name: "DisputeContract.sol",
        type: "Smart Contract",
        address: sepoliaDispute,
        network: "Ethereum Sepolia",
      });
    }
    if ("usdc token".includes(rawQuery.toLowerCase()) || sepoliaUsdc.toLowerCase().includes(rawQuery.toLowerCase())) {
      wallets.push({
        id: "usdc-token",
        name: "USDC Token Contract",
        type: "ERC-20 Token",
        address: sepoliaUsdc,
        network: "Ethereum Sepolia",
      });
    }

    // Add wallet matches from users
    users.forEach((u) => {
      if (u.walletAddress && u.walletAddress.toLowerCase().includes(rawQuery.toLowerCase())) {
        wallets.push({
          id: `user-wallet-${u._id}`,
          name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
          type: `${u.role || "user"} Wallet`,
          address: u.walletAddress,
          network: "Ethereum Sepolia",
        });
      }
    });

    // 4. Match System Pages / Shortcuts
    const allPages = [
      { id: "p-projects", title: "Browse Projects Catalog", category: "Navigation", path: "/projects", icon: "folder" },
      { id: "p-create-project", title: "Post a New Project", category: "Navigation", path: "/projects/create", icon: "plus" },
      { id: "p-my-projects", title: "My Posted Projects", category: "Navigation", path: "/my-projects", icon: "briefcase" },
      { id: "p-workrooms", title: "Active Workrooms & Messages", category: "Navigation", path: "/chat", icon: "message" },
      { id: "p-settings", title: "Account Settings & Email Verification", category: "Navigation", path: "/settings", icon: "settings" },
      { id: "p-profile", title: "Public Profile & Financial Metrics", category: "Navigation", path: "/profile", icon: "user" },
    ];

    const matchedPages = allPages.filter(
      (p) => p.title.toLowerCase().includes(rawQuery.toLowerCase()) || p.category.toLowerCase().includes(rawQuery.toLowerCase())
    );

    res.json({
      query: rawQuery,
      projects: projects.map((p) => ({
        id: p._id,
        title: p.title,
        category: p.category,
        description: p.description,
        budget: p.budget,
        status: p.status,
        clientName: p.clientId ? `${p.clientId.firstName || ""} ${p.clientId.lastName || ""}`.trim() : "Client",
      })),
      users: users.map((u) => ({
        id: u._id,
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.email,
        email: u.email,
        role: u.role,
        skills: u.skills || [],
        bio: u.bio || "",
        walletAddress: u.walletAddress || "",
      })),
      wallets,
      pages: matchedPages,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
