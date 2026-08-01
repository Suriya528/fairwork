const Contract = require("../models/Contract");
const Project = require("../models/Project");
const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

exports.generateContract = async (req, res) => {
  try {
    const { projectId, freelancerId } = req.body;
    const project = await Project.findById(projectId).populate("clientId", "firstName lastName");

    if (!project) return res.status(404).json({ message: "Project not found" });

    const prompt = `Generate a professional freelance contract for the following project:

Title: ${project.title}
Description: ${project.description}
Budget: $${project.budget}
Client: ${project.clientId.firstName} ${project.clientId.lastName}
Milestones: ${JSON.stringify(project.milestones)}

Include these sections:
1. Project Scope
2. Payment Terms
3. Milestones & Deadlines
4. Deliverables
5. Intellectual Property
6. Termination Clause
7. Dispute Resolution

Make it professional and legally structured.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const aiGeneratedText = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    const contract = await Contract.create({
      projectId,
      clientId: req.user.id,
      freelancerId,
      aiGeneratedText,
    });

    await Project.findByIdAndUpdate(projectId, { contractId: contract._id });

    res.status(201).json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("clientId", "firstName lastName")
      .populate("freelancerId", "firstName lastName")
      .populate("projectId", "title");
    if (!contract) return res.status(404).json({ message: "Contract not found" });
    res.json(contract);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.signContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: "Contract not found" });

    const update = contract.clientId.toString() === req.user.id
      ? { signedByClient: true }
      : { signedByFreelancer: true };

    const updated = await Contract.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};