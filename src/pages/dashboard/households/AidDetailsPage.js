import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, CalendarDays, Coins, HandCoins, Users, Edit2 } from 'lucide-react';
import { aidsApi } from '../../../api/endpoints';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import PageHeader from '../../../components/ui/PageHeader';
import Table from '../../../components/ui/Table';

const COPY = {
  en: {
    title: 'Aid Details',
    subtitle: 'View the specifics of this distributed aid grouping and the beneficiary households.',
    emptyTitle: 'No records found',
    emptyDesc: 'Could not find the household records for this specific aid.',
    detailsSection: 'Group Specifications',
    beneficiariesSection: 'Beneficiary Households',
    editAction: 'Edit Aid Group',
    fields: {
      date: 'Date',
      category: 'Category',
      occurrence: 'Occurrence',
      description: 'Description',
      notes: 'Notes',
    },
    columns: {
      householdName: 'Household Name',
      notes: 'Additional Notes',
    },
  },
  ar: {
    title: 'تفاصيل المساعدة',
    subtitle: 'عرض تفاصيل هذا الصرف والأسر المستفيدة منه.',
    emptyTitle: 'لا توجد سجلات',
    emptyDesc: 'لم نتمكن من العثور على سجلات الأسر لهذه المساعدة المحددة.',
    detailsSection: 'مواصفات الصرف',
    beneficiariesSection: 'الأسر المستفيدة',
    editAction: 'تعديل الصرف',
    fields: {
      date: 'التاريخ',
      category: 'الفئة',
      occurrence: 'التكرار',
      description: 'الوصف',
      notes: 'ملاحظات',
    },
    columns: {
      householdName: 'اسم الأسرة',
      notes: 'ملاحظات إضافية',
    },
  },
};

export default function AidDetailsPage() {
  const { language, t } = useI18n();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [searchParams] = useSearchParams();
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const canEdit = hasPermission('HOUSEHOLD_CLASSIFICATIONS_MANAGE');

  const queryDate = searchParams.get('date');
  const queryCategory = searchParams.get('category');
  const queryOccurrence = searchParams.get('occurrence');
  const queryDescription = searchParams.get('description');

  const payloadParams = useMemo(() => ({
    date: queryDate,
    category: queryCategory,
    occurrence: queryOccurrence,
    description: queryDescription,
  }), [queryDate, queryCategory, queryOccurrence, queryDescription]);

  const { data, isLoading } = useQuery({
    queryKey: ['aid-details', payloadParams],
    queryFn: async () => {
      if (!queryDate || !queryCategory || !queryOccurrence || !queryDescription) return [];
      const resp = await aidsApi.getAidDetails(payloadParams);
      return resp.data?.data || [];
    },
    enabled: !!(queryDate && queryCategory && queryOccurrence && queryDescription),
  });

  const beneficiaries = data || [];

  const handleOpenEdit = () => {
    const params = new URLSearchParams({
      date: queryDate,
      category: queryCategory,
      occurrence: queryOccurrence,
      description: queryDescription,
    });
    navigate(`/dashboard/lords-brethren/aid?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('dashboardLayout.menu.theLordsBrethren'), href: '/dashboard/lords-brethren' },
          { label: t('dashboardLayout.menu.disbursedAidHistory', 'المساعدات المصروفة'), href: '/dashboard/lords-brethren/aid-history' },
          { label: copy.title },
        ]}
      />

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('dashboardLayout.menu.theLordsBrethren')}
        title={copy.title}
        subtitle={copy.subtitle}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Col: Aid Summary */}
        <div className="lg:col-span-1">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-heading">{copy.detailsSection}</p>
              </div>
              {canEdit && (
                <Button variant="ghost" size="sm" onClick={handleOpenEdit} className="h-8 group">
                  <Edit2 className="h-4 w-4 mr-1.5 text-muted group-hover:text-primary transition-colors" />
                  {copy.editAction}
                </Button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs text-muted font-medium">{copy.fields.date}</p>
                <div className="flex items-center gap-2 font-medium text-heading">
                  <CalendarDays className="h-4 w-4 text-muted" />
                  {queryDate ? new Date(queryDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted font-medium">{copy.fields.category}</p>
                <Badge variant="success">{queryCategory}</Badge>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted font-medium">{copy.fields.occurrence}</p>
                <div className="flex items-center gap-2 font-medium text-heading">
                  {queryOccurrence}
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted font-medium">{copy.fields.description}</p>
                <div className="flex items-center gap-2 font-medium text-heading">
                  {queryDescription}
                </div>
              </div>

              {beneficiaries?.[0]?.notes && (
                <div>
                  <p className="mb-1 text-xs text-muted font-medium">{copy.fields.notes}</p>
                  <p className="text-sm font-medium text-heading whitespace-pre-wrap">
                    {beneficiaries[0].notes}
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Col: Beneficiaries Table */}
        <div className="lg:col-span-2">
          <Card className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-heading">{copy.beneficiariesSection}</p>
                <Badge variant="secondary">{beneficiaries.length}</Badge>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : beneficiaries.length === 0 ? (
              <EmptyState
                icon={HandCoins}
                title={copy.emptyTitle}
                description={copy.emptyDesc}
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {beneficiaries.map((row) => (
                  <button
                    key={row.houseName}
                    onClick={() =>
                      navigate(
                        `/dashboard/users/family-house/details?lookupType=houseName&lookupName=${encodeURIComponent(
                          row.houseName
                        )}`
                      )
                    }
                    className="flex items-center gap-3 rounded-xl border border-border bg-surface shadow-sm p-3 text-start transition-colors hover:border-primary/30 hover:bg-surface-alt hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Users className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-heading">
                        {row.houseName}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
