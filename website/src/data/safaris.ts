export interface SafariPackage {
  id: string
  title: string
  image: string
  imageAlt: string
  rating: number
  days: number
  accommodation: string
  price: number
  badge?: string
  signature?: boolean
  destination: 'Serengeti National Park' | 'Ngorongoro Conservation Area' | 'Tarangire & Manyara' | 'Zanzibar Extensions'
}

export const safariPackages: SafariPackage[] = [
  {
    id: 'great-migration-path',
    title: 'Great Migration Path',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBuI5OyQjW9raHxyRlAbmvWHJi3CybTwaIrZuOmdpOgYYprthtS9ZwcpmEqIMljBx2sE8EpTzeocODs8eFM_rSTODzFdumC6ReI8DGe_7YN_bNY1Iku4UI9jRSPbqae1c-0eyMCclcWtGbaWCuSawyKsgFvCkxyZAYrkoS_OOguukwZLw8gGQde_ASEnF1RODE0F65cNP3sNUOCncd4pKg7jHZVQMyDiHKdjlNlMSsZ8-3IQLToQXoD',
    imageAlt: 'A pride of lions resting in golden tall grass under a clear Serengeti morning sky.',
    rating: 4.9,
    days: 8,
    accommodation: 'Luxury Tents',
    price: 4250,
    badge: 'Most Popular',
    signature: true,
    destination: 'Serengeti National Park',
  },
  {
    id: 'ngorongoro-exclusive',
    title: 'Ngorongoro Exclusive',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAHkCl_Uhy40EKsr2G_L14Bjv6iTfTUXAnD8MGxbzUpmIaCm2yFqiiC2uEF1rbt2sH_BhKHvfW9QyaIYOZrwtT2QLkmBb0u-iTqzMcEfEQHgPs9ciAu8J5M8fAJrjnAXACNvztaVYLkXrJ--x5SFpgkpRR7pzT--MIGJWvJZ0KD4wuY5MZ30NZVeG8GiGZX-DyQD2lQzPUEHzue9PZrRYINZsauCi_nZcAuhRepvesIv7NZrPYrUehm',
    imageAlt: 'A luxury glamping tent on a wooden deck overlooking the Ngorongoro Crater at dawn.',
    rating: 5.0,
    days: 5,
    accommodation: 'Safari Lodge',
    price: 2800,
    signature: true,
    destination: 'Ngorongoro Conservation Area',
  },
  {
    id: 'tarangire-giants',
    title: 'Tarangire Giants',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBVaSkzcE4rmmVcZ_y0bRiZRfjigj0BX7bYAzpDANOxbeKSWHTw7zPSbaoVo7st-6M6fxOGTTDoNGIgJY89x6gDAMTeGJBzTCITIszCTsxhgMDvrGPBLGKoZiwoGz0aL_hagm6YOCqoCyKtQnHxJJcRxy7OSlchD8Q9-ZxIT1LJk2lvX15KVszOP-hGawT9UIm-rdgc3t0p3jiswbyUjW5YKVa50d4DEgqeK-EEA7hqz4KMC5XXgLzK',
    imageAlt: 'A large herd of elephants gathering at a watering hole in Tarangire National Park among baobab trees.',
    rating: 4.8,
    days: 4,
    accommodation: 'Mobile Camp',
    price: 1950,
    signature: true,
    destination: 'Tarangire & Manyara',
  },
  {
    id: 'big-five-pursuit',
    title: 'The Big Five Pursuit',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD2zw_92y7yS-2USGDZlMKzwCMLUFRE2iPbW_15fQOmsbbAIjng7Rvo9O0gl4ma6zFI2o3KfP8Q2tlYzYwiBUeqBfeZ7GG9oRNPGvrTWqh9Cyis6sn2t_N1svhaZ8kpCgTBqrzMIfV9RD762fMSsCV50u1CwWVtpq-JuHya25-3qvmpclmRx30r7YifV45qoK611RxyIw_G7ANWrLVWmoIsPaDBZSfQdBe_7xLoFlY8JLVYuknFTBMe',
    imageAlt: 'A leopard draped over an acacia tree limb in the Seronera Valley with dappled sunlight.',
    rating: 4.9,
    days: 10,
    accommodation: 'Luxury Tents',
    price: 5600,
    destination: 'Serengeti National Park',
  },
  {
    id: 'sky-and-savanna',
    title: 'Sky & Savanna',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBOdxdmcdsiaZTDhsmPXUiUxjgQE1dpGXeCaG65nlmwXubLlSq4RAKTab-fXn3y-_2OHc6M0tkcsd7C2zo_cybSfhM86ycRE3AOQaQvXgZfEfWT6HBA8M74LN4IpjVJ6pm4GPBb3ay_BoCWhB86bblzSmx5QPehhuvJp6PCYgq7z65lyUvbBNTE7a5vz4iRDOX8gqiyKSQl6kq1Y19ABV7Wga9Fb0gIY6FyvY0anMDJCWeRu7M8BrA5',
    imageAlt: 'Hot air balloons floating over the Serengeti plains at sunrise above migrating wildebeest.',
    rating: 4.7,
    days: 6,
    accommodation: 'Premier Lodge',
    price: 3900,
    destination: 'Serengeti National Park',
  },
  {
    id: 'bush-to-beach',
    title: 'Bush to Beach',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcXaoVz8IIMFpsGih23HWzS_2AVGtPh5Fl4G4y88UaCgDumBl1U7rW7fmZSeJR6mL0UZZpQ4YWD8tBYpIhJ8AWqwO3XSB0nJsp92BGPTXaX4armd9iZ3eXNMcliKYU1aOMDmKrVXx4aV7xda17uDGKZ9K2QNox99l2hVxGRC6qvFyDrejtB8pEpA-kIHARgKkRNAkxHkaj1WeT4OUFJCU0A2_lVz55wKcR8_gWO53IPZHHLvfsN7qP',
    imageAlt: 'A white sand Zanzibar beach with turquoise water and a traditional wooden dhow sailboat.',
    rating: 5.0,
    days: 12,
    accommodation: 'Resort & Tent',
    price: 6400,
    destination: 'Zanzibar Extensions',
  },
]

export const signaturePackages = safariPackages.filter((p) => p.signature)
