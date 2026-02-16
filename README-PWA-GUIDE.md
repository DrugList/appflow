# AppFlow - No-Code PWA Builder

A powerful, Glide-like Progressive Web App (PWA) platform that allows users to build no-code applications with forms, databases, and custom features. Users can create apps, connect to Google Sheets, capture rich data, and deploy as installable PWAs.

## 🚀 Features

### Core Features
- **No-Code App Builder** - Drag-and-drop form builder with 18+ field types
- **Rich Data Capture** - Forms, barcodes, locations, signatures, and photo capture
- **Google Sheets Integration** - OAuth-based connection with push/pull sync
- **Customizable Design** - Icons, colors, dark/light mode
- **PWA Ready** - Installable, offline-capable, push notification ready

### Field Types
- **Text & Numbers**: Short text, Long text, Email, Phone, Number, URL
- **Date & Time**: Date, Time, Date & Time
- **Choice**: Dropdown, Multi-Select, Radio, Checkbox
- **Media**: Photo, File Upload, Signature
- **Special**: Location (GPS), Barcode/QR Scanner

### PWA Features
- ✅ Service Worker with Workbox-style caching strategies
- ✅ Offline indicator and offline data queuing
- ✅ Pull-to-refresh on mobile
- ✅ Installable on home screen (iOS & Android)
- ✅ Dark/Light mode toggle
- ✅ Background sync for offline submissions
- ✅ Push notification ready

---

## 📁 Project Structure

```
/appflow
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── apps/             # App CRUD operations
│   │   │   │   ├── [id]/         # Single app operations
│   │   │   │   │   ├── records/  # Record management
│   │   │   │   │   └── publish/  # Publish toggle
│   │   │   │   └── route.ts      # List/Create apps
│   │   │   └── integrations/
│   │   │       └── google-sheets/ # Google Sheets integration
│   │   ├── layout.tsx            # Root layout with PWA
│   │   └── page.tsx              # Main dashboard
│   │
│   ├── components/
│   │   ├── app-builder/          # App builder components
│   │   │   ├── AppBuilder.tsx    # Main builder
│   │   │   ├── AppRuntime.tsx    # Published app viewer
│   │   │   ├── FieldPalette.tsx  # Field type selector
│   │   │   ├── FormCanvas.tsx    # Form builder canvas
│   │   │   ├── PropertyPanel.tsx # Field properties editor
│   │   │   └── TopBar.tsx        # Builder toolbar
│   │   │
│   │   ├── integrations/         # Third-party integrations
│   │   │   └── GoogleSheetsConnector.tsx
│   │   │
│   │   ├── pwa/                  # PWA components
│   │   │   ├── PWAProvider.tsx   # PWA context provider
│   │   │   ├── InstallPrompt.tsx # Install prompt UI
│   │   │   └── OfflineIndicator.tsx
│   │   │
│   │   └── ui/                   # shadcn/ui components
│   │
│   ├── hooks/
│   │   ├── use-pwa.ts            # PWA status & install
│   │   ├── use-mobile.ts         # Mobile detection
│   │   └── use-toast.ts          # Toast notifications
│   │
│   ├── lib/
│   │   ├── app-builder/
│   │   │   ├── store.ts          # Zustand state management
│   │   │   └── utils.ts          # Builder utilities
│   │   ├── db.ts                 # Prisma client
│   │   └── utils.ts              # General utilities
│   │
│   └── types/
│       └── app-builder.ts        # TypeScript definitions
│
├── public/
│   ├── icons/                    # PWA icons
│   ├── manifest.json             # Web app manifest
│   ├── sw.js                     # Service worker
│   └── logo.svg                  # App logo
│
├── prisma/
│   └── schema.prisma             # Database schema
│
└── package.json
```

---

## 🛠️ Step-by-Step Build Guide

### Step 1: Project Setup

```bash
# Create Next.js 15 project
bun create next-app appflow --typescript --tailwind --app

# Navigate to project
cd appflow

# Install dependencies
bun add framer-motion zustand @prisma/client lucide-react
bun add next-themes sonner class-variance-authority clsx tailwind-merge

# Install shadcn/ui
bunx shadcn@latest init
bunx shadcn@latest add button card dialog dropdown-menu input label select tabs textarea badge switch separator scroll-area
```

### Step 2: Database Schema (Prisma)

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model App {
  id          String   @id @default(cuid())
  name        String
  description String?
  icon        String?
  iconColor   String   @default("#3B82F6")
  published   Boolean  @default(false)
  schema      String   // JSON: fields, views, settings
  settings    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  records     Record[]
  dataSources DataSource[]
}

model Record {
  id         String   @id @default(cuid())
  appId      String
  app        App      @relation(fields: [appId], references: [id], onDelete: Cascade)
  data       String   // JSON form data
  isFavorite Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([appId])
}

