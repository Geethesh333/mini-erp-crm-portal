const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

content = content.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
fs.writeFileSync(schemaPath, content, 'utf8');

console.log('✅ Updated prisma/schema.prisma datasource provider to "postgresql".');
console.log('Next: set your DATABASE_URL to your PostgreSQL connection string and run "npx prisma db push && npx tsx prisma/seed.ts".');
