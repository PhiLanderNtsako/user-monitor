import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
  name: "Switchboard Monitor",
  short_name: "Switchboard",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#2563eb",
  description: "Track user availability in real-time",
  icons: [
    {
      src: "/icons/icon-192.png",
      sizes: "192x192",
      type: "image/png"
    },
    {
      src: "/icons/icon-512.png",
      sizes: "512x512",
      type: "image/png"
    }
  ]
}
}