import { isSupabaseConfigured, supabase } from './supabase'

export type BusinessSettings = {
  business_name: string
  tagline: string
  description: string
  phone: string
  email: string
  address: string
  map_url: string
  website_url: string
  hero_title: string
  hero_description: string
  primary_contact_name: string
  primary_contact_email: string
}

export type BusinessHour = {
  day_of_week: number
  open_time: string | null
  close_time: string | null
  is_closed: boolean
  is_published: boolean
}

export type MenuItem = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_featured: boolean
  is_available: boolean
  is_published: boolean
}

export type MenuCategory = {
  id: string
  name: string
  description: string | null
  display_order: number
  is_published: boolean
  menu_items: MenuItem[]
}

export type Testimonial = {
  customer_name: string
  quote: string
  context: string | null
}

export type FaqItem = {
  question: string
  answer: string
}

const demoBusinessSettings: BusinessSettings = {
  business_name: 'Savoria Restaurant',
  tagline: 'Good food. Good moments.',
  description:
    'Savoria is a fictional restaurant concept designed to demonstrate a multi-tenant CMS for hospitality businesses.',
  phone: '+1 (555) 018-2040',
  email: 'hello@savoria.demo',
  address: '128 Market Street, Portland, OR',
  map_url: 'https://maps.google.com/?q=128+Market+Street+Portland+OR',
  website_url: 'https://savoria.demo',
  hero_title: 'Good food. Good moments.',
  hero_description:
    'A premium casual dining experience built to showcase a reusable restaurant CMS for hospitality businesses.',
  primary_contact_name: 'Alicia Moore',
  primary_contact_email: 'alicia@savoria.demo',
}

const demoHours: BusinessHour[] = [
  { day_of_week: 1, open_time: '17:00', close_time: '21:30', is_closed: false, is_published: true },
  { day_of_week: 2, open_time: '17:00', close_time: '21:30', is_closed: false, is_published: true },
  { day_of_week: 3, open_time: '17:00', close_time: '21:30', is_closed: false, is_published: true },
  { day_of_week: 4, open_time: '17:00', close_time: '21:30', is_closed: false, is_published: true },
  { day_of_week: 5, open_time: '17:00', close_time: '22:30', is_closed: false, is_published: true },
  { day_of_week: 6, open_time: '12:00', close_time: '22:30', is_closed: false, is_published: true },
  { day_of_week: 0, open_time: '12:00', close_time: '21:00', is_closed: false, is_published: true },
  { day_of_week: 0, open_time: null, close_time: null, is_closed: true, is_published: true },
]

const demoMenu: MenuCategory[] = [
  {
    id: 'category-starters',
    name: 'Starters',
    description: 'Small plates and shareables.',
    display_order: 1,
    is_published: true,
    menu_items: [
      {
        id: 'item-salmon',
        name: 'Charred Citrus Salmon',
        description: 'Roasted greens, lemon butter, and herb rice.',
        price: 28,
        image_url: null,
        is_featured: true,
        is_available: true,
        is_published: true,
      },
      {
        id: 'item-mushroom',
        name: 'Wild Mushroom Pasta',
        description: 'Creamy parmesan sauce with toasted hazelnuts.',
        price: 24,
        image_url: null,
        is_featured: false,
        is_available: true,
        is_published: true,
      },
    ],
  },
  {
    id: 'category-bowls',
    name: 'Rice Meals',
    description: 'Comforting bowls and simple pairings.',
    display_order: 2,
    is_published: true,
    menu_items: [
      {
        id: 'item-bowl',
        name: 'Savoria Grill Bowl',
        description: 'Citrus-marinated chicken, quinoa, and seasonal vegetables.',
        price: 26,
        image_url: null,
        is_featured: true,
        is_available: true,
        is_published: true,
      },
    ],
  },
]

const demoTestimonials: Testimonial[] = [
  {
    customer_name: 'Amelia R.',
    quote: 'Warm service, beautiful plating, and a room that always feels relaxed and lively.',
    context: 'Guest experience',
  },
  {
    customer_name: 'Marcus T.',
    quote: 'The kind of place that turns an ordinary dinner into a memorable evening with friends.',
    context: 'Guest experience',
  },
  {
    customer_name: 'Nia K.',
    quote: 'Thoughtful flavors and a comfortable atmosphere—perfect for both casual nights and celebrations.',
    context: 'Guest experience',
  },
]

