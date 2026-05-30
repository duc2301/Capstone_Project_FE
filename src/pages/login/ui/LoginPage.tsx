import { LoginForm } from '@/features/auth';
import { AuthLayout } from '@/widgets/AuthLayout';

export function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
