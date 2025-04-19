import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/lib/mysql";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const { otu } = req.body;

  if (!otu) return res.status(400).json({ success: false, message: "OTU missing" });

  try {
    const [rows]: any = await db.query("SELECT * FROM voters WHERE otu = ?", [otu]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid OTU" });
    }

    const user = rows[0];
    const now = new Date();

    if (new Date(user.otu_expires_at) < now) {
      return res.status(401).json({ success: false, message: "OTU expired" });
    }

    // Invalidate OTU
    await db.query("UPDATE voters SET otu = NULL, otu_expires_at = NULL WHERE id = ?", [user.id]);

    return res.status(200).json({ success: true, message: "OTU validated", user });
  } catch (error) {
    console.error("OTU Validation Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}
