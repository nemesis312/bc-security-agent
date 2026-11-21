// Example fixture for bc-security evals. Not real code.
const { exec } = require('child_process');

function listFolder(req, res) {
  const folder = req.query.folder;
  exec('ls -la ' + folder, (err, stdout) => {
    if (err) return res.status(500).send('error');
    res.type('text/plain').send(stdout);
  });
}

module.exports = { listFolder };
