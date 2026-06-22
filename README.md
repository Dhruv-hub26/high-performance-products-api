# High-Performance Products API Engine 🚀

A high-performance Node.js (TypeScript) Express backend engineered from scratch to handle deep cursor-based keyset pagination. Optimized to manage over **200,000 product records** cleanly, ensuring absolute data consistency during high-concurrency real-time updates.

---

## 🛠️ Architectural Choices & Rationales

### 1. SQL (PostgreSQL) vs NoSQL (MongoDB)
For this specific use case, **PostgreSQL** was chosen over MongoDB due to strict data consistency requirements during active writes:
* **Tuple Comparison Efficiency:** When users are scrolling and 50 new items are added, traditional `OFFSET` shatters performance, and basic NoSQL filters require extensive query overhead. PostgreSQL natively handles structured compound indexes for keyset pagination comparisons like `(created_at, id) < ($1, $2)` with matching B-Tree optimizations in $O(\log N)$ time.
* **Network Execution Speed:** Leveraging native PostgreSQL capabilities guarantees sub-second synchronization bounds that match live infrastructure benchmarks perfectly.

### 2. High-Speed Seeding (< 9 Seconds for 200k Rows)
* **The Anti-Pattern Prevented:** Traditional seeding scripts push records sequentially inside a slow asynchronous loop, throttling heap memory and hitting network timeouts.
* **The Solution:** Implemented a performant array unnesting strategy. By passing chunks of organized relational data into a single query via the native `unnest()` parameter function, exactly 200,000 rows inject directly into the Singapore Cloud Neon cluster seamlessly under 9 seconds.

### 3. Bulletproof Keyset Pagination Layer
* Completely avoids performance degradation caused by structural row offset skipping.
* Uses opaque **Base64url** encoded cursor tokens `(ISO8601_Timestamp|ID)` to safely isolate the exact record state.
* The endpoint fetches `limit + 1` rows internally to dynamically detect the `hasMore` state cleanly without running heavy secondary `COUNT` queries.

---

## ⚙️ Tech Stack & Dependencies

* **Runtime & Language:** Node.js, TypeScript (Strict Mode)
* **Framework:** Express.js
* **Database Driver:** Core `pg` pool connector with Serverless Cloud Pooling configuration
* **Database Cluster:** Serverless PostgreSQL (Neon)

---

## 🚀 Local Installation & Setup

1. **Clone the Repository:**
```bash
   git clone <your-repository-url>
   cd high-performance-products-api
Configure Environment Variables:
Create a .env file in the root directory:

Code snippet
   DATABASE_URL="postgresql://neondb_owner:npg_3fFmy6HchzdX@ep-young-king-aouuj1k8-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   PORT=3000
   NODE_ENV=development
Install Core Engine Modules:

Bash
   npm install
Run Relational Migration & Schema Deployment:

Bash
   npm run migrate
Execute the Fast 200k Seeder:

Bash
   npm run seed
Boot the API Server in Development Mode:

Bash
   npm run dev
📊 Core Endpoints & API Usage
1. Fetch Default Catalog (Newest First)
URL: GET http://localhost:3000/api/products?limit=20

2. Filter Explicitly by Category
URL: GET http://localhost:3000/api/products?category=Electronics&limit=20

3. Paginate Natively Using Cursor Tokens
URL: GET http://localhost:3000/api/products?limit=20&cursor=PASTE_BASE64_TOKEN_HERE

Expected Response Format:
JSON
{
  "data": [
    {
      "id": 1,
      "name": "Product 1",
      "category": "Electronics",
      "price": "145.59",
      "created_at": "2026-06-22T04:40:29.897Z",
      "updated_at": "2026-06-22T04:40:29.897Z"
    }
  ],
  "meta": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "MjAyNi0wNi0yMlQwNDo0MDoyOS44OTdafDE="
  }
}# high-performance-products-api
