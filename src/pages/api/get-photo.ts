// /src/pages/api/get-photo.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/mysql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { aadhaar, voterId } = req.query;

  if (!aadhaar || !voterId) {
    return res.status(400).json({ success: false, message: "Missing Aadhaar or Voter ID" });
  }

  try {
    const [rows]: any = await db.query(
      "SELECT photo FROM voters WHERE aadhaar = ? AND voter_id = ?",
      [aadhaar, voterId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ success: false, message: "Photo not found" });
    }

    const photoBuffer = rows[0].photo;

    res.setHeader("Content-Type", "image/jpeg");
    res.send(photoBuffer);
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
