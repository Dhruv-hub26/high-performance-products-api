import express, { Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import pool, { query } from './db';
import { PaginatedProductsResponse, ProductRow } from './types/product';
import { decodeCursor, encodeCursor } from './utils/cursor';

dotenv.config();

const app = express();
const port = Number.parseInt(process.env.PORT ?? '3000', 10);

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

app.use(express.json());

function parseLimit(rawLimit: unknown): number {
  if (rawLimit === undefined || rawLimit === null || rawLimit === '') {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(String(rawLimit), 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    throw new Error('Invalid limit parameter');
  }

  return Math.min(parsed, MAX_LIMIT);
}

const productsRouter = Router();

productsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const limit = parseLimit(req.query.limit);
    const category =
      typeof req.query.category === 'string' && req.query.category.trim() !== ''
        ? req.query.category.trim()
        : null;

    let cursorCreatedAt: Date | null = null;
    let cursorId: number | null = null;

    if (typeof req.query.cursor === 'string' && req.query.cursor.trim() !== '') {
      const cursor = decodeCursor(req.query.cursor.trim());
      cursorCreatedAt = cursor.createdAt;
      cursorId = cursor.id;
    }

    const values: Array<string | number | Date | null> = [
      category,
      cursorCreatedAt,
      cursorId,
      limit + 1,
    ];

    const sql = `
      SELECT id, name, category, price, created_at, updated_at
      FROM products
      WHERE ($1::text IS NULL OR category = $1)
        AND (
          $2::timestamptz IS NULL
          OR created_at < $2
          OR (created_at = $2 AND id < $3)
        )
      ORDER BY created_at DESC, id DESC
      LIMIT $4
    `;

    const { rows } = await query(sql, values);
    const hasMore = rows.length > limit;
    const pageRows = (hasMore ? rows.slice(0, limit) : rows) as ProductRow[];

    const lastRow = pageRows[pageRows.length - 1];
    const nextCursor =
      hasMore && lastRow
        ? encodeCursor({ createdAt: lastRow.created_at, id: lastRow.id })
        : null;

    const response: PaginatedProductsResponse = {
      data: pageRows.map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        price: row.price,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      meta: {
        limit,
        hasMore,
        nextCursor,
      },
    };

    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    const status =
      message.includes('cursor') || message.includes('limit') ? 400 : 500;
    res.status(status).json({ error: message });
  }
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/products', productsRouter);

async function start(): Promise<void> {
  await query('SELECT 1');
  console.log('✅ Database connection established');

  app.listen(port, () => {
    console.log(`🚀 Server listening on http://localhost:${port}`);
  });
}

start().catch((err: unknown) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
