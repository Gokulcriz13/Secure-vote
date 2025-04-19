import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { db } from "@/lib/mysql"; // Import the db pool from utils/mysql.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { aadhaar, voterId } = req.body;

  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, message: "Missing Aadhaar or Voter ID" });
  }

  try {
    // Use the db pool to execute the query
    const [rows] = await db.execute<any[]>(`
      SELECT name, aadhaar, voter_id, phone, address, gender, dob, photo, otu, vote_confirm_key
      FROM voters WHERE aadhaar = ? AND voter_id = ?`,
      [aadhaar, voterId]
    );

    const voter = rows[0]; 

    if ((rows as any[]).length === 0) {
      return res.status(404).json({ success: false, message: "Voter not found" });
    }

    const createdAt = new Date(voter.otu_created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 10) {
      return res.status(403).json({ success: false, message: "OTU expired. Please re-authenticate." });
    }

    if (voter.otu_used) {
      return res.status(403).json({ success: false, message: "OTU already used." });
    }

    const hashedOtu = crypto.createHash("sha256").update(voter.otu).digest("hex");

    res.status(200).json({
      success: true,
      voter: {
        ...voter,
        photo: voter.photo?.toString("base64") ?? null,
        otu: undefined,
        hashed_otu: hashedOtu,
      },
    });
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}