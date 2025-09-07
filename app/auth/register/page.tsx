import RegisterForm from '@/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Join ALX Polly
          </h1>
          <p className="mt-2 text-muted-foreground">
            Create your account to start building amazing polls
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
