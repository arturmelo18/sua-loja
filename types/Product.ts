export interface ProductVariant {
  name: string
  quantity: number
}

export interface Product {
  _id: string
  store: string
  name: string
  price: number
  quantity: number
  category?: string
  variants?: ProductVariant[]
  published: boolean
  active: boolean
  abacatePayId?: string
  description?: string
  image?: string
  createdAt?: Date
  updatedAt?: Date
}
