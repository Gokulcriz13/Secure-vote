// pages/api/generate-otu.ts

import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { db } from "@/lib/mysql";
import { loadServerModels, processVoterPhoto } from "@/lib/server/face-processing"; // Adjust path as needed

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { aadhaar, voterId } = req.body;

  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, message: "Missing Aadhaar or Voter ID" });
  }

  try {
    await loadServerModels();

    // Check if user exists
    const [rows]: any = await db.query(
      "SELECT * FROM voters WHERE aadhaar = ? AND voter_id = ?",
      [aadhaar, voterId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const voter = rows[0];
    const now = new Date();

    // Check existing OTU
    if (voter.otu && voter.otu_expires_at && new Date(voter.otu_expires_at) > now) {
      return res.status(403).json({ success: false, message: "OTU already generated and active" });
    }

    // Generate and store face descriptor if not already done
    if (!voter.face_descriptor) {
      const descriptorSaved = await processVoterPhoto(voter);
      if (!descriptorSaved) {
        return res.status(422).json({ success: false, message: "Face descriptor generation failed" });
      }
    }

    // Generate OTU
    const rawOtu = crypto.randomBytes(32).toString("hex");
    const hashedOtu = crypto.createHash("sha256").update(rawOtu).digest("hex");
    const otuExpiresAt = new Date(now.getTime() + 10 * 60 * 1000);

    // Store OTU
    await db.query(
      "UPDATE voters SET otu = ?, otu_expires_at = ? WHERE aadhaar = ? AND voter_id = ?",
      [hashedOtu, otuExpiresAt, aadhaar, voterId]
    );

    const privateKey = crypto.createHash("sha256").update(hashedOtu + process.env.MYSQL_USER).digest("hex");

    return res.status(200).json({
      success: true,
      oneTimeURL: `${process.env.BASE_URL}/vote?otu=${hashedOtu}`,
      privateKey,
    });

  } catch (error) {
    console.error("OTU Generation Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
