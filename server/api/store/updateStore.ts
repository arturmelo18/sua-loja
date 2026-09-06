import { StoreSchema } from '~/server/models/store'
import { generateCdnImage } from '~/server/helpers/generateCdnImage'

export default defineEventHandler(async (event) => {
    const { name, store, slides } = await readBody(event)
    const normalizedStore = String(store || '').trim().replace(/^@/, '').toLowerCase()

    if (!name || !normalizedStore || !slides?.length) {
        throw createError({ statusCode: 400, statusMessage: 'name, store e slides são obrigatórios' })
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
            {},
            { name, community: normalizedCommunity, slides: processedSlides },
            { new: true, upsert: true }
        )

        return store
    } catch (e) {
        console.error(e)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar loja' })
    }
})