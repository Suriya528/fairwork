const Contract = require("../models/Contract");
const Project = require("../models/Project");
const { GoogleGenAI } = require("@google/genai");

// Initialize Google Gemini AI client using GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generate a professional freelance contract using Google Gemini AI
 */
exports.generateContract = async (req, res) => {
  try {
    const { projectId } = req.body;
    const project = await Project.findById(projectId).populate("clientId", "firstName lastName");

    if (!project) return res.status(404).json({ message: "Project not found" });

    if (String(project.clientId._id || project.clientId) !== String(req.user.id)) {
      return res.status(403).json({ message: "Only the project client can generate a contract" });
    }

    const freelancerId = project.freelancerId || req.body.freelancerId;
    if (!freelancerId) {
      return res.status(400).json({
        message: "No freelancer has been hired for this project yet. Please hire a freelancer from applications first.",
      });
    }

    const prompt = `Generate a professional freelance contract for the following project:

Title: ${project.title}
Description: ${project.description}
Budget: $${project.budget}
Client: ${project.clientId.firstName} ${project.clientId.lastName}
Milestones: ${JSON.stringify(project.milestones || [])}

Include these sections:
1. Project Scope
2. Payment Terms
3. Milestones & Deadlines
4. Deliverables
5. Intellectual Property
6. Termination Clause
7. Dispute Resolution

Make it professional, comprehensive, and legally structured.`;

    let aiGeneratedText = "";

    if (ai) {
      const modelsToTry = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.5-flash-lite"];
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
          });
          if (response && response.text) {
            aiGeneratedText = response.text;
            break;
          }
        } catch (genErr) {
          console.warn(`Gemini contract generation warning with model ${model}:`, genErr.message);
        }
      }
    }

    // Fallback template generator if AI response fails or API key is unconfigured
    if (!aiGeneratedText.trim()) {
      aiGeneratedText = `FREELANCE SERVICES AGREEMENT

1. PROJECT SCOPE
Project Title: ${project.title}
Description: ${project.description}

2. PAYMENT TERMS
Total Project Budget: $${project.budget}
Payment Model: Escrow-protected milestone payouts upon client review and approval.

3. MILESTONES & DELIVERABLES
${(project.milestones || []).map((m, idx) => `Milestone ${idx + 1}: ${m.title || "Deliverable"} - $${m.amount || 0}`).join("\n") || "Deliverables as defined in project scope."}

4. INTELLECTUAL PROPERTY & TERMINATION
All deliverables and intellectual property belong strictly to the Client upon milestone payment release.
Either party may initiate dispute resolution or contract termination through the FairWork Escrow Protocol.`;
    }

    const contract = await Contract.create({
      projectId,
      clientId: req.user.id,
      freelancerId,
      aiGeneratedText,
    });

    await Project.findByIdAndUpdate(projectId, { contractId: contract._id, freelancerId });

    res.status(201).json(contract);
  } catch (err) {
    console.error("Contract generation error:", err);
    res.status(500).json({ message: err.message || "Failed to generate contract" });
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
