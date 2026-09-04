import { defineRailway, github, preserve, project, service } from "railway/iac";

export default defineRailway(() => {
  const SafariQuest = service("SafariQuest", {
    source: github("SvanteRomero/SafariQuest", { checkSuites: false, rootDirectory: "/website" }),
    // Serve the built Vite SPA (dist/) via `serve` on $PORT.
    start: "pnpm start",
    healthcheck: "/",
    healthcheckTimeout: 100,
    replicas: { "us-west2": 1 },
    domains: ["pandewildernesstravels.com"],
    networking: { privateNetworkEndpoint: "safariquest" },
    env: { VITE_CONTACT_ADDRESS: preserve(), VITE_CONTACT_EMAIL: preserve(), VITE_CONTACT_PHONE: preserve(), VITE_CONTACT_PHONE_HREF: preserve(), VITE_SOCIAL_FACEBOOK: preserve(), VITE_SOCIAL_INSTAGRAM: preserve(), VITE_SOCIAL_WHATSAPP: preserve() },
  });

  return project("renewed-cooperation", {
    resources: [SafariQuest],
  });
});
