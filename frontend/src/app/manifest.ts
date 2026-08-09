import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NO LOVERS · Badminton Tracker",
    short_name: "NO LOVERS",
    description: "Private badminton scores, rankings, and player stats for the NO LOVERS friend group.",
    start_url: "/",
    display: "standalone",
    background_color: "#07110c",
    theme_color: "#b7f34a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
