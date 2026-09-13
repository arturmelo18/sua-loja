import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

describe('Order API /api/order', async () => {
  await setup({
    server: true,
  })

  let userId: string
  let storeId: string
  let cartId: string
  let productId: string
  let cartItemId: string

  beforeAll(async () => {
    const db = mongoose.connection.db
    if (!db) return
    await db.collection('users').deleteMany({})
    await db.collection('stores').deleteMany({})
    await db.collection('products').deleteMany({})
    await db.collection('carts').deleteMany({})
    await db.collection('cartitems').deleteMany({})
    await db.collection('orders').deleteMany({})

    const hashedPassword = await bcrypt.hash('Senha123!', 10)
    const userRes = await db.collection('users').insertOne({
      name: 'Comprador Teste',
      email: 'comprador@example.com',
      password: hashedPassword,
      kind: 'user',
      address: {
        zipcode: '01001000',
        state: 'SP',
        city: 'São Paulo',
        neighborhood: 'Sé',
        street: 'Praça da Sé',
        number: '1'
      }
    })
    userId = userRes.insertedId.toString()

    const storeRes = await db.collection('stores').insertOne({
      ownerId: new mongoose.Types.ObjectId().toString(),
      name: 'Loja P0',
      store: 'loja-p0',
      active: true,
      approvalStatus: 'approved'
    })
    storeId = storeRes.insertedId.toString()

    const productRes = await db.collection('products').insertOne({
      name: 'Caneca',
      price: 25.50,
      store: storeId,
      quantity: 50,
      variants: [{ name: 'Única', quantity: 50 }],
      abacatePayId: 'mock-abacate-id',
      published: true,
      active: true
    })
    productId = productRes.insertedId.toString()

    const cartItemRes = await db.collection('cartitems').insertOne({
      product: productRes.insertedId,
      quantity: 2,
      variantName: 'Única'
    })
    cartItemId = cartItemRes.insertedId.toString()

    const cartRes = await db.collection('carts').insertOne({
      user: userRes.insertedId,
      store: storeId,
      items: [cartItemRes.insertedId]
    })
    cartId = cartRes.insertedId.toString()
  })

  afterAll(async () => {
    const db = mongoose.connection.db
    if (!db) return
    await db.collection('users').deleteMany({})
    await db.collection('stores').deleteMany({})
    await db.collection('products').deleteMany({})
    await db.collection('carts').deleteMany({})
    await db.collection('cartitems').deleteMany({})
    await db.collection('orders').deleteMany({})
  })

  it('should create an order successfully', async () => {
    const res = await $fetch('/api/order/createOrder', {
      method: 'POST',
      body: {
        cartId,
        userId,
        store: storeId
      }
    })
    
    expect(res).toBeDefined()
    expect(res.orderId).toBeDefined()
    expect(res.checkoutUrl).toBe('https://mock.abacatepay.com/checkout')
  })

  it('should fail to create order with empty cart', async () => {
    // Primeiro vamos criar um carrinho vazio
    const db = mongoose.connection.db
    const emptyCartRes = await db!.collection('carts').insertOne({
      user: new mongoose.Types.ObjectId(userId),
      store: storeId,
      items: []
    })
    
    try {
      await $fetch('/api/order/createOrder', {
        method: 'POST',
        body: {
          cartId: emptyCartRes.insertedId.toString(),
          userId,
          store: storeId
        }
      })
      expect.unreachable('Should have thrown an error')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.statusMessage).toBe('Carrinho vazio ou não encontrado')
    }
  })
})
