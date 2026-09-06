import type { Store } from '~/types/Store'

const DEFAULT_STORE_COLOR = '#7A1F2E'

export function useStoreTheme() {
  const storeColor = ref(DEFAULT_STORE_COLOR)

  async function loadStoreTheme(options: { storeSlug?: string; ownerId?: string } = {}) {
    try {
      const store = await $fetch<Pick<Store, 'color'> | null>('/api/store/getStore', {
        params: options.storeSlug
          ? { store: options.storeSlug }
          : options.ownerId
            ? { ownerId: options.ownerId }
            : undefined,
      })

      if (store?.color) storeColor.value = store.color
    } catch {
      storeColor.value = DEFAULT_STORE_COLOR
    }
  }

  return { storeColor, loadStoreTheme }
}
