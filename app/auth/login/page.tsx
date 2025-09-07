import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back to ALX Polly
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to continue creating and participating in polls
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
