import { defineConfig } from "vite";
import { resolve } from "node:path";

// Plugin to serve extensionless URLs correctly in local development
function cleanUrlsDevPlugin() {
  return {
    name: "clean-urls-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && !req.url.endsWith('/') && !req.url.includes(".")) {
          req.url += ".html";
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [cleanUrlsDevPlugin()],
  build: {
    rollupOptions: {
      // Explicitly initialize all pages
      input: {
        'index': resolve(__dirname, 'index.html'),
        'about-us': resolve(__dirname, 'about-us.html'),
        'barcode-scanner': resolve(__dirname, 'barcode-scanner.html'),
        'contact-us': resolve(__dirname, 'contact-us.html'),
        'disclaimer': resolve(__dirname, 'disclaimer.html'),
        'image-qr-scanner': resolve(__dirname, 'image-qr-scanner.html'),
        'privacy-policy': resolve(__dirname, 'privacy-policy.html'),
        'qr-code-generator': resolve(__dirname, 'qr-code-generator.html'),
        'terms-of-service': resolve(__dirname, 'terms-of-service.html'),
        'wifi-qr-scanner': resolve(__dirname, 'wifi-qr-scanner.html'),
      },
    },
  },
});
