import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Editor de Grupos | Las Flores",
  description: "Aplicación profesional para la gestión y edición de grupos de publicadores de la congregación Las Flores. Administra información, privilegios y registros mensuales de manera eficiente.",
  keywords: ["editor de grupos", "publicadores", "congregación", "Las Flores", "gestión", "XML"],
  authors: [{ name: "Las Flores" }],
  creator: "Las Flores",
  publisher: "Las Flores",
  
  // Open Graph (Facebook, LinkedIn, Discord)
  openGraph: {
    title: "Editor de Grupos | Las Flores",
    description: "Gestión profesional de grupos de publicadores",
    url: "https://tu-dominio.com", // Cambia esto por tu URL
    siteName: "Editor de Grupos Las Flores",
    images: [
      {
        url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop", // Cambia por tu imagen
        width: 1200,
        height: 630,
        alt: "Editor de Grupos Las Flores",
      },
    ],
    locale: "es_AR",
    type: "website",
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "Editor de Grupos | Las Flores",
    description: "Gestión profesional de grupos de publicadores",
    images: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=630&fit=crop"], // Cambia por tu imagen
  },

  // Iconos y tema
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },

  // Manifest para PWA
  manifest: "/manifest.json",

  // Theme color
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4f46e5" },
    { media: "(prefers-color-scheme: dark)", color: "#4338ca" },
  ],

  // Viewport
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },

  // Robots
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Meta tags adicionales */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Editor Grupos" />
        
        {/* Preconnect para optimización */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
