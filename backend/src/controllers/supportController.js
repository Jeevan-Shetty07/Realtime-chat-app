import Support from "../models/Support.js";

// @desc    Create a new support issue
// @route   POST /api/support
// @access  Private
export const createIssue = async (req, res) => {
  try {
    const { subject, message } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: "Please provide subject and message" });
    }

    const issue = await Support.create({
      user: req.user._id,
      subject,
      message,
    });

    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all support issues
// @route   GET /api/support
// @access  Private/Admin
export const getAllIssues = async (req, res) => {
  console.log("👉 GET /api/support ENTERED by user:", req.user?.email, "isAdmin:", req.user?.isAdmin);
  try {
    const issues = await Support.find()
      .populate("user", "name email username avatar")
      .sort({ createdAt: -1 });

    console.log(`✅ Found ${issues.length} issues in DB`);
    res.status(200).json(issues);
  } catch (error) {
    console.error("❌ ERROR in getAllIssues:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update support issue status or add response
// @route   PATCH /api/support/:id
// @access  Private/Admin
export const updateIssue = async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const issue = await Support.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found" });
    }

    if (status) issue.status = status;
    if (adminResponse) issue.adminResponse = adminResponse;

    const updatedIssue = await issue.save();
    res.status(200).json(updatedIssue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's support issues
// @route   GET /api/support/my-issues
// @access  Private
export const getMyIssues = async (req, res) => {
  try {
    const issues = await Support.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
