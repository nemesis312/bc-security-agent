// bc-security fixture: intentionally fake credential
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
  },
});

async function saveReport(name, body) {
  await client.send(new PutObjectCommand({ Bucket: 'acme-reports', Key: name, Body: body }));
}

module.exports = { saveReport };
