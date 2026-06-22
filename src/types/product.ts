export interface Product {
  id: number;
  name: string;
  category: string;
  price: string;
  created_at: Date;
  updated_at: Date;
}

export interface ProductRow {
  id: number;
  name: string;
  category: string;
  price: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedProductsResponse {
  data: Product[];
  meta: {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
  };
}

export interface KeysetCursor {
  createdAt: Date;
  id: number;
}
