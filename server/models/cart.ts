import { defineMongooseModel } from '#nuxt/mongoose'
import { Schema } from 'mongoose'
import { Cart, CartItem } from '~/types/Cart'

export const CartItemSchema = defineMongooseModel<CartItem>({
  name: 'CartItem',
  schema: {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    cartId: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
    }
  },
  options: {
    timestamps: true,
  },
})

export const CartSchema = defineMongooseModel<Cart>({
  name: 'Cart',
  schema: {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    community: {
      type: String,
      required: true
    },
    items: [
      {
        type: Schema.Types.ObjectId,
        ref: 'CartItem',
      },
    ],
  },
  options: {
    timestamps: true,
  },
})