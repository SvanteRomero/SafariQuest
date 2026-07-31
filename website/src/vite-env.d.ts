/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTACT_PHONE: string
  readonly VITE_CONTACT_PHONE_HREF: string
  readonly VITE_CONTACT_EMAIL: string
  readonly VITE_CONTACT_ADDRESS: string
  readonly VITE_SOCIAL_INSTAGRAM: string
  readonly VITE_SOCIAL_FACEBOOK: string
  readonly VITE_SOCIAL_WHATSAPP: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
