import { ResetPasswordForm } from '@/features/auth';
import { AuthLayout } from '@/widgets/AuthLayout';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1280&q=80';

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-end overflow-hidden bg-[#406623] p-12 lg:flex">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${HERO_IMAGE}")` }}
      />
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            'linear-gradient(180deg, rgba(64, 102, 35, 0.4) 0%, rgba(27, 28, 23, 0.8) 100%)',
        }}
      />
      <div className="relative z-[2] flex max-w-[512px] flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h2 className="font-display text-[48px] font-bold leading-[1.14] tracking-[-1px] text-white">
            Đặt lại mật khẩu
          </h2>
          <p className="font-jakarta text-lg leading-7 text-white/80">
            Tạo mật khẩu mới mạnh và an toàn để bảo vệ tài khoản của bạn.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function ResetPasswordPage() {
  return (
    <AuthLayout>
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <BrandPanel />
        <div className="flex items-center justify-center px-6 pb-8 pt-24 lg:px-12">
          <ResetPasswordForm />
        </div>
      </div>
    </AuthLayout>
  );
}
