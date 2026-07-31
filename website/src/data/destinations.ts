export interface Destination {
  id: string
  name: string
  images: string[]
  imageAlt: string
  badge: string
  tags: string[]
  bestTimeToVisit: string
  highlight: string
  linkLabel: string
}

export const destinations: Destination[] = [
  {
    id: 'arusha',
    name: 'Arusha',
    images: [
      '/images/destinations/arusha-1.jpg',
      '/images/destinations/arusha-2.jpg',
      '/images/destinations/arusha-3.jpeg',
    ],
    imageAlt: 'Arusha city view with Mount Meru rising in the background.',
    badge: 'Safari Capital',
    tags: ['Gateway to Northern Circuit', 'Mount Meru'],
    bestTimeToVisit: 'June – October',
    highlight: 'Cultural Markets, Coffee Plantations',
    linkLabel: 'View Regional Tours',
  },
  {
    id: 'morogoro',
    name: 'Morogoro',
    images: [
      '/images/destinations/morogoro-1.jpeg',
      '/images/destinations/morogoro-2.jpg',
      '/images/destinations/morogoro-3.jpeg',
    ],
    imageAlt: 'The lush green Uluguru Mountains overlooking Morogoro.',
    badge: 'Uluguru Mountains',
    tags: ['Agricultural Hub'],
    bestTimeToVisit: 'June – September',
    highlight: 'Mountain Trekking, Waterfall Hikes',
    linkLabel: 'Explore Morogoro',
  },
  {
    id: 'dar-es-salaam',
    name: 'Dar es Salaam',
    images: ['/images/destinations/dar-es-salaam-1.jpg', '/images/destinations/dar-es-salaam-2.jpg'],
    imageAlt: 'Dar es Salaam skyline and harbor at dusk.',
    badge: 'Coastal Capital',
    tags: ['Commercial Capital', 'Coastal City'],
    bestTimeToVisit: 'June – October',
    highlight: 'Seafood Markets, Nightlife, Beaches',
    linkLabel: 'City Guide',
  },
  {
    id: 'zanzibar',
    name: 'Zanzibar',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzWaW1mOT0Rmwr8duuuG0x544AeRKj6SLEXQRZSVOqNi-56OFrLnTE59aBS5PKSlCulgYMVgCKfiLcCarXpk23HGdgEaQMlHji8sTC0i7HgRGZl9jy_DXreiXt-dV6pd5pSgxLgkPmnEu-5E0enfsmU7EP8NLGJg1SndX554PkSAL4bpr1nZu69ttNlEct-zER_-gMe9qff-97HrUfH5BTSG_Zdcqpac0EdKGNR1eotkNZ07jbnRn5',
    ],
    imageAlt: 'Zanzibar beach with turquoise water and white sand.',
    badge: 'Spice Island',
    tags: ['Stone Town'],
    bestTimeToVisit: 'June – October',
    highlight: 'Diving, Spice Tours, History',
    linkLabel: 'Island Escapes',
  },
  {
    id: 'kilwa',
    name: 'Kilwa',
    images: ['/images/destinations/kilwa-1.jpeg', '/images/destinations/kilwa-2.jpg'],
    imageAlt: 'The historic ruins of Kilwa Kisiwani.',
    badge: 'UNESCO World Heritage',
    tags: ['Ancient Ruins'],
    bestTimeToVisit: 'June – October',
    highlight: 'Kilwa Kisiwani, Songo Mnara',
    linkLabel: 'Historical Tours',
  },
]
