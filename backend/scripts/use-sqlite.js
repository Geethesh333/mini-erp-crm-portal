const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let content = fs.readFileSync(schemaPath, 'utf8');

content = content.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
fs.writeFileSync(schemaPath, content, 'utf8');

console.log('✅ Updated prisma/schema.prisma datasource provider to "sqlite".');
