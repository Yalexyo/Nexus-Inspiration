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

        // Migration: rename 设计灵感 → 创意
        await client.query(`
            UPDATE inspirations SET category = '创意' WHERE category = '设计灵感';
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

        // Migration: non-创意 rows should have subcategory = NULL
        await client.query(`
            UPDATE inspirations SET subcategory = NULL WHERE category != '创意';
        `);

        // Migration: existing records without a valid Chinese category → 创意/其他
        await client.query(`
            UPDATE inspirations SET category = '创意', subcategory = '其他'
            WHERE category NOT IN ('政策', '经济', '社会', '技术', '创意');
        `);
        // Migration: records already in 创意 but missing subcategory → 其他
        await client.query(`
            UPDATE inspirations SET subcategory = '其他'
            WHERE category = '创意' AND (subcategory IS NULL OR subcategory = '');
        `);

        // Add source, source_text, design_insight columns if missing
        await client.query(`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS source TEXT DEFAULT NULL;`);
        await client.query(`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS source_text TEXT NOT NULL DEFAULT '';`);
        await client.query(`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS design_insight TEXT NOT NULL DEFAULT '';`);

        // Migration: card_no sequential identifier (for user-friendly URLs and display)
        await client.query(`CREATE SEQUENCE IF NOT EXISTS inspirations_card_no_seq;`);
        await client.query(`ALTER TABLE inspirations ADD COLUMN IF NOT EXISTS card_no INTEGER;`);
        await client.query(`
            WITH ordered AS (
                SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
                FROM inspirations WHERE card_no IS NULL
            )
            UPDATE inspirations SET card_no = ordered.rn
            FROM ordered WHERE inspirations.id = ordered.id;
        `);
        await client.query(`
            SELECT setval('inspirations_card_no_seq',
                          COALESCE((SELECT MAX(card_no) FROM inspirations), 0) + 1, false);
        `);
        await client.query(`ALTER TABLE inspirations ALTER COLUMN card_no SET DEFAULT nextval('inspirations_card_no_seq');`);
        await client.query(`ALTER TABLE inspirations ALTER COLUMN card_no SET NOT NULL;`).catch(() => {});
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS inspirations_card_no_key ON inspirations(card_no);`);

        console.log('Database initialized: inspirations table ready');
    } finally {
        client.release();
    }
}
