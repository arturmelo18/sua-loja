import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

describe('Store API /api/store', async () => {
  await setup({
    server: true,
  })

  let storeId: string

  beforeAll(async () => {
    const db = mongoose.connection.db
    if (!db) return

    await db.collection('stores').deleteMany({})
    await db.collection('users').deleteMany({})

    const hashedPassword = await bcrypt.hash('Senha123!', 10)
    const userRes = await db.collection('users').insertOne({
      name: 'Owner',
      email: 'owner@example.com',
      password: hashedPassword,
      kind: 'admin',
      address: {
        zipcode: '01001000',
        state: 'SP',
        city: 'São Paulo',
        neighborhood: 'Sé',
        street: 'Praça da Sé',
        number: '1'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })

    const storeRes = await db.collection('stores').insertOne({
      ownerId: userRes.insertedId.toString(),
      name: 'Minha Loja',
      store: 'minha-loja',
      active: true,
      approvalStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    })
    storeId = storeRes.insertedId.toString()
  })

  afterAll(async () => {
    const db = mongoose.connection.db
    if (!db) return
    await db.collection('stores').deleteMany({})
    await db.collection('users').deleteMany({})
  })

  it('should update store approval status', async () => {
    const res = await $fetch('/api/store/updateApproval', {
      method: 'PUT',
      body: {
        storeId,
        approvalStatus: 'approved'
      }
    })
    expect(res).toBeDefined()
    expect(res.approvalStatus).toBe('approved')
  })

  it('should reject invalid approval status', async () => {
    try {
      await $fetch('/api/store/updateApproval', {
        method: 'PUT',
        body: {
          storeId,
          approvalStatus: 'invalid-status'
        }
      })
      expect.unreachable('Should have thrown an error')
    } catch (err: any) {
      expect(err.statusCode).toBe(400)
      expect(err.statusMessage).toBe('Status de aprovação inválido.')
    }
  })

  it('should update store active status', async () => {
    const res = await $fetch('/api/store/updateActive', {
      method: 'PUT',
      body: {
        storeId,
        active: false
      }
    })
    expect(res).toBeDefined()
    expect(res.active).toBe(false)
  })
})
