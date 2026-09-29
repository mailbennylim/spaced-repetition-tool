# Spaced Repetition Tool

A modern web application that helps you reinforce knowledge through spaced repetition of your reading highlights. Integrates with popular reading apps like Raindrop.io and Readwise Reader to automatically import your highlights and present them on an optimized review schedule.

## Features

### Core Functionality
- **Automatic Highlight Sync**: Pull highlights and notes from Raindrop.io and Readwise Reader
- **Daily Reviews**: Review 5 highlights (configurable) with their tagged notes at your preferred time
- **Spaced Repetition Algorithm**: Uses the SM-2 algorithm to optimize learning and retention
- **Configurable Notifications**: Get reminded when it's time to review your highlights
- **Test Mode**: Generate AI-powered questions to test your recall and understanding
- **Clean, Minimalist Design**: Inspired by Luma's elegant aesthetic

### Key Benefits
- Retain more from your reading without manual effort
- Smart scheduling adapts to your performance
- Multiple difficulty levels in test mode (easy, medium, hard)
- Track your progress across all sources
- Works with your existing reading workflow

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **AI**: OpenAI GPT-4 (for question generation)
- **APIs**: Raindrop.io, Readwise Reader

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- API keys for the services you want to use:
  - Raindrop.io access token (optional)
  - Readwise Reader API token (optional)
  - OpenAI API key (optional, for test mode)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/spaced-repetition-tool.git
   cd spaced-repetition-tool
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # Raindrop API (optional)
   RAINDROP_ACCESS_TOKEN="your-raindrop-token"

   # Readwise Reader API (optional)
   READWISE_ACCESS_TOKEN="your-readwise-token"

   # OpenAI API (optional, for question generation)
   OPENAI_API_KEY="your-openai-key"

   # App Configuration
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NOTIFICATION_TIME="09:00"
   DAILY_HIGHLIGHTS_COUNT=5
   ```

4. **Initialize the database**
   ```bash
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## API Configuration

### Raindrop.io

1. Go to [Raindrop.io App Settings](https://app.raindrop.io/settings/integrations)
2. Create a new app or use an existing one
3. Generate an access token
4. Add the token to your `.env` file as `RAINDROP_ACCESS_TOKEN`

### Readwise Reader

1. Visit [Readwise Access Token](https://readwise.io/access_token)
2. Copy your access token
3. Add it to your `.env` file as `READWISE_ACCESS_TOKEN`

### OpenAI (for Test Mode)

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add it to your `.env` file as `OPENAI_API_KEY`

## Usage

### Syncing Highlights

1. Click "Sync Highlights" on the home page
2. Choose to sync from Raindrop, Readwise, or both
3. Wait for the sync to complete
4. Your highlights will be imported and scheduled for review

### Daily Reviews

1. Click "Daily Review" to see highlights scheduled for today
2. Read each highlight and its note
3. Rate how well you recalled it (0-5 scale):
   - **5**: Perfect recall
   - **4**: Correct after hesitation
   - **3**: Correct with difficulty
   - **2**: Incorrect but familiar
   - **1**: Incorrect but remembered
   - **0**: Complete blackout
4. The system automatically schedules the next review based on your rating

### Test Mode

1. Click "Test Mode" to enter the quiz interface
2. AI-generated questions test your understanding
3. View answers and compare with the original highlight
4. Questions vary in difficulty (easy, medium, hard)

### Settings

1. Click "Settings" to configure:
   - Daily highlights count (how many to review per day)
   - Review time (when you want to be notified)
   - Timezone
   - Enable/disable notifications
2. Check API connection status
3. Save your preferences

## Spaced Repetition Algorithm

This tool uses the **SuperMemo 2 (SM-2)** algorithm, a proven method for optimizing review intervals:

- First review: 1 day
- Second review: 6 days
- Subsequent reviews: Previous interval × ease factor

The ease factor adjusts based on your performance:
- Good recalls (4-5): Increases ease factor, longer intervals
- Moderate recalls (3): Maintains current schedule
- Poor recalls (0-2): Resets the schedule, starts over

## Project Structure

```
spaced-repetition-tool/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── api/                # API routes
│   │   │   ├── highlights/     # Fetch all highlights
│   │   │   ├── review/         # Review scheduling
│   │   │   ├── settings/       # User settings
│   │   │   ├── sync/           # Sync with external APIs
│   │   │   └── test/           # Test mode questions
│   │   ├── highlights/         # Browse highlights page
│   │   ├── review/             # Daily review interface
│   │   ├── settings/           # Settings page
│   │   ├── sync/               # Sync page
│   │   ├── test/               # Test mode page
│   │   ├── globals.css         # Global styles
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   └── NotificationSetup.tsx
│   └── lib/                    # Utilities and services
│       ├── notifications.ts    # Web notifications
│       ├── prisma.ts           # Database client
│       ├── question-generator.ts # AI question generation
│       ├── raindrop.ts         # Raindrop API client
│       ├── readwise.ts         # Readwise API client
│       └── spaced-repetition.ts # SM-2 algorithm
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                     # Static assets
├── .env.example                # Environment variables template
├── package.json                # Dependencies
├── tailwind.config.js          # Tailwind configuration
└── tsconfig.json               # TypeScript configuration
```

## Database Schema

The application uses the following main models:

- **Source**: Reading apps (Raindrop, Readwise)
- **Highlight**: Individual highlights with metadata
- **ReviewSchedule**: Spaced repetition scheduling data
- **TestQuestion**: AI-generated questions for test mode
- **Settings**: User preferences and configuration

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Database commands
npx prisma db push        # Push schema changes
npx prisma studio         # Open database GUI
npx prisma generate       # Generate Prisma client
```

### Adding New Features

1. API routes go in `src/app/api/`
2. Pages go in `src/app/[page-name]/`
3. Reusable components in `src/components/`
4. Utilities and services in `src/lib/`
5. Database changes in `prisma/schema.prisma`

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Database in Production

For production, consider upgrading from SQLite to PostgreSQL:

1. Update `DATABASE_URL` in your environment
2. Change provider in `prisma/schema.prisma` to `postgresql`
3. Run `npx prisma db push`

## Troubleshooting

### Sync Issues

- **No highlights imported**: Check your API tokens are correct
- **Raindrop sync fails**: Verify your access token has proper permissions
- **Readwise sync fails**: Ensure token is from readwise.io/access_token

### Notification Issues

- **Notifications not appearing**: Check browser permissions
- **Wrong notification time**: Verify timezone setting in Settings page

### Test Mode Issues

- **Questions not generating**: Check OpenAI API key is valid
- **Poor question quality**: Questions improve with better highlight context

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Spaced repetition algorithm based on SuperMemo 2 by Piotr Wozniak
- Design inspired by [Luma](https://lu.ma)
- Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), and [Prisma](https://prisma.io)

## Support

For issues, questions, or suggestions, please open an issue on GitHub or contact the maintainer.

---

**Happy learning! 📚**
