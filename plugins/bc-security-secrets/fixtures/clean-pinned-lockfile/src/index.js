const ms = require('ms');
const secret = process.env.SESSION_SECRET;
if (!secret) throw new Error('SESSION_SECRET is required');
console.log(ms('2 days'));
