export interface SteelItem {
  id: string
  progress_id: string
  arquivo: string
  os: string
  conferido: boolean
  created_at: string
}

export interface SteelProgress {
  id: string
  name: string
  created_at: string
  updated_at: string
  items?: SteelItem[]
}

export interface ExpandedItem {
  arquivo: string
  os: string
  conferido: boolean
}
