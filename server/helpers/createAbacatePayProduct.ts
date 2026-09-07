import { AbacatePayConnector } from '~/server/connectors/AbacatePay/connector'

type ProductPayload = {
  externalId: string
  name: string
  price: number
  description?: string
  imageUrl?: string | null
}

function isValidImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return false

  try {
    const url = new URL(imageUrl)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function isInvalidImageUrlError(error: any) {
  const message = String(
    error?.data?.error
      || error?.data?.message
      || error?.message
      || ''
  ).toLowerCase()

  return message.includes('invalid image url')
}

export async function createAbacatePayProduct(payload: ProductPayload) {
  const basePayload = {
    externalId: payload.externalId,
    name: payload.name,
    price: payload.price,
    currency: 'BRL',
    ...(payload.description ? { description: payload.description } : {}),
  }
  const imageUrl = isValidImageUrl(payload.imageUrl) ? payload.imageUrl : undefined
  const imagePayload = imageUrl
    ? { imageUrl }
    : {}

  try {
    return await AbacatePayConnector.post('/products/create', {
      ...basePayload,
      ...imagePayload,
    })
  } catch (error) {
    if (!imageUrl || !isInvalidImageUrlError(error)) throw error

    console.warn('AbacatePay rejeitou a imagem; produto será criado sem imageUrl.')
    return AbacatePayConnector.post('/products/create', basePayload)
  }
}
