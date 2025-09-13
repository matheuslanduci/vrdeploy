import { setupTest } from '~/test/setup-tests'
import { redeRouter } from './rede.router'

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
})
