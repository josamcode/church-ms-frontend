import { Users, UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import Card from '../../components/ui/Card';
import { ROLE_LABELS } from '../../utils/formatters';

const quickStats = [
  { label: 'إدارة المستخدمين', icon: Users, desc: 'عرض وإدارة بيانات الأعضاء', href: '/dashboard/users', perm: 'USERS_VIEW' },
  { label: 'الملف الشخصي', icon: UserCheck, desc: 'عرض وتعديل بياناتك', href: '/dashboard/profile', perm: 'AUTH_VIEW_SELF' },
];

export default function DashboardHome() {
  const { user, hasPermission } = useAuth();

  return (
    <div className="animate-fade-in">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-heading mb-1">
          مرحباً، {user?.fullName}
        </h1>
        <p className="text-muted">
          الدور: {ROLE_LABELS[user?.role] || user?.role}
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {quickStats.filter(s => hasPermission(s.perm)).map((stat) => (
          <a key={stat.href} href={stat.href}>
            <Card className="hover:shadow-dropdown transition-shadow cursor-pointer group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-heading">{stat.label}</h3>
                  <p className="text-sm text-muted mt-0.5">{stat.desc}</p>
                </div>
              </div>
            </Card>
          </a>
        ))}
      </div>

      {/* System Info */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-heading">معلومات النظام</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted">اسم المستخدم:</span>
            <span className="font-medium text-heading mr-2">{user?.fullName}</span>
          </div>
          <div>
            <span className="text-muted">الدور:</span>
            <span className="font-medium text-heading mr-2">{ROLE_LABELS[user?.role]}</span>
          </div>
          <div>
            <span className="text-muted">رقم الهاتف:</span>
            <span className="font-medium text-heading mr-2 direction-ltr">{user?.phonePrimary}</span>
          </div>
          <div>
            <span className="text-muted">حالة الحساب:</span>
            <span className={`font-medium mr-2 ${user?.isLocked ? 'text-danger' : 'text-success'}`}>
              {user?.isLocked ? 'مغلق' : 'نشط'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
