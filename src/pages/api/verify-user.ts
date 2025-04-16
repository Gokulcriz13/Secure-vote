import type { NextApiRequest, NextApiResponse } from "next";
import db from "@/lib/mysql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { aadhaar, voterId } = req.body;

  try {
    const [rows]: any = await db.query(
      "SELECT name, phone FROM voters WHERE aadhaar = ? AND voter_id = ?",
      [aadhaar, voterId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { phone, name } = rows[0];
    return res.status(200).json({ success: true, phone, name });
  } catch (error) {
    console.error("DB Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
