import type { Request, Response } from "express";
import { pool } from "./db";

export async function searchOrders(req: Request, res: Response) {
  const status = String(req.query.status ?? "open");
  const sql = "SELECT id, total, status FROM orders WHERE status = '" + status + "' ORDER BY id";
  const result = await pool.query(sql);
  res.json(result.rows);
}
