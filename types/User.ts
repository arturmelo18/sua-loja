import type { Address } from './Address'

export interface User {
  _id: string
   community: string
  name: string
  email: string
  password: string
  kind: 'user' | 'admin'
  address: Address
  createdAt: Date
  updatedAt: Date
}
