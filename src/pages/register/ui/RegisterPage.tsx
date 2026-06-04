import { RegisterForm } from '@/features/auth';
import { AuthLayout } from '@/widgets/AuthLayout';

export function RegisterPage() {
  return (
    <AuthLayout>
      <div className="flex flex-1 flex-col items-center px-4 pb-8 pt-28">
        <RegisterForm />
      </div>
    </AuthLayout>
  );
}

