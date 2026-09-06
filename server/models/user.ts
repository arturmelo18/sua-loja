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
      required: true,
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
    kind: {
      type: String,
      required: true,
      enum: ['admin', 'user'],
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
