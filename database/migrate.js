const fs = require('node:fs');
const path = require('node:path');
const {Client} = require('pg');

async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL !== 'false' ? {rejectUnauthorized: true} : false
  });
  try {
    await client.connect();
    const sql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    console.log('Esquema PostgreSQL aplicado correctamente');
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch {}
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(error => {
  console.error('No se pudo aplicar el esquema:', error.message);
  process.exit(1);
});
