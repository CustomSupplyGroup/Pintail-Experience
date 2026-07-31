import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Pintail Experience",
    short_name: "Pintail",
    description:
      "An intentional, faith-centered hunting retreat — in your pocket from confirmation to long after the trip.",
    start_url: "/home",
    display: "standalone",
    background_color: "#1f2421",
    theme_color: "#1f2421",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
