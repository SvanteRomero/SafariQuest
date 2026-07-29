export interface Experience {
  id: string
  title: string
  description: string
  image: string
  imageAlt: string
  tags?: string[]
  stats?: { value: string; label: string }[]
  badge?: string
  quote?: string
}

export const experiencesHero = {
  image:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBocvQ92dCoBSglruXzQExVqJxoDZF6YnSBcJXtIGNrENpQvecr-mjcOTpvsuZ0xk0B3H_xniCpR9ngzhitfZBMBWmKadthWc_hPBasmHyIMh4Pw-PsNqZ00Y-gMh0W_yJrty3wgf_p4Kel-kA0ODoxSM6jd095mrN2GlgpoZM_cznL6YtbfazO8cEWKmCu5J_Vkxj8c0u2ScZ4XodN-U2kKu6qP9nqxf5ETAXqM7MneH8URPvfC6-c',
  imageAlt:
    'Colorful hot air balloons floating over the Serengeti savanna at sunrise, silhouetted acacia trees and grazing wildlife below.',
}

export const experiences: Experience[] = [
  {
    id: 'private-game-drives',
    title: 'Private Game Drives',
    description:
      'Embark on a journey through the wild heart of Tanzania. Our custom-designed 4x4 vehicles offer 360-degree views, ensuring you never miss a Great Migration moment or a rare leopard sighting.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzDORQGzBhE653IzrnsbqN-MfIO6xMlfVhjnGL9cef0Vh6TBKPMU-J908EA2BPcbmAPdDKhPX6i6csPAy8bxsmN5aSdytbephdU0YGUHEKER3ZdIm6r2P2UGReusGtlRQi-jw36qzNE-G99somszCa4RN3mL4pvfH2-scrrfe7Kea1aFB0quVqkbpKqqqY-QF4sMvtSXA0J9PRVr2hTUwXcVvX9WNiphn4qlHVI2VJGhDt7swCJXQQ',
    imageAlt:
      'An open-sided safari vehicle parked near a pride of lions in tall golden grass, with a guide explaining wildlife behavior to travelers.',
    tags: ['Expert certified driver-guides', 'Sunrise and sunset expeditions'],
    badge: 'Most Popular',
  },
  {
    id: 'hot-air-balloon-safaris',
    title: 'Hot Air Balloon Safaris',
    description:
      'Ascend into the quiet dawn and float over the infinite plains. Watch the shadows of thousands of wildebeest stretch across the horizon as the sun crests, followed by a celebratory champagne breakfast in the bush.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBc6RSNaLc-kVI9Wy6wRk9jyDxkwtBqt4bOREWoaUjZ2QAKtUEaaGdgG2Ey5AQph6h1jICr-sWSbHFI5NRrteZ4wB432lDuowZCLjjLI1jCZooOTLSSpk2GrarC0mU9yfU3T9VQrjJmyqqtze6diRc9rq5PVAvgVQH88vLFjTILWo56y3rbRJS6U4tOQBPyZK00QH_5HJ9VI0mZwjrhoWpfY9SXmg9hZRHkq2Wqh8rQ0OxS198D1eoe',
    imageAlt:
      'A champagne breakfast set up under an acacia tree in the Serengeti plains with a hot air balloon being packed away in the background.',
    quote: 'The most peaceful way to witness the majesty of Africa. An absolute must-do for any traveler.',
  },
  {
    id: 'guided-walking-safaris',
    title: 'Guided Walking Safaris',
    description:
      'Step out of the vehicle and into the wild. Guided by expert trackers and armed rangers, you’ll learn the secrets of the bush — from identifying tracks and medicinal plants to the thrill of approaching wildlife on foot.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBmHfR1Rj3MkCHZ5OMx1tdekEjnLZ0xeF-PqxAYNOYRg7RHIH7bWi6ikRA5iSNvhKfwMJi_LQYxV3pRqHZsBIOnw6Sk3REwWO7IDQ66jwiaYjgM6Vhk5pmRQ0s9b5scqY2Ly7IYKLZdqMxPyIGyq3qbZs_HbIoQnDJV1eY0oeja1_V4fIMreDCN-adtkJojUdJsQCe-XjqyBKIw5_18JHnpzEkhmIECSJQVeAE2x0aM-ka1Mh4eKA-l',
    imageAlt:
      'A line of travelers walking through low bushveld led by an armed park ranger and a local tracker in traditional attire.',
    tags: ['Track Big Game', 'Eco-Awareness'],
  },
  {
    id: 'cultural-maasai-visits',
    title: 'Cultural Maasai Visits',
    description:
      'Connect with the soulful heritage of the Maasai people. Visit a traditional boma, participate in ancient dances, and learn about a way of life that has remained harmonious with nature for centuries.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_ORo1_3S7apImjfiqvmeFxw1Uh1uYhpr7tRzyTH3v2RQwu3OPWFiR-hJv6rKbbo9h86TufJOmSCEh-0QI5rpLSSYdF2r4nPQDnUXb-I5DZ8WWnXaWktzZ2F6FBwgYF8IlRlge6D0fqNN2iKg76uO2Hb7KCc9gdI90dy1sBiahrPtDgNw8C_-xNSbgijUQAcQl8VXI6UmtOZQBnBgBfCaHH35S5ej6xbpLNVyRIqc7a3QUsm7PE_ki',
    imageAlt:
      'Maasai warriors in vibrant red shukas standing together on a hilltop at sunset above the Ngorongoro Conservation Area.',
    tags: ['Authentic, non-commercial interactions', 'Support local community projects'],
  },
  {
    id: 'birdwatching-paradises',
    title: 'Birdwatching Paradises',
    description:
      'With over 1,100 species, Tanzania is an ornithologist’s dream. From the flamingos of Lake Manyara to the endemic species of the Udzungwa Mountains, our specialized guides help you spot the rarest avian treasures.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVxdXJx03Mb2UV9wLDYT43eBslxTXT_UPsLxYuaTT354MqAcaOTfOo_KMEIYHSFDLG0PUSwl66yl7ylYCOwdxo2qGTWBMYSMFIZBIwBBvQfo9YddSy5O9n4RzScoaKZzcukBoZGSyyydL_ZH1f0h-PW1--n2j_ThBHLU3GPoyY28w_p-aihxWqaUsQjyG18pQD3GyDMQbbMpWnBMgp-FDGuXNmSmtO6T7_b4fq0KiKcRF4igduVUzm',
    imageAlt:
      'A close-up of a lilac-breasted roller bird perched on a thorny acacia branch with a soft-bokeh savanna background.',
    stats: [
      { value: '1,100+', label: 'Species' },
      { value: '7', label: 'Endemic Birds' },
    ],
  },
  {
    id: 'zanzibar-beach-extensions',
    title: 'Zanzibar Beach Extensions',
    description:
      'The perfect "Bush to Beach" finale. Trade the golden savanna for the turquoise waters of the Indian Ocean. Relax on pristine white sands, explore the spice markets of Stone Town, or dive into vibrant coral reefs.',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApIwHcLzdwJ9EjFbVoxd58ANay9BBKLOF1tsr2bJXXYCfYh80WqHyVfoQAk_Sv4TlbUpC8dIC_f1chOeSJ1gpCPilWyfBF_T0iqYvbk2GJC8jmk1DNH2bu1ZSZMk4t1T_sgO2oJXpZudIYOX3EdDWNSLEZJwxSqEIwfOsLZKN4otoW8L82NKmodRVPu_SkwYp1qu7daGzxNPntKT58pyS7bGEZXLC9yhDoLTAId3X5QIQPowiYPnGW',
    imageAlt:
      'A white sand beach on the Zanzibar archipelago meeting turquoise water, with a wooden dhow sailboat on the horizon.',
    tags: ['Turquoise Waters', 'Spice Tours'],
  },
]
