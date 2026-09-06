import type { Product } from "./Product";
import type { User } from "./User";

export interface Cart {
    _id: string
    store: string
    user: User
    items: CartItem[]
    createdAt: Date
    updatedAt: Date
}

export interface CartItem {
  _id: string
  product: Product
  quantity: number
  cartId: string
  price: number
  createdAt: Date
  updatedAt: Date
}