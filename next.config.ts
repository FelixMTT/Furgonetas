import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para Vercel - usar output: 'standalone' para melhor desempenho
  output: 'standalone',
  // Configuración de imágenes si usas dominios externos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
