import { defineMongooseModel } from '#nuxt/mongoose'
import type { Store } from '~/types/Store'

export const StoreSchema = defineMongooseModel<Store>({
    name: 'Store',
    schema: {
        ownerId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        store: {
            type: String,
            required: true
        },
        color: {
            type: String,
            default: '#7A1F2E'
        },
        active: {
            type: Boolean,
            default: true,
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