import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { divineLiturgiesApi, usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import MultiSelectChips from '../../../components/ui/MultiSelectChips';
import { useI18n } from '../../../i18n/i18n';

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{children}</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

export default function ChurchPriestsPage() {
  const { t } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canManagePriests = hasPermission('DIVINE_LITURGIES_PRIESTS_MANAGE');
  const [selectedPriestIds, setSelectedPriestIds] = useState([]);
  const [priestsDirty, setPriestsDirty] = useState(false);

  const overviewQuery = useQuery({
    queryKey: ['divine-liturgies', 'overview'],
    queryFn: async () => {
      const { data } = await divineLiturgiesApi.getOverview();
      return data?.data || null;
    },
    staleTime: 30000,
  });

  const usersQuery = useQuery({
    queryKey: ['divine-liturgies', 'users'],
    enabled: canManagePriests,
    queryFn: async () => {
      const allUsers = [];
      const seen = new Set();
      let cursor = null;

      for (let index = 0; index < 30; index += 1) {
        const { data } = await usersApi.list({
          limit: 100,
          sort: 'createdAt',
          order: 'desc',
          ...(cursor && { cursor }),
        });

        const rows = Array.isArray(data?.data) ? data.data : [];
        rows.forEach((row) => {
          const id = row?._id || row?.id;
          if (!id || seen.has(id)) return;
          seen.add(id);
          allUsers.push(row);
        });

        const nextCursor = data?.meta?.nextCursor || null;
        if (!nextCursor || rows.length < 100) break;
        cursor = nextCursor;
      }

      return allUsers.sort((a, b) =>
        String(a?.fullName || '').localeCompare(String(b?.fullName || ''))
      );
    },
    staleTime: 60000,
  });

  const priestsMutation = useMutation({
    mutationFn: (priestIds) => divineLiturgiesApi.setChurchPriests(priestIds),
    onSuccess: () => {
      toast.success(t('divineLiturgies.messages.priestsUpdated'));
      setPriestsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['divine-liturgies', 'overview'] });
    },
    onError: (error) => toast.error(normalizeApiError(error).message),
  });

  const churchPriests = useMemo(
    () => (Array.isArray(overviewQuery.data?.churchPriests) ? overviewQuery.data.churchPriests : []),
    [overviewQuery.data]
  );

  useEffect(() => {
    if (priestsDirty) return;
    setSelectedPriestIds(
      churchPriests
        .map((entry) => entry.user?.id)
        .filter(Boolean)
    );
  }, [churchPriests, priestsDirty]);

  const userOptions = useMemo(
    () =>
      (Array.isArray(usersQuery.data) ? usersQuery.data : []).map((user) => ({
        value: user._id || user.id,
        label: user.fullName || user.phonePrimary || user._id || user.id,
      })),
    [usersQuery.data]
  );

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('divineLiturgies.page'), href: '/dashboard/divine-liturgies' },
          { label: t('dashboardLayout.menu.churchPriests') },
        ]}
      />

      <div className="border-b border-border pb-6">
        <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-heading">
          {t('dashboardLayout.menu.churchPriests')}
        </h1>
      </div>

      <section className="space-y-4">
        <SectionLabel>{t('divineLiturgies.sections.priests')}</SectionLabel>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
          {/* <div className="text-sm text-muted">
            {canManagePriests
              ? t('divineLiturgies.hints.priestsManage')
              : t('divineLiturgies.hints.priestsReadOnly')}
          </div> */}

          {canManagePriests && (
            <>
              <MultiSelectChips
                label={t('divineLiturgies.fields.priests')}
                options={userOptions}
                values={selectedPriestIds}
                onChange={(values) => {
                  setPriestsDirty(true);
                  setSelectedPriestIds(values);
                }}
                placeholder={t('common.search.placeholder')}
                containerClassName="!mb-0"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  icon={Save}
                  loading={priestsMutation.isPending}
                  onClick={() => priestsMutation.mutate(selectedPriestIds)}
                >
                  {t('divineLiturgies.actions.savePriests')}
                </Button>
              </div>
            </>
          )}

          {!churchPriests.length ? (
            <p className="text-sm text-muted">{t('divineLiturgies.hints.noPriests')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {churchPriests.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-border bg-surface-alt/40 px-3 py-2"
                >
                  <p className="text-sm font-medium text-heading">
                    {entry.user?.fullName || t('common.placeholder.empty')}
                  </p>
                  {entry.user?.phonePrimary && (
                    <p className="text-xs text-muted direction-ltr">{entry.user.phonePrimary}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
