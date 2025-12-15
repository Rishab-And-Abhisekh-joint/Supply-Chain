// next.config.js
// FIXED: Proper configuration to prevent Firebase bundling issues

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Enable React strict mode for better development
    reactStrictMode: true,
    
    // Transpile Firebase packages to avoid ESM/CJS issues
    transpilePackages: [
      'firebase',
      '@firebase/app',
      '@firebase/auth', 
      '@firebase/firestore',
      '@firebase/util',
      '@firebase/component',
      '@firebase/logger',
    ],
    
    // Webpack configuration for proper Firebase handling
    webpack: (config, { isServer }) => {
      // Fix for Firebase in production builds
      if (!isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          net: false,
          tls: false,
          crypto: false,
        };
      }
      
      return config;
    },
    
    // Environment variables exposed to the browser
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    
    // Image optimization configuration
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
    
    // Disable x-powered-by header for security
    poweredByHeader: false,
    
    // Experimental features
    experimental: {
      // Enable server actions if using Next.js 14+
      serverActions: {
        bodySizeLimit: '2mb',
      },
    },
  };
  
  module.exports = nextConfig;