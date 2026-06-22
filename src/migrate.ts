import { query } from './db';

async function migrate(): Promise<void> {
  console.log('🏁 Executing relational layout migrations...');

  await query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_products_pagination ON products (created_at DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_products_category_pagination ON products (category, created_at DESC, id DESC);
  `);

  console.log('✅ Migrations and high-speed indexing layers successfully deployed.');
  process.exit(0);
}

migrate().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
