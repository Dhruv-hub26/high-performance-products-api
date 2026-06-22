import pool, { query } from './db';

const TOTAL_RECORDS = 200_000;
const CHUNK_SIZE = 20_000;

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Toys',
  'Beauty',
  'Automotive',
  'Health',
  'Food',
] as const;

function buildChunk(startIndex: number, size: number) {
  const names: string[] = [];
  const categories: string[] = [];
  const prices: string[] = [];
  const createdAts: Date[] = [];
  const updatedAts: Date[] = [];
  const baseTime = Date.now();

  for (let offset = 0; offset < size; offset += 1) {
    const recordIndex = startIndex + offset;
    names.push(`Product ${recordIndex + 1}`);
    categories.push(CATEGORIES[recordIndex % CATEGORIES.length]);
    prices.push((Math.random() * 999 + 1).toFixed(2));
    const timestamp = new Date(baseTime - recordIndex * 1000);
    createdAts.push(timestamp);
    updatedAts.push(timestamp);
  }

  return { names, categories, prices, createdAts, updatedAts };
}

async function seed(): Promise<void> {
  const startedAt = Date.now();
  console.log('🌱 Seeding 200,000 products via unnest batch inserts...');

  await query('TRUNCATE TABLE products RESTART IDENTITY');

  const insertSql = `
    INSERT INTO products (name, category, price, created_at, updated_at)
    SELECT *
    FROM unnest(
      $1::varchar[],
      $2::varchar[],
      $3::numeric[],
      $4::timestamptz[],
      $5::timestamptz[]
    )
  `;

  for (let startIndex = 0; startIndex < TOTAL_RECORDS; startIndex += CHUNK_SIZE) {
    const chunkSize = Math.min(CHUNK_SIZE, TOTAL_RECORDS - startIndex);
    const chunk = buildChunk(startIndex, chunkSize);

    await query(insertSql, [
      chunk.names,
      chunk.categories,
      chunk.prices,
      chunk.createdAts,
      chunk.updatedAts,
    ]);

    console.log(`  → ${startIndex + chunkSize}/${TOTAL_RECORDS}`);
  }

  const { rows } = await query('SELECT COUNT(*)::text AS count FROM products');

  console.log(`✅ Seeded ${rows[0].count} products in ${Date.now() - startedAt}ms`);
  await pool.end();
  process.exit(0);
}

seed().catch(async (err: unknown) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
