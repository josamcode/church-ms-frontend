import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/endpoints';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Breadcrumbs from '../../components/ui/Breadcrumbs';
import Skeleton from '../../components/ui/Skeleton';
import { formatDate, GENDER_LABELS, ROLE_LABELS } from '../../utils/formatters';
import { UserCircle, Phone, Mail, MapPin, Calendar, Tag } from 'lucide-react';

export default function ProfilePage() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await authApi.me();
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'لوحة التحكم', href: '/dashboard' }, { label: 'الملف الشخصي' }]} />

      {/* Header Card */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {user?.avatar?.url ? (
            <img src={user.avatar.url} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
          )}
          <div className="text-center sm:text-right">
            <h1 className="text-xl font-bold text-heading">{user?.fullName}</h1>
            <div className="flex items-center gap-2 mt-1 justify-center sm:justify-start">
              <Badge variant="primary">{ROLE_LABELS[user?.role]}</Badge>
              {user?.ageGroup && <Badge>{user.ageGroup}</Badge>}
            </div>
          </div>
        </div>
      </Card>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="المعلومات الشخصية" />
          <div className="space-y-3 text-sm">
            <InfoRow icon={Calendar} label="تاريخ الميلاد" value={formatDate(user?.birthDate)} />
            <InfoRow icon={UserCircle} label="الجنس" value={GENDER_LABELS[user?.gender] || '---'} />
            <InfoRow icon={Phone} label="الهاتف الأساسي" value={user?.phonePrimary} dir="ltr" />
            {user?.phoneSecondary && (
              <InfoRow icon={Phone} label="الهاتف الثانوي" value={user.phoneSecondary} dir="ltr" />
            )}
            {user?.email && <InfoRow icon={Mail} label="البريد الإلكتروني" value={user.email} dir="ltr" />}
          </div>
        </Card>

        <Card>
          <CardHeader title="العنوان والوسوم" />
          <div className="space-y-3 text-sm">
            {user?.address && (
              <InfoRow
                icon={MapPin}
                label="العنوان"
                value={[user.address.governorate, user.address.city, user.address.street].filter(Boolean).join('، ') || '---'}
              />
            )}
            {user?.familyName && <InfoRow icon={UserCircle} label="اسم العائلة" value={user.familyName} />}
            {user?.tags?.length > 0 && (
              <div className="flex items-start gap-3">
                <Tag className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-muted block mb-1">الوسوم</span>
                  <div className="flex flex-wrap gap-1.5">
                    {user.tags.map((tag) => (
                      <Badge key={tag}>{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, dir }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
      <div>
        <span className="text-muted">{label}</span>
        <p className={`font-medium text-heading ${dir === 'ltr' ? 'direction-ltr text-left' : ''}`}>
          {value || '---'}
        </p>
      </div>
    </div>
  );
}
