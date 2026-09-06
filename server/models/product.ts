import { defineMongooseModel } from '#nuxt/mongoose'
import { Product } from '~/types/Product'

export const ProductSchema = defineMongooseModel<Product>({
  name: 'Product',
  schema: {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    store: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    published: {
      type: Boolean,
      required: true,
      default: true
    },
    active: {
      type: Boolean,
      required: true,
      default: true,
    },
    abacatePayId: {
      type: String,
      default: null,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
  },
  options: {
    timestamps: true,
  },
})
