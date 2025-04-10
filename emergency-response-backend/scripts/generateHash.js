const bcrypt = require('bcryptjs');

const passwords = ['admin123', 'user123', 'responder123'];

async function generateHashes() {
  for (const password of passwords) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}\n`);
  }
}

generateHashes(); 