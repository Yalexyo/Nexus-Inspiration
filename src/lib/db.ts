import { Pool } from 'pg';

const pool = new Pool({
    host: process.env.DB_HOST || '172.20.58.37',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'mydb',
    user: process.env.DB_USER || 'postgreadmin',
    password: process.env.DB_PASSWORD || 'PostGre@123',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

export default pool;

export async function initDatabase() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS inspirations (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'Policy',
                subcategory TEXT NOT NULL DEFAULT '产品',
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                assets JSONB NOT NULL DEFAULT '[]'::jsonb,
                tags JSONB NOT NULL DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        // Add subcategory column if table already exists without it
        await client.query(`
            ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS subcategory TEXT NOT NULL DEFAULT '产品';
        `);
        console.log('Database initialized: inspirations table ready');
    } finally {
        client.release();
    }
}
