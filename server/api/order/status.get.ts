import { OrderSchema } from '~/server/models/order'

export default defineEventHandler(async (event) => {
  const externalId = String(getQuery(event).externalId || '').trim()

  if (!externalId) {
    throw createError({ statusCode: 400, statusMessage: 'externalId é obrigatório' })
  }

  const order = await OrderSchema.findOne({ externalId }).select('status').lean()

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pedido não encontrado' })
  }

  return { status: order.status }
})
