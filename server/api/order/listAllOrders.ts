import { OrderSchema } from '~/server/models/order'

export default defineEventHandler(async (event) => {
    const { page = 1, limit = 10, search = '' } = getQuery(event)

    const safePage = Math.max(Number(page) || 1, 1)
    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100)
    const skip = (safePage - 1) * safeLimit
    const normalizedStore = String(store).replace(/^@/, '').toLowerCase()

    const matchStage = search
        ? {
            $match: {
                $or: [
                    { saleCode: { $regex: search, $options: 'i' } },
                    { 'userData.name': { $regex: search, $options: 'i' } },
                ],
            },
        }
        : { $match: {} }

    const pipeline: any[] = [
        ...(normalizedStore ? [{ $match: { store: normalizedStore } }] : []),
        // popula user
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userData',
            },
        },
        { $unwind: '$userData' },

        // popula items → cartitems
        {
            $lookup: {
                from: 'cartitems',
                localField: 'items',
                foreignField: '_id',
                as: 'items',
            },
        },

        // popula product dentro de cada cartitem
        {
            $lookup: {
                from: 'products',
                localField: 'items.product',
                foreignField: '_id',
                as: 'productsData',
            },
        },

        // injeta product em cada item
        {
            $addFields: {
                items: {
                    $map: {
                        input: '$items',
                        as: 'item',
                        in: {
                            $mergeObjects: [
                                '$$item',
                                {
                                    product: {
                                        $arrayElemAt: [
                                            {
                                                $filter: {
                                                    input: '$productsData',
                                                    as: 'p',
                                                    cond: { $eq: ['$$p._id', '$$item.product'] },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                },
                            ],
                        },
                    },
                },
            },
        },

        { $unset: 'productsData' },

        // renomeia userData → user para manter compatibilidade com o tipo Order
        {
            $addFields: {
                user: '$userData',
            },
        },
        { $unset: 'userData' },

        matchStage,
        { $sort: { createdAt: -1 } },
    ]

    // total sem paginação
    const countPipeline = [...pipeline, { $count: 'total' }]
    const countResult = await OrderSchema.aggregate(countPipeline)
    const total = countResult[0]?.total ?? 0

    // com paginação
    const orders = await OrderSchema.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: Number(limit) },
    ])

    return {
        data: orders,
        pagination: { page: safePage, limit: safeLimit, total },
    }
})