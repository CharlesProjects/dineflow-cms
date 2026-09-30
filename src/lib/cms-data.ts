export type BusinessSettings = {
  businessName: string
  tagline: string
  phone: string
  email: string
  address: string
  heroTitle: string
  heroDescription: string
}

export type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  isFeatured: boolean
  isAvailable: boolean
}

export type HoursEntry = {
  day: string
  openTime: string
  closeTime: string
  isClosed: boolean
}

const BUSINESS_KEY = 'savoria-business-settings'
const MENU_KEY = 'savoria-menu-items'
const HOURS_KEY = 'savoria-hours'

const defaultBusinessSettings: BusinessSettings = {
  businessName: 'Savoria Restaurant',
  tagline: 'Good food. Good moments.',
  phone: '+1 (555) 018-2040',
  email: 'hello@savoria.demo',
  address: '128 Market Street, Portland, OR',
  heroTitle: 'Good food. Good moments.',
  heroDescription:
    'A premium casual dining experience built to showcase a reusable restaurant CMS for hospitality businesses.',
}

const defaultMenuItems: MenuItem[] = [
  {
    id: 'starter-salmon',
    name: 'Charred Citrus Salmon',
    description: 'Roasted greens, lemon butter, and herb rice.',
    price: 28,
    isFeatured: true,
    isAvailable: true,
  },
  {
    id: 'starter-mushroom',
    name: 'Wild Mushroom Pasta',
    description: 'Creamy parmesan sauce with toasted hazelnuts.',
    price: 24,
    isFeatured: false,
    isAvailable: true,
  },
  {
    id: 'bowl-grill',
    name: 'Savoria Grill Bowl',
    description: 'Citrus-marinated chicken, quinoa, and seasonal vegetables.',
    price: 26,
    isFeatured: true,
    isAvailable: true,
  },
]

const defaultHours: HoursEntry[] = [
  { day: 'Monday', openTime: '17:00', closeTime: '21:30', isClosed: true },
  { day: 'Tuesday', openTime: '17:00', closeTime: '21:30', isClosed: false },
  { day: 'Wednesday', openTime: '17:00', closeTime: '21:30', isClosed: false },
  { day: 'Thursday', openTime: '17:00', closeTime: '21:30', isClosed: false },
  { day: 'Friday', openTime: '17:00', closeTime: '22:30', isClosed: false },
  { day: 'Saturday', openTime: '12:00', closeTime: '22:30', isClosed: false },
  { day: 'Sunday', openTime: '12:00', closeTime: '21:00', isClosed: false },
]

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }

    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore localStorage quota issues. This is intentional for the local CMS demo layer.
  }
}

export function getBusinessSettings(): BusinessSettings {
  return readJson<BusinessSettings>(BUSINESS_KEY, defaultBusinessSettings)
}

export function saveBusinessSettings(settings: BusinessSettings) {
  writeJson(BUSINESS_KEY, settings)
  return settings
}

export function getMenuItems(): MenuItem[] {
  return readJson<MenuItem[]>(MENU_KEY, defaultMenuItems)
}

export function saveMenuItems(items: MenuItem[]) {
  writeJson(MENU_KEY, items)
  return items
}

export function getHours(): HoursEntry[] {
  return readJson<HoursEntry[]>(HOURS_KEY, defaultHours)
}

export function saveHours(entries: HoursEntry[]) {
  writeJson(HOURS_KEY, entries)
  return entries
}

export function createMenuItem(): MenuItem {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: 'New menu item',
    description: 'Describe this dish for guests.',
    price: 24,
    isFeatured: false,
    isAvailable: true,
  }
}
