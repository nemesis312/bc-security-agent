// Example fixture for bc-security evals. Not real code.
const db = require('./db');

async function searchOrders(req, res) {
  const status = req.query.status;
  const rows = await db.query("SELECT id, total FROM orders WHERE status = '" + status + "'");
  res.json(rows);
}

module.exports = { searchOrders };
