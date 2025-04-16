import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/mysql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { aadhaar, voterId, otu } = req.body;

  if (!aadhaar || !voterId || !otu) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    await db.query("UPDATE voters SET otu = ? WHERE aadhaar = ? AND voter_id = ?", [
      otu,
      aadhaar,
      voterId,
    ]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to store OTU:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
