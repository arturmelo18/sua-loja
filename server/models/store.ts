import { defineMongooseModel } from '#nuxt/mongoose'
import type { Store } from '~/types/Store'

export const StoreSchema = defineMongooseModel<Store>({
    name: 'Store',
    schema: {
        name: {
            type: String,
            required: true,
        },
        store: {
            type: String,
            required: true
        },
        slides: [
            {
                title: { type: String, required: true },
                description: { type: String, default: '' },
                image: { type: String, required: true },
            },
        ],
    },
    options: { timestamps: true },
})