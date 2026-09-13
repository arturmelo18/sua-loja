import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import mongoose from 'mongoose'

describe('Product API /api/product', async () => {
  await setup({
    server: true,
  })

  let storeId: string

  beforeAll(async () => {
    const db = mongoose.connection.db
    if (!db) return
    await db.collection('products').deleteMany({})
    
    // Criamos uma loja mockada para associar ao produto
    storeId = new mongoose.Types.ObjectId().toString()
  })

  afterAll(async () => {
    const db = mongoose.connection.db
    if (!db) return
    await db.collection('products').deleteMany({})
  })

  it('should create a new product', async () => {
    const res = await $fetch('/api/product/createProduct', {
      method: 'POST',
      body: {
        store: storeId,
        name: 'Camiseta FATEC',
        category: 'Vestuário',
        price: 59.90,
        description: 'Camiseta de alta qualidade',
        image: 'https://exemplo.com/camiseta.png',
        published: true,
        variants: [
          { name: 'P', quantity: 10 },
          { name: 'M', quantity: 20 }
        ]
      }
    })
    
    expect(res).toBeDefined()
    expect(res.name).toBe('Camiseta FATEC')
    expect(res.quantity).toBe(30) // A quantidade deve ser a soma das variantes
    expect(res.abacatePayId).toBeDefined() // Testando integração mockada/real
  })

  it('should fail to create product without name', async () => {
    try {
      await $fetch('/api/product/createProduct', {
        method: 'POST',
        body: {
          store: storeId,
          price: 50,
          variants: [{ name: 'Único', quantity: 5 }]
        }
      })
      expect.unreachable('Should have thrown an error')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
    }
  })
})
