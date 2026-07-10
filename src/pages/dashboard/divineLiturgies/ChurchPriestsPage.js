import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Save, UserCircle2, Users, Phone, AlertTriangle, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import { divineLiturgiesApi, usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import MultiSelectChips from '../../../components/ui/MultiSelectChips';
import PageHeader from '../../../components/ui/PageHeader';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import { useI18n } from '../../../i18n/i18n';

const PRIEST_OPTIONS_LIMIT = 50;
const APPROVED_ACCOUNT_STATUS = 'approved';

function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debouncedValue;
}

function getUserId(user) {
  return user?._id || user?.id || null;
}

function userToOption(user) {
  const id = getUserId(user);
  if (!id) return null;
  return {
    value: String(id),
    label: user?.fullName || user?.phonePrimary || String(id),
  };
}

function dedupeOptions(options = []) {
  const seen = new Set();
  const result = [];

  options.forEach((option) => {
    if (!option?.value || seen.has(option.value)) return;
    seen.add(option.value);
    result.push(option);
  });

  return result;
}

function usePriestUserOptions({ search, selectedUsers, enabled }) {
  const debouncedSearch = useDebouncedValue(String(search || '').trim(), 300);

  const query = useInfiniteQuery({
    queryKey: [
      'divine-liturgies',
      'priest-user-options',
      debouncedSearch,
      APPROVED_ACCOUNT_STATUS,
      PRIEST_OPTIONS_LIMIT,
    ],
    enabled,
    initialPageParam: null,
    queryFn: async ({ pageParam }) => {
      const cursor = pageParam || null;
      const { data } = await usersApi.list({
        limit: PRIEST_OPTIONS_LIMIT,
        sort: 'createdAt',
        order: 'desc',
        accountStatus: APPROVED_ACCOUNT_STATUS,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(cursor ? { cursor } : {}),
      });

      return {
        cursor,
        rows: Array.isArray(data?.data) ? data.data : [],
        meta: data?.meta || {},
      };
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextCursor = lastPage?.meta?.nextCursor || null;
      if (!lastPage?.meta?.hasNextPage || !nextCursor) return undefined;
      if (nextCursor === lastPage?.cursor) return undefined;

      const requestedCursors = new Set(
        (allPages || [])
          .map((page) => page?.cursor)
          .filter(Boolean)
      );
      if (requestedCursors.has(nextCursor)) return undefined;

      return nextCursor;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const options = useMemo(() => {
    const selectedOptions = (selectedUsers || []).map(userToOption).filter(Boolean);
    const loadedOptions = (query.data?.pages || [])
      .flatMap((page) => page?.rows || [])
      .map(userToOption)
      .filter(Boolean);

    return dedupeOptions([...selectedOptions, ...loadedOptions]);
  }, [query.data?.pages, selectedUsers]);

  return { ...query, options, debouncedSearch };
}

function PriestCard({ entry, t }) {
  const user = entry?.user || {};
  const avatarUrl = user?.avatar?.url || '';
  const displayName = user?.fullName || user?.phonePrimary || t('common.placeholder.empty');

  return (
    <div className="group relative h-full">
      <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-primary/15 via-transparent to-secondary/15 opacity-0 blur-sm transition-opacity duration-700 group-hover:opacity-100" />

      <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-surface border border-primary/8 transition-all duration-700 group-hover:border-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/8">
        <div className="relative h-56 overflow-hidden bg-gradient-to-b from-primary/8 via-primary/4 to-surface">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center_top,var(--color-primary)_0%,transparent_70%)] opacity-10 transition-opacity duration-700 group-hover:opacity-20" />

          <div className="absolute inset-0 flex items-end justify-center pb-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                loading="lazy"
                className="h-full max-h-[220px] w-auto max-w-[85%] object-contain object-bottom transition-all duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="flex items-center justify-center pb-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl animate-pulse" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/10">
                    <UserCircle2 className="h-14 w-14 text-primary/30" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-surface to-transparent" />
        </div>

        <div className="relative px-6 pb-6 pt-2">
          <h3 className="text-lg sm:text-xl font-extrabold text-heading leading-tight">{displayName}</h3>
          {user?.phonePrimary ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm leading-relaxed text-muted">
              <Phone className="h-3.5 w-3.5 shrink-0 text-secondary" />
              <span className="direction-ltr">{user.phonePrimary}</span>
            </p>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-muted">{t('common.placeholder.empty')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PriestCardSkeleton() {
  return (
    <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-surface border border-primary/8">
      <div className="h-56 bg-gradient-to-b from-primary/8 via-primary/4 to-surface" />
      <div className="px-6 pb-6 pt-4 space-y-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export default function ChurchPriestsPage() {
  const { t, isRTL } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();

  const canManagePriests = hasPermission('DIVINE_LITURGIES_PRIESTS_MANAGE');
  const [selectedPriestIds, setSelectedPriestIds] = useState([]);
  const [priestsDirty, setPriestsDirty] = useState(false);
  const [priestSearch, setPriestSearch] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['divine-liturgies', 'overview'],
    queryFn: async () => {
      const { data } = await divineLiturgiesApi.getOverview();
      return data?.data || null;
    },
    staleTime: 30000,
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

  const selectedPriestUsers = useMemo(
    () => churchPriests.map((entry) => entry?.user).filter(Boolean),
    [churchPriests]
  );

  const priestOptionsQuery = usePriestUserOptions({
    search: priestSearch,
    selectedUsers: selectedPriestUsers,
    enabled: canManagePriests,
  });

  useEffect(() => {
    if (priestsDirty) return;
    setSelectedPriestIds(
      churchPriests
        .map((entry) => entry.user?.id)
        .filter(Boolean)
    );
  }, [churchPriests, priestsDirty]);

  const handlePriestSearchChange = useCallback((value) => {
    setPriestSearch(value);
  }, []);

  const handleLoadMorePriestOptions = useCallback(() => {
    if (!priestOptionsQuery.hasNextPage || priestOptionsQuery.isFetchingNextPage) return;
    priestOptionsQuery.fetchNextPage();
  }, [priestOptionsQuery]);

  const userOptions = useMemo(
    () => priestOptionsQuery.options,
    [priestOptionsQuery.options]
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

      <PageHeader
        className="border-b border-border pb-6"
        eyebrow={t('divineLiturgies.page')}
        title={t('dashboardLayout.menu.churchPriests')}
        subtitle={canManagePriests ? t('divineLiturgies.hints.priestsManage') : undefined}
      />

      <section className="space-y-6">
        {canManagePriests && (
          <Card padding="lg" className="space-y-4">
            <CardHeader
              icon={Users}
              title={`${t('divineLiturgies.fields.priests')} (${churchPriests.length})`}
            />
            <div className='flex gap-2' >
              <MultiSelectChips
                // label={t('divineLiturgies.fields.priests')}
                options={userOptions}
                values={selectedPriestIds}
                onChange={(values) => {
                  setPriestsDirty(true);
                  setSelectedPriestIds(values);
                }}
                onSearchChange={handlePriestSearchChange}
                loading={priestOptionsQuery.isFetching && !priestOptionsQuery.isFetchingNextPage}
                hasMore={Boolean(priestOptionsQuery.hasNextPage)}
                onLoadMore={handleLoadMorePriestOptions}
                isLoadingMore={priestOptionsQuery.isFetchingNextPage}
                placeholder={t('common.search.placeholder')}
                containerClassName="!mb-0 w-full"
              />
              <Button
                type="button"
                icon={Save}
                loading={priestsMutation.isPending}
                onClick={() => priestsMutation.mutate(selectedPriestIds)}
                className='min-w-44'
              >
                {t('divineLiturgies.actions.savePriests')}
              </Button>
            </div>
          </Card>
        )}

        {overviewQuery.isError ? (
          <Card tone="muted" padding="lg">
            <EmptyState
              icon={AlertTriangle}
              title={t('divineLiturgies.hints.noPriests')}
              description={normalizeApiError(overviewQuery.error).message}
              action={(
                <Button variant="outline" icon={RotateCcw} onClick={() => overviewQuery.refetch()}>
                  {t('common.actions.loadMore')}
                </Button>
              )}
            />
          </Card>
        ) : overviewQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <PriestCardSkeleton key={index} />
            ))}
          </div>
        ) : !churchPriests.length ? (
          <Card padding="none">
            <EmptyState
              icon={Users}
              title={t('divineLiturgies.hints.noPriests')}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {churchPriests.map((entry) => (
              <PriestCard key={entry.id} entry={entry} t={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
