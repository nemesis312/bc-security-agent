import { pool } from "./db";

const SORTABLE = new Set(["created_at", "total"]);

// customerId comes from the verified session, never from the request body or query.
export async function listCustomerOrders(customerId: string, status: string, sort: string) {
  const column = SORTABLE.has(sort) ? sort : "created_at";
  const result = await pool.query(
    `SELECT id, total, status FROM orders WHERE customer_id = $1 AND status = $2 ORDER BY ${column} DESC LIMIT 50`,
    [customerId, status],
  );
  return result.rows;
}
