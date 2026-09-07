import { OrderSchema } from '~/server/models/order'

export default defineEventHandler(async (event) => {
    const { orderId, readyForPickup } = await readBody(event)

    if (!orderId || typeof readyForPickup !== 'boolean') {
        throw createError({ statusCode: 400, statusMessage: 'orderId e readyForPickup são obrigatórios' })
    }

    const order = await OrderSchema.findByIdAndUpdate(
        orderId,
        { readyForPickup },
        { new: true }
    )

    if (!order) {
        throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' })
    }

    return { status: 'sucesso', order }
})