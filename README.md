# ALX Polly - Polling App with QR Code Sharing

A modern, full-stack polling application built with Next.js and Supabase that allows users to create polls, vote on them, and share them via unique links and QR codes.

## 🚀 Features

- **User Authentication**: Secure sign-up and sign-in with email verification
- **Poll Creation**: Create polls with custom titles, questions, and multiple options (2-10)
- **Voting System**: Cast votes with duplicate prevention and real-time updates
- **Results Visualization**: Detailed results with progress bars, percentages, and winner highlighting
- **Sharing Options**: Share polls via direct links or QR codes for easy mobile access
- **Real-time Updates**: Live vote count updates using Supabase subscriptions
- **Responsive Design**: Modern UI that works on all devices
- **Poll Management**: Edit, delete, and manage your polls from a centralized dashboard

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Styling**: Tailwind CSS with custom design system
- **Deployment**: Vercel-ready configuration

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 18+ and npm/yarn/pnpm
- A Supabase account (free tier available)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd alx-polly
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Supabase Configuration

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Set up Database Schema**:
   - Run the SQL commands from `database_schema.sql` in your Supabase SQL editor
   - This creates the necessary tables: `polls`, `poll_options`, and `votes`

3. **Configure Environment Variables**:
   - Copy `env.example` to `.env.local`
   - Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📖 Usage Examples

### Creating a Poll

1. **Sign up** for a new account or **sign in** to your existing account
2. Navigate to **"My Polls"** from the main menu
3. Click **"Create Poll"** button
4. Fill in the poll details:
   - **Title**: A catchy title for your poll
   - **Question**: The question you want to ask
   - **Options**: Add 2-10 answer options (minimum 2 required)
5. Click **"Create Poll"** to save and redirect to your new poll

### Voting on a Poll

1. **Access a poll** via direct link or QR code
2. **Sign in** if you haven't already (required for voting)
3. **Select your preferred option** using the radio buttons
4. Click **"Submit Vote"** to cast your vote
5. View **real-time results** with vote counts and percentages

### Sharing a Poll

1. From any poll page, click **"Share"** or **"QR Code"**
2. **Copy the link** to share via text, email, or social media
3. **Download the QR code** for offline sharing or print materials
4. Use **native sharing** on mobile devices for seamless distribution

### Managing Polls

1. Go to **"My Polls"** to see all your created polls
2. **View statistics**: See vote counts and option counts for each poll
3. **Take actions**:
   - **Vote**: Cast your own vote on the poll
   - **Results**: View detailed analytics and charts
   - **Share**: Generate sharing links and QR codes
   - **Edit**: Modify poll details (if needed)
   - **Delete**: Remove polls you no longer need

## 🧪 Testing the Application

### Local Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the complete user flow**:
   - Create a new account
   - Create a poll with multiple options
   - Share the poll link with others
   - Vote on the poll from different accounts
   - View real-time results updates

3. **Test sharing functionality**:
   - Generate QR codes and test scanning
   - Test link copying and sharing
   - Verify mobile responsiveness

### Database Testing

1. **Check Supabase Dashboard**:
   - Verify tables are created correctly
   - Monitor real-time subscriptions
   - Check Row Level Security (RLS) policies

2. **Test Authentication**:
   - Sign up with email verification
   - Sign in/out functionality
   - Session persistence across browser tabs

## 🏗️ Project Structure

```
alx-polly/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── polls/             # Poll-related pages
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── ui/                # shadcn/ui components
│   ├── LoginForm.tsx      # Login form component
│   └── RegisterForm.tsx   # Registration form component
├── context/               # React context providers
│   └── AuthContext.tsx    # Authentication context
├── lib/                   # Utility functions and configurations
│   ├── supabaseClient.ts  # Supabase client setup
│   └── utils.ts           # General utilities
└── public/                # Static assets
```

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Authentication Required**: Voting requires user authentication
- **Duplicate Vote Prevention**: Users can only vote once per poll
- **Input Validation**: Client and server-side validation
- **Environment Variables**: Secure credential management

## 🚀 Deployment

### Deploy to Vercel

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy** - Vercel will automatically build and deploy your app

### Deploy to Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Supabase Connection Issues**:
   - Verify your environment variables are correct
   - Check that your Supabase project is active
   - Ensure RLS policies are properly configured

2. **Authentication Problems**:
   - Check email verification settings in Supabase
   - Verify redirect URLs are configured correctly
   - Clear browser cache and cookies

3. **Real-time Updates Not Working**:
   - Verify Supabase subscriptions are enabled
   - Check browser console for WebSocket connection errors
   - Ensure RLS policies allow subscription access

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Review [Next.js Documentation](https://nextjs.org/docs)
- Open an issue in this repository for bugs or feature requests

## 🎯 Future Enhancements

- [ ] Poll categories and tags
- [ ] Advanced analytics and reporting
- [ ] Poll templates and quick creation
- [ ] Export results to CSV/PDF
- [ ] Multi-language support
- [ ] Mobile app development
- [ ] Integration with social media platforms
- [ ] Poll scheduling and time limits
- [ ] Anonymous voting options
- [ ] Poll collaboration features
