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
    isAdmin: state => state.user?.kind === 'admin',
  },
  actions: {
    setUser(user: User) {
      this.user = user
    },
    clearUser() {
      this.user = null
    },
    setStore(store: String) {
      this.store = store
    },
    clearCommunity() {
      this.community = null
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
