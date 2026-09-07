import { Product } from "~/types/Product"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Informe os parâmetros de busca.',
    })
  }

  const {
    name,
    minPrice,
    maxPrice,
    limit,
    page,
  } = body

  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100)
  const safePage = Math.max(Number(page) || 1, 1)
  const skip = (safePage - 1) * safeLimit

  const filter: any = {}

  filter.active = true

  if (store) {
    filter.store = String(store).replace(/^@/, '').toLowerCase()
  }

  if (name) {
    filter.name = { $regex: String(name), $options: 'i' }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {}

    if (minPrice !== undefined) {
      filter.price.$gte = Number(minPrice)
    }

    if (maxPrice !== undefined) {
      filter.price.$lte = Number(maxPrice)
    }

    if (
      filter.price.$gte !== undefined
      && filter.price.$lte !== undefined
      && filter.price.$gte > filter.price.$lte
    ) {
      throw createError({
        statusCode: 400,
        statusMessage: 'minPrice não pode ser maior que maxPrice.',
      })
    }
  }

  try {
    const products = await ProductSchema.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit) 
        .lean<Product[]>()

    const total = await ProductSchema.countDocuments(filter);    

    return {
      status: 'sucesso',
      data: products,
      pagination: {
        total,
        page: safePage,
      },
    }
  }
  catch (error: any) {
    if (error.statusCode) throw error
    throw createError({
      statusCode: 500,
      statusMessage: 'Erro ao buscar produtos.',
    })
  }
})