const demoFaqs: FaqItem[] = [
  {
    question: 'Do you offer vegetarian options?',
    answer:
      'Yes. Several dishes can be prepared to suit vegetarian preferences, and our menu is updated as seasonal ingredients change.',
  },
  {
    question: 'Can I request a private dining experience?',
    answer:
      'Private dining requests can be sent through the reservation form, and our team will confirm availability and next steps.',
  },
  {
    question: 'Are reservations required?',
    answer:
      'Reservations are recommended for evenings and group dining, but walk-ins are also welcomed when space allows.',
  },
]

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function fetchBusinessSettings(): Promise<BusinessSettings> {
  if (!isSupabaseConfigured) {
    return demoBusinessSettings
  }

  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .eq('is_published', true)
    .maybeSingle()

  if (error || !data) {
    return demoBusinessSettings
  }

  return {
    business_name: data.business_name ?? demoBusinessSettings.business_name,
    tagline: data.tagline ?? demoBusinessSettings.tagline,
    description: data.description ?? demoBusinessSettings.description,
    phone: data.phone ?? demoBusinessSettings.phone,
    email: data.email ?? demoBusinessSettings.email,
    address: data.address ?? demoBusinessSettings.address,
    map_url: data.map_url ?? demoBusinessSettings.map_url,
    website_url: data.website_url ?? demoBusinessSettings.website_url,
    hero_title: data.hero_title ?? demoBusinessSettings.hero_title,
    hero_description: data.hero_description ?? demoBusinessSettings.hero_description,
    primary_contact_name: data.primary_contact_name ?? demoBusinessSettings.primary_contact_name,
    primary_contact_email: data.primary_contact_email ?? demoBusinessSettings.primary_contact_email,
  }
}

export async function fetchBusinessHours(): Promise<Array<{ day: string; hours: string }>> {
  if (!isSupabaseConfigured) {
    return demoHours
      .filter((row) => row.is_published)
      .map((row) => ({
        day: dayNames[row.day_of_week] ?? 'Day',
        hours: row.is_closed ? 'Closed' : `${row.open_time ?? '—'} – ${row.close_time ?? '—'}`,
      }))
  }

  const { data, error } = await supabase
    .from('business_hours')
    .select('*')
    .eq('is_published', true)
    .order('day_of_week', { ascending: true })

  if (error || !data) {
    return demoHours
      .filter((row) => row.is_published)
      .map((row) => ({
        day: dayNames[row.day_of_week] ?? 'Day',
        hours: row.is_closed ? 'Closed' : `${row.open_time ?? '—'} – ${row.close_time ?? '—'}`,
      }))
  }

  return data
    .filter((row) => row.is_published)
    .map((row) => ({
      day: dayNames[row.day_of_week] ?? 'Day',
      hours: row.is_closed ? 'Closed' : `${row.open_time ?? '—'} – ${row.close_time ?? '—'}`,
    }))
}

export async function fetchMenuData(): Promise<MenuCategory[]> {
  if (!isSupabaseConfigured) {
    return demoMenu
  }

  const { data, error } = await supabase
    .from('menu_categories')
    .select(
      `
        id,
        name,
        description,
        display_order,
        is_published,
        menu_items!category_id (
          id,
          name,
          description,
          price,
          image_url,
          is_featured,
          is_available,
          is_published
        )
      `,
    )
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error || !data) {
    return demoMenu
  }

  return (data as Array<Record<string, unknown>>)
    .filter((category) => Boolean(category.is_published))
    .map((category) => ({
      id: String(category.id),
      name: String(category.name),
      description: typeof category.description === 'string' ? category.description : null,
      display_order: Number(category.display_order ?? 0),
      is_published: Boolean(category.is_published),
      menu_items: ((category as { menu_items?: MenuItem[] }).menu_items ?? []).filter(
        (item) => item.is_published && item.is_available,
      ),
    }))
    .filter((category) => category.menu_items.length > 0)
}

export async function fetchTestimonials(): Promise<Testimonial[]> {
  if (!isSupabaseConfigured) {
    return demoTestimonials
  }

  const { data, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error || !data) {
    return demoTestimonials
  }

  return data.map((item) => ({
    customer_name: item.customer_name ?? 'Guest',
    quote: item.quote ?? '',
    context: item.context ?? null,
  }))
}

export async function fetchFaqs(): Promise<FaqItem[]> {
  if (!isSupabaseConfigured) {
    return demoFaqs
  }

  const { data, error } = await supabase
    .from('faqs')
    .select('*')
    .eq('is_published', true)
    .order('display_order', { ascending: true })

  if (error || !data) {
    return demoFaqs
  }

  return data.map((item) => ({
    question: item.question ?? 'Question',
    answer: item.answer ?? '',
  }))
}
