// Example fixture for bc-security evals. Not real code.
const db = require('./db');

async function findUserByName(req, res) {
  const name = req.query.name;
  const sql = "SELECT id, name, email FROM users WHERE name = '" + name + "'";
  const rows = await db.query(sql);
  res.json(rows);
}

module.exports = { findUserByName };
