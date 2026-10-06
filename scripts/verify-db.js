const fs = require('fs');
const mongoose = require('mongoose');

const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const idx = line.indexOf('MONGODB_URI=');
    if (idx !== -1) {
      process.env.MONGODB_URI = line.slice(idx + 'MONGODB_URI='.length).trim();
    }
  });
}

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => mongoose.connection.db.admin().ping())
  .then(() => {
    console.log('MongoDB verified: connected + ping ok');
    process.exit(0);
  })
  .catch(e => {
    console.error('MongoDB verification failed:', e.message);
    process.exit(1);
  });
