export interface Destination {
  id: string
  name: string
  image: string
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
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBnbgz_Vx_Odn4uBgHP2ZGThHrr5wn9Nt_fKzUhSI1LX_5EcDwdMonrrXg6PrQjo6n72NeimzXx9YL_skIQdIMEoDjzr49H9Zs2qobQ4YxrbUtIw5MgjghpB8oNeB4FK2hsq7Sn1Q_3caowgYxL_xDRyMkO5W7j-ron_z2JSiPaOhQ-QIkjtKsOZVbBTMahBNDZcI3LuwqwseOhukNGplN2mrxG43qWKP52rwIlfMbP55rDUoaeaAIb',
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
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD7MOpjJDz6js7X8i1PEUdJqLEn7CaTMn2JHjtbHAI_9hmdOdGzcMnUqUFM-z5baz2A1FqhR1_MB9dg0n_W_mCMMrEiUwaqZxhlByY6zE5l7JergYKPQKztFwPK2qbAHK1C7HHMwFvgAkvqwUF8KPOB31lodmDmKcENybb7cgBzJtusvmJmwLwvCkKCRZCLD5g7_BPOMNuUuGnDUAkG-1Bt3sFI3nTa7DiwzYh1OyL9gHsk2OfAJZM9',
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
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAoGAjeE2rNYN2t6Pj6Bl_eH9e0pbLYnE6ZCy8Ex_ocM00Nxon-EC7ISGUTTzM2VZSkujMyAk82_A_tZhyGijOLmsQ7iDb_mOM1j57dTt1ViRDumDsP_H4bBsRX8wOq1OX8mc26uQJRgIhCozAJPo6T0pv6zoN4arcdiz03IUVpnRaLtwFDzFgi0AgNMMxtFNTFzW1Y78grO29qvz8-9PBAdifg1-V_g7DMYQYf22k00a9YDQj8ctv-',
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
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzWaW1mOT0Rmwr8duuuG0x544AeRKj6SLEXQRZSVOqNi-56OFrLnTE59aBS5PKSlCulgYMVgCKfiLcCarXpk23HGdgEaQMlHji8sTC0i7HgRGZl9jy_DXreiXt-dV6pd5pSgxLgkPmnEu-5E0enfsmU7EP8NLGJg1SndX554PkSAL4bpr1nZu69ttNlEct-zER_-gMe9qff-97HrUfH5BTSG_Zdcqpac0EdKGNR1eotkNZ07jbnRn5',
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
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBybj_xlSQp1a2HhbHgMbi2ye15bouVPiAcXazmr9Jr0oD-wQwPE3jjZFzud3HggviV2x_HXyFVTvIA05W2tYSEG4Rn9VwZHUT35xdtwuZcuRKWUKIwFeh0SNAHZWgrFUCg0cqhy0sYThzLyV7UDfnzrwfaod6yA_0ypw8LxGLEKyYiNTYgJQAZskc5t5c0O_yzM4qgSKnifUXiG2kAB1P2s7bHVCKiSeOOIlFRNN6jzSMulUIQeF2Z',
    imageAlt: 'The historic ruins of Kilwa Kisiwani.',
    badge: 'UNESCO World Heritage',
    tags: ['Ancient Ruins'],
    bestTimeToVisit: 'June – October',
    highlight: 'Kilwa Kisiwani, Songo Mnara',
    linkLabel: 'Historical Tours',
  },
]
