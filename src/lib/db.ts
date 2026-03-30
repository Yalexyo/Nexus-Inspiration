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
                category TEXT NOT NULL DEFAULT '政策',
                subcategory TEXT DEFAULT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                source TEXT DEFAULT NULL,
                source_text TEXT NOT NULL DEFAULT '',
                design_insight TEXT NOT NULL DEFAULT '',
                assets JSONB NOT NULL DEFAULT '[]'::jsonb,
                tags JSONB NOT NULL DEFAULT '[]'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        // Add subcategory column if table already exists without it
        await client.query(`
            ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS subcategory TEXT DEFAULT NULL;
        `);

        // Migration: make subcategory nullable and update default
        await client.query(`
            ALTER TABLE inspirations ALTER COLUMN subcategory DROP NOT NULL;
        `).catch(() => {}); // Ignore if already nullable
        await client.query(`
            ALTER TABLE inspirations ALTER COLUMN subcategory SET DEFAULT NULL;
        `);

        // Migration: English categories → Chinese
        await client.query(`
            UPDATE inspirations SET category = '政策' WHERE category = 'Policy';
        `);
        await client.query(`
            UPDATE inspirations SET category = '经济' WHERE category = 'Economy';
        `);
        await client.query(`
            UPDATE inspirations SET category = '社会' WHERE category = 'Sustainability';
        `);
        await client.query(`
            UPDATE inspirations SET category = '技术' WHERE category = 'Technology';
        `);

        // Migration: 平面 → 其他
        await client.query(`
            UPDATE inspirations SET subcategory = '其他' WHERE subcategory = '平面';
        `);

        // Migration: non-设计灵感 rows should have subcategory = NULL
        await client.query(`
            UPDATE inspirations SET subcategory = NULL WHERE category != '设计灵感';
        `);

        // Add source, source_text, design_insight columns if missing
        await client.query(`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT NULL;`);
        await client.query(`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS source_text TEXT NOT NULL DEFAULT '';`);
        await client.query(`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS design_insight TEXT NOT NULL DEFAULT '';`);

        console.log('Database initialized: inspirations table ready');
    } finally {
        client.release();
    }
}
