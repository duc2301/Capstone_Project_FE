import { VerifyOtpForm } from '@/features/auth';
import { AuthLayout } from '@/widgets/AuthLayout';

export function VerifyOtpPage() {
  return (
    <AuthLayout>
      <div className="flex flex-1 flex-col items-center px-4 pb-8 pt-28">
        <VerifyOtpForm />
      </div>
    </AuthLayout>
  );
}
