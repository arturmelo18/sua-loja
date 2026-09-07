import { generateCdnImage } from '~/server/helpers/generateCdnImage'
import { createAbacatePayProduct } from '~/server/helpers/createAbacatePayProduct'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Você deve passar todas as informações para criar um produto',
    })
  }

  const { name, price, quantity, description, active, published, image, store, category, variants = [] } = body
  const normalizedVariants = Array.isArray(variants)
    ? variants
      .map((variant: any) => ({ name: String(variant.name || '').trim(), quantity: Number(variant.quantity) || 0 }))
      .filter((variant: { name: string }) => variant.name)
    : []
  const totalQuantity = normalizedVariants.length
    ? normalizedVariants.reduce((total: number, variant: { quantity: number }) => total + variant.quantity, 0)
    : Number(quantity)

  const normalizedPrice = Number(price)
  const normalizedQuantity = Number(totalQuantity)
  const isPublished = published ?? active ?? true

  if (!name || !store || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0 || !Number.isFinite(normalizedQuantity) || normalizedQuantity < 0 || !description || !image) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Todos os campos obrigatórios devem ser preenchidos.',
    })
  }

  if (normalizedPrice < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O preço do produto deve ser positivo.',
    })
  }

  if (normalizedPrice > 1000000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'O preço do produto deve ser menor que 1000000.',
    })
  }

  if (normalizedQuantity < 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A quantidade do produto deve ser positiva.',
    })
  }

  if (normalizedQuantity > 1000000) {
    throw createError({
      statusCode: 400,
      statusMessage: 'A quantidade do produto deve ser menor que 1000000',
    })
  }

  const cdnImg = await generateCdnImage(image)

  let product: any = null

  try {
    product = await ProductSchema.create({
      name,
      store,
      price: normalizedPrice,
      quantity: normalizedQuantity,
      category: String(category || '').trim(),
      variants: normalizedVariants,
      description,
      active: isPublished,
      published: isPublished,
      image: cdnImg.url || '',
    })

    const abacateProduct = await createAbacatePayProduct({
      externalId: product._id.toString(),
      name: product.name,
      price: Math.round(product.price),
      description: product.description,
      imageUrl: product.image,
    })

    await ProductSchema.findByIdAndUpdate(product._id, {
      abacatePayId: abacateProduct.data.id,
    })

    const result = {
      status: 'sucesso',
    }

    return result
  }
  catch (error: any) {
    if (error.statusCode) throw error
    if (product?._id) await ProductSchema.findByIdAndDelete(product._id)
    console.error('Erro ao criar produto:', error)
    throw createError({ statusCode: 500, statusMessage: 'Erro ao salvar produto ou sincronizar com o gateway de pagamentos' })
  }
})
