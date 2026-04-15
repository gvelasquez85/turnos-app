import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface BrandStore {
  selectedBrandId: string
  setSelectedBrandId: (id: string) => void
}

export const useBrandStore = create<BrandStore>()(
  persist(
    (set) => ({
      selectedBrandId: '',
      setSelectedBrandId: (id) => set({ selectedBrandId: id }),
    }),
    { name: 'turnflow-brand' }
  )
)
