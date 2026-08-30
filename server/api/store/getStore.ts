import { StoreSchema } from '~/server/models/store'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const rawCommunity = String(query.community || '').trim()
    const community = rawCommunity.replace(/^@/, '')

    const filter = community ? { community } : {}
    const store = await StoreSchema.findOne(filter).lean()

    return store ?? null
})