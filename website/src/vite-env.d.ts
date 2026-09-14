/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Guaranteed by vite.config.ts, which fails the production build without it.
  readonly VITE_API_URL: string

  readonly VITE_CONTACT_PHONE: string
  readonly VITE_CONTACT_PHONE_HREF: string
  readonly VITE_CONTACT_EMAIL: string
  readonly VITE_CONTACT_ADDRESS: string

  // Optional, and empty in .env / .env.example today. Declaring these as plain
  // `string` was a lie the compiler could not catch: consumers have to handle
  // the unset case, and the footer was rendering href="#" because of it.
  readonly VITE_SOCIAL_INSTAGRAM?: string
  readonly VITE_SOCIAL_FACEBOOK?: string
  readonly VITE_SOCIAL_WHATSAPP?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
