// src/pages/api/store-otu.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/mysql";
import crypto from "crypto";

const SECRET_SALT = process.env.OTU_SECRET_SALT || "secure_voting_salt";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { aadhaar, voterId } = req.body;

  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, message: "Missing Aadhaar or Voter ID." });
  }

  try {
    // Step 1: Check if OTU already exists
    const [existing]: any = await db.query(
      "SELECT otu, otu_expires_at FROM voters WHERE aadhaar = ? AND voter_id = ?",
      [aadhaar, voterId]
    );

    if (existing.length && existing[0].otu && new Date(existing[0].otu_expires_at) > new Date()) {
      return res.status(200).json({
        success: true,
        message: "OTU already exists and is still valid.",
        otu: existing[0].otu,
      });
    }

    // Step 2: Generate new OTU
    const rawOtu = crypto.randomBytes(32).toString("hex");
    const hashedOtu = crypto.createHash("sha256").update(rawOtu).digest("hex");

    // Step 3: Set expiration and generate confirmation key
    const expirationTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const confirmKey = crypto.createHash("sha256").update(hashedOtu + SECRET_SALT).digest("hex");

    // Step 4: Store OTU and confirmation key
    await db.query(
      "UPDATE voters SET otu = ?, otu_expires_at = ?, vote_confirm_key = ? WHERE aadhaar = ? AND voter_id = ?",
      [hashedOtu, expirationTime, confirmKey, aadhaar, voterId]
    );

    return res.status(200).json({
      success: true,
      message: "OTU stored successfully.",
      otu: hashedOtu,
      confirmKey,
      expiresAt: expirationTime,
    });
  } catch (error) {
    console.error("OTU Store Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}