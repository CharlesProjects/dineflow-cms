import { useEffect, useState } from 'react'
import {
  fetchBusinessHours,
  fetchBusinessSettings,
  fetchFaqs,
  fetchMenuData,
  fetchTestimonials,
  type BusinessSettings,
  type FaqItem,
  type MenuCategory,
  type Testimonial,
} from '../lib/content'

const defaultHours = [
  { day: 'Monday', hours: 'Closed' },
  { day: 'Tuesday', hours: '5:00 PM – 9:30 PM' },
  { day: 'Wednesday', hours: '5:00 PM – 9:30 PM' },
  { day: 'Thursday', hours: '5:00 PM – 9:30 PM' },
  { day: 'Friday', hours: '5:00 PM – 10:30 PM' },
  { day: 'Saturday', hours: '12:00 PM – 10:30 PM' },
  { day: 'Sunday', hours: '12:00 PM – 9:00 PM' },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function HomePage() {
  const [business, setBusiness] = useState<BusinessSettings | null>(null)
  const [hours, setHours] = useState<Array<{ day: string; hours: string }>>(defaultHours)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])

  useEffect(() => {
    let isMounted = true

    const loadPageData = async () => {
      try {
        const [businessSettings, businessHours, menuData, testimonialData, faqData] = await Promise.all([
          fetchBusinessSettings(),
          fetchBusinessHours(),
          fetchMenuData(),
          fetchTestimonials(),
          fetchFaqs(),
        ])

        if (!isMounted) {
          return
        }

        setBusiness(businessSettings)
        setHours(businessHours.length > 0 ? businessHours : defaultHours)
        setMenuCategories(menuData)
        setTestimonials(testimonialData)
        setFaqItems(faqData)
      } catch {
        if (!isMounted) {
          return
        }

        setBusiness({
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
        })
        setHours(defaultHours)
        setMenuCategories([])
        setTestimonials([])
        setFaqItems([])
      }
    }

    void loadPageData()

    return () => {
      isMounted = false
    }
  }, [])

  const displayName = business?.business_name ?? 'Savoria Restaurant'
  const heroTitle = business?.hero_title ?? 'Good food. Good moments.'
  const heroDescription =
    business?.hero_description ??
    'A premium casual dining experience built to showcase a reusable restaurant CMS for hospitality businesses.'

  const menuHighlights = menuCategories.map((category) => category.name)
  const featuredDishes = menuCategories
    .flatMap((category) =>
      category.menu_items.map((item) => ({
        name: item.name,
        price: formatCurrency(item.price),
        description: item.description ?? 'Seasonal chef selection.',
      })),
    )
    .slice(0, 3)

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between rounded-full border border-stone-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-stone-950">
              S
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-stone-500">Demo brand</p>
              <h1 className="text-lg font-semibold text-stone-900">{displayName}</h1>
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            {['Overview', 'Menu', 'Gallery', 'Hours', 'Reservations'].map((item) => (
              <a key={item} href="#" className="text-sm font-medium text-stone-700 transition hover:text-stone-950">
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <a href="/login" className="hidden rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 sm:inline-flex">
              Staff login
            </a>
            <button
              type="button"
              className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
            >
              Reserve
            </button>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 pb-16 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-stone-50 shadow-xl">
          <div className="grid items-center gap-10 px-6 py-10 md:grid-cols-2 md:px-10 lg:px-12 lg:py-16">
            <div className="space-y-6">
              <span className="inline-flex rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-amber-200">
                {business ? 'Live CMS content' : 'Fictional demo content'}
              </span>
              <div className="space-y-4">
                <h2 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                  {heroTitle}
                </h2>
                <p className="max-w-lg text-base text-stone-200 sm:text-lg">{heroDescription}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <button type="button" className="rounded-full bg-amber-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-amber-300">
                  Explore menu
                </button>
                <button type="button" className="rounded-full border border-white/20 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10">
                  Book a table
                </button>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-sm">
              <div className="rounded-[1.4rem] bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.30),_transparent_50%),linear-gradient(135deg,#f5f5f4_0%,#d4d4d4_100%)] p-6">
                <div className="rounded-[1.2rem] bg-stone-900 p-5 text-stone-50 shadow-lg">
                  <p className="text-xs uppercase tracking-[0.28em] text-amber-200">Tonight</p>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-2xl bg-stone-800 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-stone-400">Featured</p>
                      <h3 className="mt-2 text-xl font-semibold">
                        {featuredDishes[0]?.name ?? 'Chef signature dish'}
                      </h3>
                      <p className="mt-2 text-sm text-stone-300">
                        {featuredDishes[0]?.description ?? 'A carefully curated seasonal special.'}
                      </p>
                    </div>
                    <div className="flex items-center justify-between rounded-2xl bg-amber-400 px-4 py-3 text-stone-900">
                      <span className="text-sm font-medium">Reservation status</span>
                      <span className="text-lg font-bold">Open</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {featuredDishes.length > 0 ? (
            featuredDishes.map((dish) => (
              <article key={dish.name} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 h-40 rounded-2xl bg-gradient-to-br from-stone-200 via-stone-100 to-amber-100" aria-hidden="true" />
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-stone-900">{dish.name}</h3>
                  <span className="text-base font-semibold text-amber-700">{dish.price}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">{dish.description}</p>
              </article>
            ))
          ) : (
            [
              { name: 'Charred Citrus Salmon', price: '$28', description: 'Roasted greens, lemon butter, and herb rice.' },
              { name: 'Wild Mushroom Pasta', price: '$24', description: 'Creamy parmesan sauce with toasted hazelnuts.' },
              { name: 'Savoria Grill Bowl', price: '$26', description: 'Citrus-marinated chicken, quinoa, and seasonal veg.' },
            ].map((dish) => (
              <article key={dish.name} className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 h-40 rounded-2xl bg-gradient-to-br from-stone-200 via-stone-100 to-amber-100" aria-hidden="true" />
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-stone-900">{dish.name}</h3>
                  <span className="text-base font-semibold text-amber-700">{dish.price}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-stone-600">{dish.description}</p>
              </article>
            ))
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">About the restaurant</p>
            <h3 className="mt-3 text-3xl font-semibold text-stone-900">Crafted for everyday gathering.</h3>
            <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
              {business?.description ??
                'Savoria is a fictional restaurant concept designed to demonstrate a multi-tenant restaurant CMS. The public-facing website pulls content from structured business settings and menu data, while staff can update the experience securely from the admin dashboard.'}
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-stone-900 p-6 text-stone-50 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200">Opening hours</p>
            <div className="mt-5 space-y-3">
              {(hours.length > 0 ? hours : defaultHours).map(({ day, hours: hoursLabel }) => (
                <div key={day} className="flex items-center justify-between border-b border-white/10 pb-2 last:border-b-0 last:pb-0">
                  <span className="text-sm text-stone-200">{day}</span>
                  <span className="text-sm font-medium text-stone-50">{hoursLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Menu preview</p>
              <h3 className="mt-2 text-3xl font-semibold text-stone-900">Seasonal favorites</h3>
            </div>
            <button type="button" className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100">
              Full menu
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {(menuHighlights.length > 0 ? menuHighlights : ['Starters', 'Main Dishes', 'Pasta', 'Rice Meals', 'Desserts', 'Drinks']).map((category) => (
              <div key={category} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-5 text-center text-sm font-medium text-stone-700">
                {category}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {(testimonials.length > 0
            ? testimonials
            : [
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
          ).map(({ customer_name, quote }) => (
            <article key={customer_name} className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-base leading-7 text-stone-700">“{quote}”</p>
              <div className="mt-5 border-t border-stone-200 pt-4">
                <p className="font-semibold text-stone-900">{customer_name}</p>
                <p className="text-sm text-stone-500">Guest experience</p>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Frequently asked questions</p>
            <div className="mt-5 space-y-4">
              {(faqItems.length > 0
                ? faqItems
                : [
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
              ).map(({ question, answer }) => (
                <div key={question} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                  <h4 className="text-base font-semibold text-stone-900">{question}</h4>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{answer}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-stone-200 bg-stone-900 p-6 text-stone-50 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Reserve</p>
            <h3 className="mt-2 text-3xl font-semibold">Your table is waiting.</h3>
            <p className="mt-3 text-base text-stone-300">
              Your request is subject to restaurant confirmation and staff review before a reservation is confirmed.
            </p>
            <button type="button" className="mt-6 rounded-full bg-amber-400 px-5 py-3 font-medium text-stone-950 transition hover:bg-amber-300">
              Make a request
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-stone-500">{displayName}</p>
            <p className="mt-2 text-sm text-stone-600">{business?.tagline ?? 'Good food. Good moments.'}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-stone-600">
            <a href="#" className="transition hover:text-stone-900">Menu</a>
            <a href="#" className="transition hover:text-stone-900">Gallery</a>
            <a href="#" className="transition hover:text-stone-900">Contact</a>
            <a href="/login" className="transition hover:text-stone-900">Staff login</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
