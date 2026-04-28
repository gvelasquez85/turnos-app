import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BrandStore {
  selectedBrandId: string
  setSelectedBrandId: (id: string) => void
}

function syncCookie(id: string) {
  try {
    if (id) {
      document.cookie = `sa_brand=${id}; path=/; max-age=86400; SameSite=Lax`
    } else {
      document.cookie = `sa_brand=; path=/; max-age=0`
    }
  } catch {}
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      selectedBrandId: '',
      setSelectedBrandId: (id) => {
        syncCookie(id)
        set({ selectedBrandId: id })
      },
    }),
    { name: 'turnflow-brand' }
  )
)
