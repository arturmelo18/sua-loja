import { defineStore } from 'pinia'
import type { Cart } from '~/types/Cart'
import type { User } from '~/types/User'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    cart: null as Cart | null,
    store: null as String | null,
  }),
  getters: {
    getUser: state => state.user,
    getCart: state => state.cart,
    getStore: state => state.store,
    isAuthenticated: state => state.user !== null,
    isAdmin: state => state.user?.kind === 'admin' || state.user?.kind === 'superadmin',
    isSuperAdmin: state => state.user?.kind === 'superadmin',
  },
  actions: {
    setUser(user: User) {
      this.user = user
      this.store = user.store || null
    },
    clearUser() {
      this.user = null
    },
    setStore(store: String) {
      this.store = store
    },
    clearStore() {
      this.store = null
    },
    setCart(cart: Cart) {
      this.cart = cart
    },
    clearCart() {
      this.cart = null
    }
  },
  persist: true,
})
