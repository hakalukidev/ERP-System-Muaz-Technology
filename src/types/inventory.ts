export type InventoryItem = {
  id: string
  name: string
  quantity: number
  unit?: string
  updatedAt?: any
}

export type InventoryState = InventoryItem[]

