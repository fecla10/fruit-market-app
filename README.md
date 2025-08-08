# 🍎 Fruit Market Tracker

A comprehensive full-stack fruit market tracking application built with Next.js 15, featuring real-time price monitoring, portfolio tracking, and advanced analytics for fruit commodities trading.

## ✨ Features

- **Real-time Price Tracking**: Live fruit commodity prices with WebSocket integration
- **Interactive Charts**: TradingView Lightweight Charts with technical analysis
- **Portfolio Management**: Track hypothetical fruit investments and P&L
- **Smart Alerts**: Price, volume, and percentage change notifications
- **Watchlist**: Personalized fruit tracking with real-time updates
- **Analytics Dashboard**: Market insights and performance metrics
- **Search & Filtering**: Advanced fruit discovery and filtering system
- **User Authentication**: NextAuth.js v5 with Google and GitHub OAuth
- **Real-time Notifications**: Browser notifications and in-app alerts

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - App Router with React Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern React component library
- **TradingView Charts** - Professional financial charting
- **Framer Motion** - Smooth animations
- **TanStack Query v5** - Server state management
- **Zustand** - Global state management

### Backend
- **Prisma ORM** - Type-safe database operations
- **PostgreSQL** - Primary database with time-series optimization
- **NextAuth.js v5** - Authentication with database sessions
- **Socket.io** - Real-time WebSocket communication
- **Vercel KV** - Redis caching layer
- **Vercel Blob** - File storage

### Infrastructure
- **Vercel** - Deployment platform with edge functions
- **Vercel MCP** - Model Context Protocol integration
- **Cron Jobs** - Automated price updates and data cleanup
- **PWA Support** - Progressive Web App capabilities

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (optional, for caching)

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd fruit-market-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your database and authentication credentials:

```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Vercel KV (optional)
KV_REST_API_URL="your-kv-rest-api-url"
KV_REST_API_TOKEN="your-kv-token"
```

4. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

5. **Development Server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── fruits/        # Fruit data APIs
│   │   ├── prices/        # Price data APIs
│   │   ├── watchlist/     # User watchlist APIs
│   │   ├── alerts/        # Alert management APIs
│   │   ├── portfolio/     # Portfolio tracking APIs
│   │   ├── socket/        # WebSocket server
│   │   └── cron/          # Scheduled jobs
│   ├── dashboard/         # Protected dashboard pages
│   ├── auth/             # Authentication pages
│   └── globals.css       # Global styles
├── components/            # React components
│   ├── charts/           # Chart components
│   ├── dashboard/        # Dashboard components
│   ├── layout/           # Layout components
│   ├── search/           # Search components
│   ├── user/             # User feature components
│   ├── notifications/    # Notification components
│   └── ui/               # Shadcn/ui components
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth configuration
│   ├── db.ts            # Database connection
│   ├── websocket.ts     # WebSocket service
│   ├── kv.ts            # Redis caching
│   ├── mcp.ts           # Vercel MCP integration
│   └── utils/           # Utility functions
├── hooks/                # Custom React hooks
├── types/               # TypeScript definitions
└── data/               # Static data and generators
```

## 🔧 Key Features

### Real-time Price Updates
- WebSocket connection for live price feeds
- Automatic reconnection and connection health monitoring
- Optimized bulk updates for multiple fruits

### Portfolio Tracking
- Hypothetical fruit trading with P&L calculations
- Transaction history and performance analytics
- Allocation charts and portfolio metrics

### Smart Alerts System
- Price threshold alerts (above/below)
- Percentage change notifications
- Volume spike detection
- Real-time browser notifications

### Advanced Charts
- Multiple timeframes (1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w)
- Candlestick, line, and area chart modes
- Volume indicators and technical analysis tools
- Responsive design for all screen sizes

## 🚀 Deployment

### Vercel Deployment

1. **Connect to Vercel**
```bash
npm install -g vercel
vercel login
```

2. **Deploy**
```bash
vercel --prod
```

3. **Environment Variables**
Configure all environment variables in the Vercel dashboard under Settings > Environment Variables.

4. **Database Setup**
Set up PostgreSQL on your preferred cloud provider and update the `DATABASE_URL`.

5. **Cron Jobs**
The application includes automated cron jobs for:
- Price updates (every 5 minutes)
- Alert processing (every minute)
- Data cleanup (daily at 2 AM)

### Manual Deployment
The project can also be deployed to any Node.js hosting platform that supports:
- Next.js 15
- PostgreSQL database
- Redis (optional, for caching)
- WebSocket support

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check

# Run linting
npm run lint
```

## 📊 Performance

The application is optimized for performance with:
- Server-side rendering and static generation
- Optimistic updates with TanStack Query
- Redis caching for frequently accessed data
- Image optimization and lazy loading
- Code splitting and tree shaking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TradingView](https://www.tradingview.com/) for the excellent charting library
- [Vercel](https://vercel.com/) for the incredible deployment platform
- [Shadcn](https://ui.shadcn.com/) for the beautiful component library