model DataSource {
  id        String   @id @default(cuid())
  name      String
  type      String   // "google_sheets", "api", etc.
  config    String   // JSON config (encrypted)
  appId     String?
  app       App?     @relation(fields: [appId], references: [id], onDelete: Cascade)
  lastSync  DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Run migration
bunx prisma migrate dev --name init
```

### Step 3: PWA Manifest (`public/manifest.json`)

```json
{
  "name": "AppFlow - No-Code PWA Builder",
  "short_name": "AppFlow",
  "description": "Build powerful apps without code",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Create New App",
      "url": "/?action=new"
    }
  ]
}
```

### Step 4: Service Worker (`public/sw.js`)

The service worker implements Workbox-style caching strategies:

1. **Cache First** - For static assets (JS, CSS, fonts, images)
2. **Network First** - For API calls (with offline fallback)
3. **Stale While Revalidate** - For dynamic content

Key features:
- Pre-caches static assets on install
- Cleans up old caches on activate
- Handles push notifications
- Background sync for offline submissions
- Message handling for cache management

### Step 5: TypeScript Types (`src/types/app-builder.ts`)

Define comprehensive types for:
- Field types and configurations
- View configurations (table, cards, list, form)
- Data source connections
- Workflow automation
- App settings and schema

### Step 6: State Management (`src/lib/app-builder/store.ts`)

Using Zustand with persistence:
- Current app state
- Field management (add, update, remove, reorder)
- View management
- Data source configuration
- UI state (preview mode, sidebar tab)

### Step 7: App Builder Components

1. **AppBuilder.tsx** - Main builder with left sidebar (fields), center canvas, right panel (properties)
2. **FieldPalette.tsx** - Drag-and-drop field types organized by category
3. **FormCanvas.tsx** - Visual form builder with reordering
4. **PropertyPanel.tsx** - Field configuration editor
5. **TopBar.tsx** - Actions, preview, publish

### Step 8: App Runtime (`src/components/app-builder/AppRuntime.tsx`)

Published app viewer with:
- Form submission
- Table and card views
- Favorites system
- Pull-to-refresh
- Data freshness indicator
- Print optimization

### Step 9: API Routes

```
/api/apps                    # GET (list), POST (create)
/api/apps/[id]               # GET, PUT, DELETE
/api/apps/[id]/records       # GET, POST
/api/apps/[id]/records/[id]  # PUT, DELETE, POST (favorite)
/api/apps/[id]/publish       # POST (toggle)
/api/integrations/google-sheets/      # OAuth flow
/api/integrations/google-sheets/sync  # Push/Pull data
```

### Step 10: PWA Integration

1. **PWAProvider.tsx** - Wraps app with offline indicator and install prompt
2. **use-pwa.ts** - Hook for PWA status, install, and service worker updates
3. **OfflineIndicator.tsx** - Shows when offline
4. **InstallPrompt.tsx** - Prompts user to install (iOS & Android)

---

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# Google Sheets Integration
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/integrations/google-sheets/callback"
```

### Google Sheets Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable Google Sheets API and Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI
6. Copy Client ID and Secret to `.env`

---

## 📱 PWA Installation

### Desktop (Chrome/Edge)
1. Visit the app URL
2. Click the install icon in the address bar
3. Click "Install"

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" in the top right

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen"
4. Tap "Install"

---

## 🚀 Deployment

### Build for Production

```bash
bun run build
```

### Deploy to Vercel

```bash
vercel deploy --prod
```

### Deploy to GitHub Pages

1. Update `next.config.ts` for static export
2. Build and export: `bun run build`
3. Push `out/` directory to `gh-pages` branch

---

## 📋 Feature Checklist

### Core Features ✅
- [x] Dashboard with app management
- [x] Create, edit, delete, publish apps
- [x] Drag-and-drop form builder
- [x] 18+ field types
- [x] Form preview mode
- [x] Data table and card views
- [x] Favorites system
- [x] Search and filtering
- [x] Dark/Light mode

### PWA Features ✅
- [x] Service worker caching
- [x] Offline indicator
- [x] Install prompt
- [x] Pull-to-refresh
- [x] Background sync
- [x] Push notification ready

### Integrations ✅
- [x] Google Sheets OAuth
- [x] Push/Pull sync
- [x] Local database (SQLite)

### Security
- [x] Data ownership (user controls data)
- [x] Offline data encryption
- [x] Secure token storage

---

## 🎨 Customization

### Theming
Edit `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    colors: {
      primary: {...},
      // Add your custom colors
    }
  }
}
```

### Adding New Field Types
1. Add type to `src/types/app-builder.ts`
2. Add field to `FieldPalette.tsx`
3. Add input to `AppRuntime.tsx` FormFieldInput
4. Add validation to `PropertyPanel.tsx`

---

## 📄 License

MIT License - Feel free to use this for your own projects!

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

- GitHub Issues: [Report a bug](https://github.com/your-repo/appflow/issues)
- Documentation: [Wiki](https://github.com/your-repo/appflow/wiki)

---

Built with ❤️ using Next.js 15, Prisma, and shadcn/ui
