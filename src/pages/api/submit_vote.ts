import type { NextApiRequest, NextApiResponse } from "next";
import mysql from "mysql2/promise";
import crypto from "crypto";
import { db } from "@/lib/mysql";

const OTU_EXPIRY_MINUTES = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { hashed_otu, vote } = req.body;

  if (!hashed_otu || !vote) {
    return res.status(400).json({ success: false, message: "Missing hashed OTU or vote" });
  }

  try {
    const connection = await mysql.createConnection(db);

    // Find user by matching hashed OTU
    const [rows] = await connection.execute<any[]>(
      `SELECT * FROM voters WHERE SHA2(otu, 256) = ? LIMIT 1`,
      [hashed_otu]
    );

    const voter = rows[0];

    if (!voter) {
      return res.status(404).json({ success: false, message: "Invalid OTU" });
    }

    if (voter.otu_used) {
      return res.status(403).json({ success: false, message: "OTU already used" });
    }

    const createdAt = new Date(voter.otu_created_at);
    const now = new Date();
    const diffMinutes = (now.getTime() - createdAt.getTime()) / 60000;

    if (diffMinutes > OTU_EXPIRY_MINUTES) {
      return res.status(403).json({ success: false, message: "OTU expired" });
    }

    // Mark OTU as used and optionally store the vote
    await connection.execute(
      `UPDATE voters SET otu_used = TRUE WHERE id = ?`,
      [voter.id]
    );

    // You can store the vote in a blockchain or another DB table
    await connection.execute(
      `INSERT INTO votes (voter_id, vote_data, submitted_at) VALUES (?, ?, NOW())`,
      [voter.id, vote]
    );

    res.status(200).json({ success: true, message: "Vote submitted successfully" });
  } catch (error) {
    console.error("Vote submission error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
