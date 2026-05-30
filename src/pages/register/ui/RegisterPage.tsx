import { RegisterForm } from '@/features/auth';
import { AuthLayout } from '@/widgets/AuthLayout';

export function RegisterPage() {
  return (
    <AuthLayout>
      <RegisterForm />
    </AuthLayout>
  );
}
