import { Outlet, Link } from 'react-router-dom';
import { Church } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center">
              <Church className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-heading">كنيسة الملاك ميخائيل</h1>
              <p className="text-xs text-muted">قرية القطوشة - إيبارشية مطاى</p>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-xl border border-border shadow-card p-6 sm:p-8">
          <Outlet />
        </div>

        <p className="text-center text-xs text-muted mt-6">
          جميع الحقوق محفوظة — {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
