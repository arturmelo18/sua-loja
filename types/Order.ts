import type { CartItem } from './Cart'
import type { User } from './User'

export interface Order {
  _id: string
  store: string
  user: User
  items: CartItem[]
  total: number
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'REFUNDED'
  readyForPickup: boolean
  saleCode: string
  abacatePayCheckoutId: string
  abacatePayCheckoutUrl: string
  externalId: string
  createdAt: Date
  updatedAt: Date
}