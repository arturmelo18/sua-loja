import { StoreSchema } from '~/server/models/store'
import { generateCdnImage } from '~/server/helpers/generateCdnImage'

export default defineEventHandler(async (event) => {
    const { ownerId, name, store, color, slides } = await readBody(event)
    const normalizedStore = String(store || '').trim().replace(/^@/, '').toLowerCase()
    const normalizedColor = String(color || '#7A1F2E').trim().toUpperCase()

    if (!ownerId || !name || !normalizedStore || !slides?.length) {
        throw createError({ statusCode: 400, statusMessage: 'ownerId, name, store e slides são obrigatórios' })
    }

    if (!/^#[0-9A-F]{6}$/.test(normalizedColor)) {
        throw createError({ statusCode: 400, statusMessage: 'A cor deve estar no formato hexadecimal' })
    }

    try {
        const processedSlides = await Promise.all(
            slides.map(async (slide: any) => {
                if (slide.image?.startsWith('data:')) {
                    const cdn = await generateCdnImage(slide.image)
                    return { ...slide, image: cdn.url }
                }
                return slide
            })
        )

        const store = await StoreSchema.findOneAndUpdate(
            { ownerId: String(ownerId) },
            { ownerId: String(ownerId), name, store: normalizedStore, color: normalizedColor, slides: processedSlides },
            { new: true, upsert: true }
        )

        return store
    } catch (e) {
        console.error(e)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar loja' })
    }
})