import { Injectable, OnInit, signal } from '@angular/core'
import { from } from 'rxjs'
import { auth } from '../../auth'

@Injectable({
  providedIn: 'root'
})
export class Auth implements OnInit {
  user = signal<User | null>(null)
  isLoading = signal(true)

  ngOnInit(): void {
    this.fetchUser()
  }

  fetchUser() {
    this.isLoading.set(true)
    from(auth.getSession()).subscribe({
      next: ({ data, error }) => {
        if (error) {
          console.error('Error fetching session:', error)
          this.user.set(null)

          return
        }

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

type User = typeof auth.$Infer.Session.user
