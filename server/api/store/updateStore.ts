import { StoreSchema } from '~/server/models/store'
import { generateCdnImage } from '~/server/helpers/generateCdnImage'

export default defineEventHandler(async (event) => {
    const { ownerId, name, store: storeSlug, color, slides } = await readBody(event)
    const normalizedStore = String(storeSlug || '').trim().replace(/^@/, '').toLowerCase()
    const normalizedColor = String(color || '#7A1F2E').trim().toUpperCase()

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

        const existingStore = await StoreSchema.findOne({ ownerId: String(ownerId) })
        const isApproved = existingStore?.approvalStatus === 'approved'
        const approvalStatus = isApproved ? 'approved' : 'pending'
        const updatedStore = await StoreSchema.findOneAndUpdate(
            { ownerId: String(ownerId) },
            { ownerId: String(ownerId), name, store: normalizedStore, color: normalizedColor, slides: processedSlides, active: isApproved, approvalStatus },
            { new: true, upsert: true }
        )

        await UserSchema.findByIdAndUpdate(String(ownerId), { store: normalizedStore })
        return updatedStore
    } catch (e) {
        console.error(e)
        throw createError({ statusCode: 500, statusMessage: 'Erro ao atualizar loja' })
    }
})