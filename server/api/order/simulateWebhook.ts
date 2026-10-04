import { fulfillOrder } from '~/server/helpers/fulfillOrder'

export default defineEventHandler(async (event) => {
  const { externalId } = await readBody(event)

  if (!externalId) {
    throw createError({ statusCode: 400, statusMessage: 'externalId é obrigatório' })
  }

  try {
    await fulfillOrder(externalId)
    return { success: true, message: 'Pedido atualizado para PAID com sucesso (Simulação de Webhook)' }
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
