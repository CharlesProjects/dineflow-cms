import { useEffect, useState } from 'react'
import { ReservationForm } from '../components/ReservationForm'
import {
  fetchBusinessHours,
  fetchBusinessSettings,
  fetchFaqs,
  fetchGalleryItems,
  fetchMenuData,
  fetchTestimonials,
  type BusinessSettings,
  type FaqItem,
  type GalleryItem,
  type MenuCategory,
  type Testimonial,
} from '../lib/content'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const fallbackHours = [
  { day: 'Monday', hours: 'Closed' },
  { day: 'Tuesday', hours: '5:00 PM – 9:30 PM' },
  { day: 'Wednesday', hours: '5:00 PM – 9:30 PM' },
  { day: 'Thursday', hours: '5:00 PM – 9:30 PM' },
  { day: 'Friday', hours: '5:00 PM – 10:30 PM' },
  { day: 'Saturday', hours: '12:00 PM – 10:30 PM' },
  { day: 'Sunday', hours: '12:00 PM – 9:00 PM' },
]
const dishImages = [
  'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=85',
]
const fallbackBusiness: BusinessSettings = {
  business_name: 'Savoria Restaurant',
  tagline: 'Good food. Good moments.',
  description: 'We bring people together over seasonal cooking, generous hospitality, and the simple pleasure of sharing a good meal.',
  phone: '+1 (555) 018-2040',
  email: 'hello@savoria.demo',
  address: '128 Market Street, Portland, OR',
  map_url: 'https://maps.google.com/?q=128+Market+Street+Portland+OR',
  website_url: 'https://savoria.demo',
  social_links: {},
  hero_title: 'A table worth gathering around.',
  hero_description: 'Seasonal ingredients, thoughtful cooking, and a neighborhood table made for lingering.',
  primary_contact_name: 'Alicia Moore',
  primary_contact_email: 'alicia@savoria.demo',
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatHours(value: string) {
  return value.replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b(?!\s*(?:AM|PM)\b)/gi, (_, hourText: string, minute: string) => {
    const hour = Number(hourText)
    const period = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minute} ${period}`
  })
}

export function RestaurantHomePage() {
  const [business, setBusiness] = useState<BusinessSettings | null>(fallbackBusiness)
  const [hours, setHours] = useState<Array<{ day: string; hours: string }>>(fallbackHours)
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [calendar, setCalendar] = useState<{ day: string; year: number } | null>(null)

  useEffect(() => {
    let isMounted = true
    const calendarFrame = window.requestAnimationFrame(() => {
      if (!isMounted) return
      const today = new Date()
      setCalendar({ day: dayNames[today.getDay()], year: today.getFullYear() })
    })

    const loadPageData = async () => {
      try {
        const [businessSettings, businessHours, menuData, testimonialData, faqData, galleryData] = await Promise.all([
          fetchBusinessSettings(),
          fetchBusinessHours(),
          fetchMenuData(),
          fetchTestimonials(),
          fetchFaqs(),
          fetchGalleryItems(),
        ])

        if (!isMounted) return

        setBusiness(businessSettings)
        setHours(businessHours.length > 0 ? businessHours : fallbackHours)
        setMenuCategories(menuData)
        setTestimonials(testimonialData)
        setFaqItems(faqData)
        setGalleryItems(galleryData)
      } catch {
        if (!isMounted) return

        setBusiness(fallbackBusiness)
        setHours(fallbackHours)
        setMenuCategories([])
        setTestimonials([])
        setFaqItems([])
        setGalleryItems([])
      }
    }

    void loadPageData()

    return () => {
      isMounted = false
      window.cancelAnimationFrame(calendarFrame)
    }
  }, [])

  const displayName = business?.business_name ?? 'Savoria Restaurant'
  const heroTitle = business?.hero_title ?? 'A table worth gathering around.'
  const heroDescription =
    business?.hero_description ??
    'Seasonal ingredients, thoughtful cooking, and a neighborhood table made for lingering.'
  const currentDay = calendar?.day ?? ''
  const todayHours = hours.find((entry) => entry.day === currentDay)
  const phoneLink = business?.phone?.replace(/[^\d+]/g, '')
  const logoUrl = business?.social_links?.logo_url
  const socialLinks = Object.entries(business?.social_links ?? {}).filter(([name, url]) =>
    name !== 'logo_url' && /^https?:\/\//i.test(url),
  )

  return (
    <div className="min-h-screen bg-[#f6f5f0] text-[#252720]">
      <header className="sticky top-0 z-40 border-b border-[#e7e4db] bg-[#fbfaf6]/95 backdrop-blur-sm">
        <nav aria-label="Main navigation" className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-3.5 sm:px-8 lg:px-12">
          <a href="#top" className="flex min-w-0 items-center gap-3" aria-label={`${displayName}, home`}>
            {logoUrl
              ? <img src={logoUrl} alt={`${displayName} logo`} className="h-10 w-10 shrink-0 rounded-full border border-[#e7e4db] bg-white object-contain" />
              : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#a84f35]/30 font-display text-xl text-[#a84f35]">S</span>}
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-[#74756c]">Neighborhood restaurant</span>
              <span className="block truncate text-sm font-semibold sm:text-base">{displayName}</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 lg:flex">
            <a href="#menu" className="text-sm text-[#4f5049] transition hover:text-[#a84f35]">Menu</a>
            <a href="#about" className="text-sm text-[#4f5049] transition hover:text-[#a84f35]">Our story</a>
            <a href="#hours" className="text-sm text-[#4f5049] transition hover:text-[#a84f35]">Hours</a>
            <a href="#reservations" className="text-sm text-[#4f5049] transition hover:text-[#a84f35]">Reservations</a>
            <a href="#contact" className="text-sm text-[#4f5049] transition hover:text-[#a84f35]">Find us</a>
          </div>

          <div className="hidden items-center gap-5 lg:flex">
            {phoneLink && <a href={`tel:${phoneLink}`} className="text-sm font-medium text-[#4f5049]">{business?.phone}</a>}
            <a href="#menu" className="rounded-md bg-[#a84f35] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#813a28]">Explore the menu <span aria-hidden="true">↗</span></a>
          </div>

          <button
            type="button"
            className="flex h-11 items-center gap-2 rounded-md border border-[#d9d7ce] px-3 text-sm font-semibold lg:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="text-lg leading-none">{isMenuOpen ? '×' : '☰'}</span>
            <span>{isMenuOpen ? 'Close' : 'Menu'}</span>
          </button>
        </nav>
        {isMenuOpen && (
          <div id="mobile-navigation" className="border-t border-[#e7e4db] bg-[#fbfaf6] px-5 py-3 lg:hidden">
            <nav aria-label="Mobile navigation" className="mx-auto grid max-w-[1440px] gap-1 sm:grid-cols-2">
              {[
                ['Menu', '#menu'],
                ['Our story', '#about'],
                ['Hours', '#hours'],
                ['Reservations', '#reservations'],
                ['Find us', '#contact'],
              ].map(([label, href]) => (
                <a key={href} href={href} onClick={() => setIsMenuOpen(false)} className="rounded-md px-3 py-3 text-sm font-medium hover:bg-[#f0eee6]">{label}</a>
              ))}
              {phoneLink && <a href={`tel:${phoneLink}`} className="rounded-md px-3 py-3 text-sm font-semibold text-[#a84f35]">Call {business?.phone}</a>}
            </nav>
          </div>
        )}
      </header>

      <main id="top">
        <section className="relative isolate flex min-h-[590px] items-end overflow-hidden bg-[#282920] md:min-h-[690px]">
          <img
            src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2400&q=90"
            alt="Warmly lit restaurant dining room set for dinner"
            className="absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#171914]/90 via-[#171914]/35 to-[#171914]/10" />
          <div className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-28 text-white sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.26em] text-[#edc9a7]">Good things happen around the table</p>
            <h1 className="font-display max-w-4xl text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">{heroTitle}</h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">{heroDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#menu" className="inline-flex min-h-12 items-center rounded-md bg-[#b75d3e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a84f35]">View the menu <span aria-hidden="true" className="ml-3">↓</span></a>
              <a href="#contact" className="inline-flex min-h-12 items-center rounded-md border border-white/55 bg-black/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">Location & contact <span aria-hidden="true" className="ml-3">↗</span></a>
            </div>
            <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-2 border-t border-white/25 pt-5 text-sm text-white/80">
              <span>{business?.address ?? 'Portland, Oregon'}</span>
              {todayHours && <span><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#d6b28a]" />Today: {formatHours(todayHours.hours)}</span>}
            </div>
          </div>
        </section>

        <section id="menu" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1280px]">
            <div className="mb-10 flex flex-col gap-4 border-b border-[#dedbd1] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a84f35]">Made with the season</p>
                <h2 className="font-display mt-2 text-4xl sm:text-5xl">A few things we love</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#74756c]">Thoughtful plates, bright flavors, and ingredients chosen at their best. Ask our team about today's specials.</p>
            </div>

            {menuCategories.length > 0 ? (
              <div className="space-y-14">
                {menuCategories.map((category) => (
                  <section key={category.id} aria-labelledby={`category-${category.id}`}>
                    <div className="mb-5 flex items-baseline justify-between gap-4">
                      <h3 id={`category-${category.id}`} className="font-display text-2xl">{category.name}</h3>
                      {category.description && <p className="hidden text-sm text-[#74756c] sm:block">{category.description}</p>}
                    </div>
                    <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                      {category.menu_items.map((item, index) => (
                        <article key={item.id} className="group">
                          <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-[#e9e6dc]">
                            <img
                              src={item.image_url || dishImages[index % dishImages.length]}
                              alt={item.name}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                            />
                            {item.is_featured && <span className="absolute left-3 top-3 rounded-sm bg-[#fbfaf6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#813a28]">House favorite</span>}
                          </div>
                          <div className="flex items-baseline justify-between gap-3">
                            <h4 className="font-display text-xl leading-snug">{item.name}</h4>
                            <span className="shrink-0 text-sm font-semibold text-[#a84f35]">{formatCurrency(item.price)}</span>
                          </div>
                          {item.description && <p className="mt-2 max-w-md text-sm leading-6 text-[#74756c]">{item.description}</p>}
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-[#d9d7ce] px-5 py-12 text-center text-sm text-[#74756c]">Our menu is being refreshed. Please contact us for today's offerings.</div>
            )}
          </div>
        </section>

        <section id="about" className="scroll-mt-20 bg-[#eae8df] px-5 py-16 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-[1280px] items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="order-2 lg:order-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a84f35]">A little about us</p>
              <h2 className="font-display mt-3 max-w-xl text-4xl leading-tight sm:text-5xl">A neighborhood table, with a little more care.</h2>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#5f6058]">{business?.description ?? 'We bring people together over seasonal cooking, generous hospitality, and the simple pleasure of sharing a good meal.'}</p>
              <a href="#contact" className="mt-7 inline-flex items-center gap-3 text-sm font-semibold text-[#813a28]">Come say hello <span aria-hidden="true">↗</span></a>
            </div>
            <div className="order-1 overflow-hidden rounded-lg lg:order-2">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=85"
                alt="Seasonal restaurant dishes served at a candlelit table"
                loading="lazy"
                className="aspect-[5/4] h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {galleryItems.length > 0 && (
          <section id="gallery" className="scroll-mt-20 px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
            <div className="mx-auto max-w-[1280px]">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a84f35]">A look around the table</p>
                <h2 className="font-display mt-2 text-4xl sm:text-5xl">From our kitchen and dining room</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item) => (
                  <figure key={item.id} className="overflow-hidden rounded-lg bg-[#e9e6dc]">
                    <img src={item.image_url} alt={item.alt_text ?? item.title ?? 'Restaurant gallery image'} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                    {(item.title || item.description) && <figcaption className="px-3 py-2.5 text-xs leading-5 text-[#62635c]">{item.title}{item.title && item.description ? ' · ' : ''}{item.description}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="hours" className="scroll-mt-20 px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="mx-auto grid max-w-[1100px] gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a84f35]">Plan your visit</p>
              <h2 className="font-display mt-3 text-4xl sm:text-5xl">Pull up a chair.</h2>
              <p className="mt-5 max-w-sm text-sm leading-6 text-[#74756c]">We'd love to have you in. Check today's hours before you head our way.</p>
              {todayHours && <div className="mt-7 inline-flex items-center gap-3 rounded-md bg-[#eeece3] px-4 py-3 text-sm"><span className="h-2 w-2 rounded-full bg-[#707653]" /><span><strong>Today</strong><span className="mx-2 text-[#a5a398]">/</span>{formatHours(todayHours.hours)}</span></div>}
            </div>
            <div className="divide-y divide-[#e7e4db] border-y border-[#e7e4db]">
              {hours.map(({ day, hours: hoursLabel }) => (
                <div key={day} className={`flex items-center justify-between gap-4 py-3.5 text-sm ${day === currentDay ? 'font-semibold text-[#813a28]' : 'text-[#53544d]'}`}>
                  <span>{day}{day === currentDay && <span className="ml-2 rounded-sm bg-[#efe3d9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">Today</span>}</span>
                  <span className="text-right">{formatHours(hoursLabel)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ReservationForm />

        {testimonials.length > 0 && (
          <section className="bg-[#252720] px-5 py-16 text-[#fbfaf6] sm:px-8 lg:px-12 lg:py-20">
            <div className="mx-auto max-w-[1000px]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#dfb79d]">Kind words from the table</p>
              <div className="mt-8 grid gap-8 md:grid-cols-2">
                {testimonials.slice(0, 2).map((testimonial) => (
                  <figure key={testimonial.customer_name} className="border-l border-[#b75d3e] pl-5">
                    <blockquote className="font-display text-2xl leading-snug">“{testimonial.quote}”</blockquote>
                    <figcaption className="mt-4 text-sm text-white/65">{testimonial.customer_name}{testimonial.context && ` · ${testimonial.context}`}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {faqItems.length > 0 && (
          <section className="px-5 py-16 sm:px-8 lg:px-12">
            <div className="mx-auto grid max-w-[1100px] gap-8 md:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a84f35]">Good to know</p>
                <h2 className="font-display mt-3 text-4xl">A few answers.</h2>
              </div>
              <div className="divide-y divide-[#e7e4db] border-y border-[#e7e4db]">
                {faqItems.map(({ question, answer }) => (
                  <details key={question} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">{question}<span aria-hidden="true" className="text-lg font-normal text-[#a84f35] group-open:rotate-45">+</span></summary>
                    <p className="max-w-2xl pt-3 text-sm leading-6 text-[#74756c]">{answer}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="contact" className="scroll-mt-20 border-t border-[#e7e4db] bg-[#eeece3] px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="mx-auto grid max-w-[1280px] gap-10 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#a84f35]">Find your way here</p>
              <h2 className="font-display mt-3 text-4xl sm:text-5xl">Your table is waiting.</h2>
              <address className="mt-6 not-italic text-sm leading-7 text-[#5f6058]">
                {business?.address ?? 'Portland, Oregon'}<br />
                {business?.phone && <><a href={`tel:${phoneLink}`} className="hover:text-[#a84f35]">{business.phone}</a><br /></>}
                {business?.email && <a href={`mailto:${business.email}`} className="hover:text-[#a84f35]">{business.email}</a>}
              </address>
              {socialLinks.length > 0 && <div className="mt-5 flex flex-wrap gap-4">{socialLinks.map(([name, url]) => <a key={name} href={url} target="_blank" rel="noreferrer" className="text-sm font-medium capitalize text-[#813a28] hover:underline">{name} ↗</a>)}</div>}
            </div>
            <div className="flex flex-wrap gap-3">
              {business?.map_url && <a href={business.map_url} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center rounded-md bg-[#252720] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#3c3e35]">Get directions <span aria-hidden="true" className="ml-3">↗</span></a>}
              {phoneLink && <a href={`tel:${phoneLink}`} className="inline-flex min-h-12 items-center rounded-md border border-[#c6c3b8] px-5 py-3 text-sm font-semibold text-[#252720] transition hover:bg-white/60">Call the restaurant</a>}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#252720] px-5 py-8 text-[#fbfaf6] sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-xl">{displayName}</p>
            <p className="mt-1 text-xs text-white/55">{business?.tagline ?? 'Good food. Good moments.'}</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
            <a href="#menu" className="hover:text-white">Menu</a>
            <a href="#about" className="hover:text-white">Our story</a>
            <a href="#hours" className="hover:text-white">Hours</a>
            <a href="#reservations" className="hover:text-white">Reservations</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <a href="/login" className="hover:text-white">Staff login</a>
          </nav>
          <p className="text-xs text-white/45">© {calendar?.year ?? ''} {displayName}</p>
        </div>
      </footer>
    </div>
  )
}