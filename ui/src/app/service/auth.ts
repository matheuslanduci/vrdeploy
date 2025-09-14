import { Injectable, signal } from '@angular/core'
import { from } from 'rxjs'
import { authClient } from '../../auth'

@Injectable({
  providedIn: 'root'
})
export class Auth {
  user = signal<User | null>(null)
  isLoading = signal(true)

  fetchUser() {
    this.isLoading.set(true)
    from(authClient.getSession()).subscribe({
      next: ({ data, error }) => {
        if (error) throw error

        this.user.set(data?.user ?? null)
      },
      error: (err) => {
        console.error('Unexpected error fetching session:', err)
        this.user.set(null)
      },
      complete: () => this.isLoading.set(false)
    })
  }
}

type User = typeof authClient.$Infer.Session.user
