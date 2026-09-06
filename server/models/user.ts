import { defineMongooseModel } from '#nuxt/mongoose'
import { AddressSchema } from './address'
import type { User } from '../../types/User'

export const UserSchema = defineMongooseModel<User>({
  name: 'User',
  schema: {
    name: {
      type: String,
      required: true,
    },
    store: {
      type: String,
      required: false,
      default: ''
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    recoveryCodeHash: {
      type: String,
      select: false,
    },
    recoveryCodeExpiresAt: {
      type: Date,
      select: false,
    },
    recoveryCodeAttempts: {
      type: Number,
      select: false,
      default: 0,
    },
    kind: {
      type: String,
      required: true,
      enum: ['admin', 'user', 'superadmin'],
    },
    address: {
      type: AddressSchema,
      required: true,
    },
  },
  options: {
    timestamps: true,
  },
})
