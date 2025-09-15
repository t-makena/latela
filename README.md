# Latela - South African Budgeting App

A modern budgeting application built specifically for South African users, featuring ZAR currency support and intelligent transaction categorization.

## 🇿🇦 Features

- **ZAR Currency Support**: Native South African Rand formatting and calculations
- **AI Transaction Categorization**: Powered by Claude Haiku API
- **Real-time Sync**: Built with Supabase for reliable data management
- **Modern UI**: Responsive design built with Next.js
- **Secure Authentication**: User accounts and data protection

## 🛠️ Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Vercel serverless functions
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Claude Haiku API for transaction categorization
- **Currency**: South African Rand (ZAR)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Anthropic API key (for Claude Haiku)

### Installation

```bash
# Clone the repository
git clone https://github.com/t-makena/latela.git
cd latela

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Add your keys to .env.local:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# ANTHROPIC_API_KEY=your_anthropic_api_key

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Latela app.

## 📱 Usage

1. **Sign Up/Login**: Create your account or sign in
2. **Connect Accounts**: Link your South African bank accounts
3. **Track Transactions**: View and categorize your ZAR transactions
4. **Set Budgets**: Create budgets in South African Rand
5. **Monitor Spending**: Get insights into your spending patterns with Latela

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project for Latela
2. Run the database migrations (coming soon)
3. Configure authentication settings
4. Add your Supabase URL and keys to `.env.local`

### Claude API Setup

1. Get an API key from Anthropic
2. Add it to your environment variables
3. Latela will automatically categorize transactions using AI

## 🌍 South African Features

- ZAR currency formatting (R 1,234.56)
- Local banking integration support
- South African tax year considerations
- Local merchant recognition
- Latela-specific SA budgeting tools

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy Latela automatically on push to main

### Manual Deployment

```bash
# Build the Latela application
npm run build

# Deploy to your preferred platform
npm run start
```

## 🤝 Contributing to Latela

1. Fork the Latela repository
2. Create a feature branch (`git checkout -b feature/amazing-latela-feature`)
3. Commit your changes (`git commit -m 'Add amazing Latela feature'`)
4. Push to the branch (`git push origin feature/amazing-latela-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For Latela support, email tumis@example.com or create an issue in this repository.

## 🚧 Latela Roadmap

- [ ] South African bank account integration
- [ ] ZAR expense reporting
- [ ] Budget alerts in Rand
- [ ] Latela mobile app
- [ ] Multi-currency support (ZAR focus)
- [ ] Investment tracking for SA markets

---

Built with ❤️ in South Africa 🇿🇦 | **Latela** - Your ZAR Budgeting Companion