import { StoreSchema } from '~/server/models/store'
import { generateCdnImage } from '~/server/helpers/generateCdnImage'

export default defineEventHandler(async (event) => {
    const { name, slides } = await readBody(event)

    if (!name || !slides?.length) {
        throw createError({ statusCode: 400, statusMessage: 'name e slides são obrigatórios' })
    }

    try {
        // Processa imagens novas (base64) e mantém URLs já existentes
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
            { name, slides: processedSlides },
            { new: true, upsert: true }  // cria se não existir
        )

        return store
    } catch (e) {
        console.error(e)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar loja' })
    }
})