import { Types } from 'mongoose'
import { OrderSchema } from '~/server/models/order'

const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineEventHandler(async (event) => {
    const { startDate, endDate, productId, status, store } = getQuery(event)

    const dateFilter: any = {}
    if (startDate) dateFilter.$gte = new Date(startDate as string)
    if (endDate) {
        const end = new Date(endDate as string)
        end.setHours(23, 59, 59, 999)
        dateFilter.$lte = end
    }

    const matchStage: any = {}
    if (Object.keys(dateFilter).length) matchStage.createdAt = dateFilter
    if (status) matchStage.status = status
    if (store) {
        const normalizedStore = String(store).replace(/^@/, '').trim()
        matchStage.store = { $regex: new RegExp(`^${escapeRegex(normalizedStore)}$`, 'i') }
    }

    const productFilter = productId && Types.ObjectId.isValid(String(productId))
        ? new Types.ObjectId(String(productId))
        : null

    // ── 1. Vendas por dia (linha do tempo) ──────────────────
    const salesByDay = await OrderSchema.aggregate([
        { $match: matchStage },
        ...(productFilter ? [
            {
                $lookup: {
                    from: 'cartitems',
                    localField: 'items',
                    foreignField: '_id',
                    as: 'itemsData',
                },
            },
            {
                $match: {
                    'itemsData.product': productFilter,
                },
            },
        ] : []),
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                total: { $sum: '$total' },
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: 1 } },
        {
            $project: {
                date: '$_id',
                total: 1,
                count: 1,
                _id: 0,
            },
        },
    ])

    // ── 2. Produtos mais vendidos (rosca) ───────────────────
    const salesByProduct = await OrderSchema.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: 'cartitems',
                localField: 'items',
                foreignField: '_id',
                as: 'itemsData',
            },
        },
        { $unwind: '$itemsData' },
        ...(productFilter ? [{ $match: { 'itemsData.product': productFilter } }] : []),
        {
            $group: {
                _id: '$itemsData.product',
                totalRevenue: { $sum: { $multiply: ['$itemsData.price', '$itemsData.quantity'] } },
                totalQty: { $sum: '$itemsData.quantity' },
            },
        },
        {
            $lookup: {
                from: 'products',
                localField: '_id',
                foreignField: '_id',
                as: 'productData',
            },
        },
        { $unwind: '$productData' },
        {
            $project: {
                name: '$productData.name',
                totalRevenue: 1,
                totalQty: 1,
                _id: 0,
            },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 },
    ])

    // ── 3. Distribuição de status ───────────────────────────
    const salesByStatus = await OrderSchema.aggregate([
        { $match: matchStage },
        ...(productFilter ? [
            {
                $lookup: {
                    from: 'cartitems',
                    localField: 'items',
                    foreignField: '_id',
                    as: 'itemsData',
                },
            },
            {
                $match: {
                    'itemsData.product': productFilter,
                },
            },
        ] : []),
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                total: { $sum: '$total' },
            },
        },
        {
            $project: {
                status: '$_id',
                count: 1,
                total: 1,
                _id: 0,
            },
        },
    ])

    // ── 4. KPIs ─────────────────────────────────────────────
    const kpis = await OrderSchema.aggregate([
        { $match: matchStage },
        ...(productFilter ? [
            {
                $lookup: {
                    from: 'cartitems',
                    localField: 'items',
                    foreignField: '_id',
                    as: 'itemsData',
                },
            },
            {
                $match: {
                    'itemsData.product': productFilter,
                },
            },
        ] : []),
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$total' },
                totalOrders: { $sum: 1 },
                avgTicket: { $avg: '$total' },
                paidRevenue: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, '$total', 0] } },
                paidOrders: { $sum: { $cond: [{ $eq: ['$status', 'PAID'] }, 1, 0] } },
                pendingOrders: { $sum: { $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0] } },
            },
        },
    ])

    return {
        salesByDay,
        salesByProduct,
        salesByStatus,
        kpis: kpis[0] ?? {
            totalRevenue: 0,
            totalOrders: 0,
            avgTicket: 0,
            paidRevenue: 0,
            paidOrders: 0,
            pendingOrders: 0,
        },
    }
})