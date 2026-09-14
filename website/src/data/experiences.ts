import { useTranslation } from 'react-i18next'

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

const EXPERIENCE_STRUCTURE = [
  {
    id: 'private-game-drives',
    key: 'privateGameDrives',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAzDORQGzBhE653IzrnsbqN-MfIO6xMlfVhjnGL9cef0Vh6TBKPMU-J908EA2BPcbmAPdDKhPX6i6csPAy8bxsmN5aSdytbephdU0YGUHEKER3ZdIm6r2P2UGReusGtlRQi-jw36qzNE-G99somszCa4RN3mL4pvfH2-scrrfe7Kea1aFB0quVqkbpKqqqY-QF4sMvtSXA0J9PRVr2hTUwXcVvX9WNiphn4qlHVI2VJGhDt7swCJXQQ',
    hasTags: true,
    hasBadge: true,
  },
  {
    id: 'hot-air-balloon-safaris',
    key: 'hotAirBalloonSafaris',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBc6RSNaLc-kVI9Wy6wRk9jyDxkwtBqt4bOREWoaUjZ2QAKtUEaaGdgG2Ey5AQph6h1jICr-sWSbHFI5NRrteZ4wB432lDuowZCLjjLI1jCZooOTLSSpk2GrarC0mU9yfU3T9VQrjJmyqqtze6diRc9rq5PVAvgVQH88vLFjTILWo56y3rbRJS6U4tOQBPyZK00QH_5HJ9VI0mZwjrhoWpfY9SXmg9hZRHkq2Wqh8rQ0OxS198D1eoe',
    hasQuote: true,
  },
  {
    id: 'guided-walking-safaris',
    key: 'guidedWalkingSafaris',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBmHfR1Rj3MkCHZ5OMx1tdekEjnLZ0xeF-PqxAYNOYRg7RHIH7bWi6ikRA5iSNvhKfwMJi_LQYxV3pRqHZsBIOnw6Sk3REwWO7IDQ66jwiaYjgM6Vhk5pmRQ0s9b5scqY2Ly7IYKLZdqMxPyIGyq3qbZs_HbIoQnDJV1eY0oeja1_V4fIMreDCN-adtkJojUdJsQCe-XjqyBKIw5_18JHnpzEkhmIECSJQVeAE2x0aM-ka1Mh4eKA-l',
    hasTags: true,
  },
  {
    id: 'cultural-maasai-visits',
    key: 'culturalMaasaiVisits',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_ORo1_3S7apImjfiqvmeFxw1Uh1uYhpr7tRzyTH3v2RQwu3OPWFiR-hJv6rKbbo9h86TufJOmSCEh-0QI5rpLSSYdF2r4nPQDnUXb-I5DZ8WWnXaWktzZ2F6FBwgYF8IlRlge6D0fqNN2iKg76uO2Hb7KCc9gdI90dy1sBiahrPtDgNw8C_-xNSbgijUQAcQl8VXI6UmtOZQBnBgBfCaHH35S5ej6xbpLNVyRIqc7a3QUsm7PE_ki',
    hasTags: true,
  },
  {
    id: 'birdwatching-paradises',
    key: 'birdwatchingParadises',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDVxdXJx03Mb2UV9wLDYT43eBslxTXT_UPsLxYuaTT354MqAcaOTfOo_KMEIYHSFDLG0PUSwl66yl7ylYCOwdxo2qGTWBMYSMFIZBIwBBvQfo9YddSy5O9n4RzScoaKZzcukBoZGSyyydL_ZH1f0h-PW1--n2j_ThBHLU3GPoyY28w_p-aihxWqaUsQjyG18pQD3GyDMQbbMpWnBMgp-FDGuXNmSmtO6T7_b4fq0KiKcRF4igduVUzm',
    stats: [
      { value: '1,100+', labelKey: 'species' },
      { value: '7', labelKey: 'endemicBirds' },
    ],
  },
  {
    id: 'zanzibar-beach-extensions',
    key: 'zanzibarBeachExtensions',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuApIwHcLzdwJ9EjFbVoxd58ANay9BBKLOF1tsr2bJXXYCfYh80WqHyVfoQAk_Sv4TlbUpC8dIC_f1chOeSJ1gpCPilWyfBF_T0iqYvbk2GJC8jmk1DNH2bu1ZSZMk4t1T_sgO2oJXpZudIYOX3EdDWNSLEZJwxSqEIwfOsLZKN4otoW8L82NKmodRVPu_SkwYp1qu7daGzxNPntKT58pyS7bGEZXLC9yhDoLTAId3X5QIQPowiYPnGW',
    hasTags: true,
  },
] as const

export function useExperiencesHero() {
  const { t } = useTranslation('experiences')
  return {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBocvQ92dCoBSglruXzQExVqJxoDZF6YnSBcJXtIGNrENpQvecr-mjcOTpvsuZ0xk0B3H_xniCpR9ngzhitfZBMBWmKadthWc_hPBasmHyIMh4Pw-PsNqZ00Y-gMh0W_yJrty3wgf_p4Kel-kA0ODoxSM6jd095mrN2GlgpoZM_cznL6YtbfazO8cEWKmCu5J_Vkxj8c0u2ScZ4XodN-U2kKu6qP9nqxf5ETAXqM7MneH8URPvfC6-c',
    imageAlt: t('hero.imageAlt'),
  }
}

export function useExperiences(): Experience[] {
  const { t } = useTranslation('experiences')
  return EXPERIENCE_STRUCTURE.map((item) => ({
    id: item.id,
    title: t(`items.${item.key}.title`),
    description: t(`items.${item.key}.description`),
    image: item.image,
    imageAlt: t(`items.${item.key}.imageAlt`),
    tags: 'hasTags' in item && item.hasTags ? (t(`items.${item.key}.tags`, { returnObjects: true }) as string[]) : undefined,
    stats: 'stats' in item ? item.stats.map((s) => ({ value: s.value, label: t(`items.${item.key}.stats.${s.labelKey}`) })) : undefined,
    badge: 'hasBadge' in item && item.hasBadge ? t(`items.${item.key}.badge`) : undefined,
    quote: 'hasQuote' in item && item.hasQuote ? t(`items.${item.key}.quote`) : undefined,
  }))
}
