import { db } from '~/database'
import { setupTest } from '~/test-utils'
import { redeRouter } from './rede.router'
import { redeTable } from './rede.sql'

describe('GET /rede', () => {
  it('should return 200 and an empty array when no redes exists', async () => {
    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [],
      meta: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      }
    })
  })

  it('should return 200 and an array of redes', async () => {
    const [rede] = await db
      .insert(redeTable)
      .values({
        nome: 'Rede Teste'
      })
      .returning()
      .execute()
    const { headers } = await setupTest()

    const response = await redeRouter.request('/rede', {
      method: 'GET',
      headers
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [
        {
          ...rede!,
          createdAt: new Date(rede!.createdAt).toISOString(),
          updatedAt: new Date(rede!.updatedAt).toISOString()
        }
      ],
      meta: {
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
      }
    })
  })
})
