import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Card, { CardHeader } from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Skeleton from '../../../components/ui/Skeleton';
import Tabs from '../../../components/ui/Tabs';
import {
  Edit, Lock, Unlock, UserCircle, Phone, Mail, MapPin, Calendar,
  Tag, Users as UsersIcon, Shield,
} from 'lucide-react';
import { formatDate, GENDER_LABELS, ROLE_LABELS } from '../../../utils/formatters';
import toast from 'react-hot-toast';

export default function UserDetailsPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await usersApi.getById(id);
      return data.data;
    },
    staleTime: 60000,
  });

  const unlockMutation = useMutation({
    mutationFn: () => usersApi.unlock(id),
    onSuccess: () => {
      toast.success('تم فتح الحساب بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users', id] });
    },
    onError: (err) => toast.error(normalizeApiError(err).message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) return null;

  const familyMembers = [];
  if (user.father) familyMembers.push({ ...user.father, type: 'الأب' });
  if (user.mother) familyMembers.push({ ...user.mother, type: 'الأم' });
  if (user.spouse) familyMembers.push({ ...user.spouse, type: 'الزوج/ة' });
  if (user.siblings?.length) user.siblings.forEach((s) => familyMembers.push({ ...s, type: 'أخ/أخت' }));
  if (user.children?.length) user.children.forEach((c) => familyMembers.push({ ...c, type: 'ابن/بنت' }));
  if (user.familyMembers?.length) user.familyMembers.forEach((m) => familyMembers.push({ ...m, type: m.relationRole }));

  const tabs = [
    {
      label: 'المعلومات الشخصية',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="البيانات الأساسية" />
            <div className="space-y-3 text-sm">
              <InfoRow icon={Calendar} label="تاريخ الميلاد" value={formatDate(user.birthDate)} />
              <InfoRow icon={UserCircle} label="الجنس" value={GENDER_LABELS[user.gender]} />
              <InfoRow icon={UserCircle} label="الفئة العمرية" value={user.ageGroup} />
              <InfoRow icon={Phone} label="الهاتف الأساسي" value={user.phonePrimary} dir="ltr" />
              {user.phoneSecondary && <InfoRow icon={Phone} label="الهاتف الثانوي" value={user.phoneSecondary} dir="ltr" />}
              {user.whatsappNumber && <InfoRow icon={Phone} label="واتساب" value={user.whatsappNumber} dir="ltr" />}
              {user.email && <InfoRow icon={Mail} label="البريد الإلكتروني" value={user.email} dir="ltr" />}
              {user.nationalId && <InfoRow icon={Shield} label="الرقم القومي" value={user.nationalId} dir="ltr" />}
            </div>
          </Card>
          <Card>
            <CardHeader title="العنوان والمعلومات الإضافية" />
            <div className="space-y-3 text-sm">
              {user.address && (
                <InfoRow icon={MapPin} label="العنوان"
                  value={[user.address.governorate, user.address.city, user.address.street, user.address.details].filter(Boolean).join('، ')}
                />
              )}
              {user.familyName && <InfoRow icon={UsersIcon} label="اسم العائلة" value={user.familyName} />}
              {user.notes && <InfoRow icon={UserCircle} label="ملاحظات" value={user.notes} />}
              {user.tags?.length > 0 && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-muted block mb-1">الوسوم</span>
                    <div className="flex flex-wrap gap-1.5">
                      {user.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      ),
    },
    {
      label: 'العائلة',
      content: familyMembers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {familyMembers.map((m, i) => (
            <Card key={i}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-heading">{m.name || '---'}</p>
                  <p className="text-xs text-muted">{m.type || m.relationRole}</p>
                </div>
              </div>
              {m.userId && (
                <Link to={`/dashboard/users/${m.userId}`} className="text-xs text-primary hover:underline mt-2 block">
                  عرض الملف الشخصي
                </Link>
              )}
              {m.notes && <p className="text-xs text-muted mt-2">{m.notes}</p>}
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted py-8">لا توجد بيانات عائلة مسجلة</p>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: 'لوحة التحكم', href: '/dashboard' },
        { label: 'المستخدمون', href: '/dashboard/users' },
        { label: user.fullName },
      ]} />

      {/* Header */}
      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user.avatar?.url ? (
              <img src={user.avatar.url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserCircle className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-heading">{user.fullName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                <Badge variant={user.isLocked ? 'danger' : 'success'}>
                  {user.isLocked ? 'مغلق' : 'نشط'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {hasPermission('USERS_UPDATE') && (
              <Link to={`/dashboard/users/${id}/edit`}>
                <Button variant="outline" size="sm" icon={Edit}>تعديل</Button>
              </Link>
            )}
            {hasPermission('USERS_LOCK') && !user.isLocked && (
              <Link to={`/dashboard/users/${id}/lock`}>
                <Button variant="outline" size="sm" icon={Lock}>قفل</Button>
              </Link>
            )}
            {hasPermission('USERS_UNLOCK') && user.isLocked && (
              <Button variant="outline" size="sm" icon={Unlock}
                onClick={() => unlockMutation.mutate()} loading={unlockMutation.isPending}>
                فتح
              </Button>
            )}
          </div>
        </div>
        {user.isLocked && user.lockReason && (
          <div className="mt-4 bg-danger-light border border-danger/20 rounded-lg p-3 text-sm text-danger">
            <strong>سبب القفل:</strong> {user.lockReason}
          </div>
        )}
      </Card>

      <Tabs tabs={tabs} />
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
