import type { Address } from './Address'

export interface User {
  _id: string
  store?: string
  name: string
  email: string
  password?: string
  recoveryCodeHash?: string
  recoveryCodeExpiresAt?: Date
  recoveryCodeAttempts?: number
  kind: 'user' | 'admin' | 'superadmin'
  address: Address
  createdAt: Date
  updatedAt: Date
}
