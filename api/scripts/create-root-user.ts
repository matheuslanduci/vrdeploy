import { auth } from '~/auth'

export async function createRootUser() {
  await auth.api.createUser({
    body: {
      email: 'root_user@vrsoft.com.br',
      password: 'root_password',
      name: 'Root User',
      role: 'admin'
    }
  })
}

createRootUser().catch((error) => {
  console.error('Error creating root user:', error)
})
