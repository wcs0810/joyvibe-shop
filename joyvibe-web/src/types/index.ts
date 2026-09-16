export interface Seller {
  id: string;
  name: string;
  logo: string;
  rating: number;
  sales: number;
  location: string;
  description: string;
  established: string;
  isOfficial: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  sellerId: string;
  price: number;
  originalPrice?: number;
  image: string;
  imageUrl?: string;
  tags?: string[];
  rating: number;
  sales: number;
  inventory: number;
  description: string;
  specs?: Record<string, string>;
}

export interface CartItem {
  product: Product;
  quantity: number;
  saved?: boolean;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}
