import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, Users as UsersIcon } from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useI18n } from '../../../i18n/i18n';
import { getGenderLabel, getRoleLabel } from '../../../utils/formatters';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';

const EMPTY = '---';

export default function FamilyHouseLookupPage() {
  const { t, isRTL } = useI18n();
  const [lookupType, setLookupType] = useState('familyName');
  const [lookupName, setLookupName] = useState('');
  const [submittedLookupName, setSubmittedLookupName] = useState('');

  const isFamilyLookup = lookupType === 'familyName';
  const normalizedSubmittedName = normalizeText(submittedLookupName);

  const { data: lookupNamesResponse, isLoading: lookupNamesLoading } = useQuery({
    queryKey: ['users', isFamilyLookup ? 'family-names' : 'house-names'],
    queryFn: async () => {
      const { data } = isFamilyLookup
        ? await usersApi.getFamilyNames()
        : await usersApi.getHouseNames();
      return data?.data ?? [];
    },
    staleTime: 60000,
  });

  const {
    data: membersResponse,
    isLoading: membersLoading,
    isFetching: membersFetching,
    error: membersError,
  } = useQuery({
    queryKey: ['users', 'family-house-lookup', lookupType, normalizedSubmittedName],
    queryFn: async () => {
      const { data } = await usersApi.list({
        limit: 100,
        sort: 'fullName',
        order: 'asc',
        ...(isFamilyLookup
          ? { familyName: submittedLookupName }
          : { houseName: submittedLookupName }),
      });
      return data?.data ?? [];
    },
    enabled: Boolean(normalizedSubmittedName),
    staleTime: 30000,
  });

  const lookupNames = useMemo(
    () => (Array.isArray(lookupNamesResponse) ? lookupNamesResponse : []),
    [lookupNamesResponse]
  );

  const members = useMemo(() => {
    const rawMembers = Array.isArray(membersResponse) ? membersResponse : [];
    if (!normalizedSubmittedName) return [];

    const exactMatches = rawMembers.filter(
      (member) =>
        normalizeText(isFamilyLookup ? member.familyName : member.houseName) ===
        normalizedSubmittedName
    );

    return exactMatches.length > 0 ? exactMatches : rawMembers;
  }, [membersResponse, isFamilyLookup, normalizedSubmittedName]);

  const lockedMembersCount = useMemo(
    () => members.filter((member) => member.isLocked).length,
    [members]
  );

  const relatedOtherGroupNames = useMemo(() => {
    const relatedKey = isFamilyLookup ? 'houseName' : 'familyName';
    return [
      ...new Set(
        members
          .map((member) => String(member?.[relatedKey] || '').trim())
          .filter(Boolean)
      ),
    ];
  }, [isFamilyLookup, members]);

  const membersErrorMessage = membersError
    ? normalizeApiError(membersError).message
    : null;

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        label: t('familyHouseLookup.columns.name'),
        render: (row) => {
          const userId = row._id || row.id;
          return (
            <div className="flex items-center gap-3">
              {row.avatar?.url ? (
                <img
                  src={row.avatar.url}
                  alt=""
                  className="h-9 w-9 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {getInitial(row.fullName)}
                </div>
              )}
              <div>
                {userId ? (
                  <Link
                    to={`/dashboard/users/${userId}`}
                    className="font-semibold text-heading hover:text-primary"
                  >
                    {row.fullName || EMPTY}
                  </Link>
                ) : (
                  <span className="font-semibold text-heading">{row.fullName || EMPTY}</span>
                )}
                <p className="text-xs text-muted direction-ltr text-left">
                  {row.phonePrimary || EMPTY}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        key: 'phonePrimary',
        label: t('familyHouseLookup.columns.phone'),
        render: (row) => (
          <span className="direction-ltr text-left">
            {row.phonePrimary || EMPTY}
          </span>
        ),
      },
      {
        key: 'ageGroup',
        label: t('familyHouseLookup.columns.ageGroup'),
        render: (row) => row.ageGroup || EMPTY,
      },
    ],
    [t]
  );

  const handleSearch = () => {
    const trimmedName = lookupName.trim();
    if (!trimmedName) return;
    setSubmittedLookupName(trimmedName);
  };

  const handleClear = () => {
    setLookupName('');
    setSubmittedLookupName('');
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: t('familyHouseLookup.page') },
        ]}
      />

      <Card padding={false} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative p-6 lg:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-heading">{t('familyHouseLookup.title')}</h1>
              <p className="mt-1 text-sm text-muted">{t('familyHouseLookup.subtitle')}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[200px_minmax(0,1fr)_auto]">
          <Select
            label={t('familyHouseLookup.filters.searchType')}
            value={lookupType}
            onChange={(event) => {
              const nextType = event.target.value;
              setLookupType(nextType);
              setLookupName('');
              setSubmittedLookupName('');
            }}
            options={[
              {
                value: 'familyName',
                label: t('familyHouseLookup.filters.familyName'),
              },
              {
                value: 'houseName',
                label: t('familyHouseLookup.filters.houseName'),
              },
            ]}
            containerClassName="!mb-0"
          />

          <div>
            <Input
              label={t('familyHouseLookup.filters.lookupName')}
              value={lookupName}
              onChange={(event) => setLookupName(event.target.value)}
              placeholder={t(
                isFamilyLookup
                  ? 'familyHouseLookup.filters.familyNamePlaceholder'
                  : 'familyHouseLookup.filters.houseNamePlaceholder'
              )}
              list={isFamilyLookup ? 'family-name-options' : 'house-name-options'}
              icon={Search}
              containerClassName="!mb-0"
            />
            <datalist id={isFamilyLookup ? 'family-name-options' : 'house-name-options'}>
              {lookupNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            {lookupNamesLoading && (
              <p className="mt-1 text-xs text-muted">{t('familyHouseLookup.filters.loadingNames')}</p>
            )}
          </div>

          <div className={`flex items-end gap-2 ${isRTL ? 'lg:justify-start' : 'lg:justify-end'}`}>
            <Button onClick={handleSearch} disabled={!lookupName.trim()}>
              {t('familyHouseLookup.filters.search')}
            </Button>
            {(lookupName || submittedLookupName) && (
              <Button variant="ghost" onClick={handleClear}>
                {t('familyHouseLookup.filters.clear')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {!submittedLookupName ? (
        <Card>
          <EmptyState
            icon={Search}
            title={t('familyHouseLookup.empty.initialTitle')}
            description={t('familyHouseLookup.empty.initialDescription')}
          />
        </Card>
      ) : (
        <>
          <Card className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-heading">{t('familyHouseLookup.summary.title')}</h2>
              <Badge variant="secondary">
                {t(
                  isFamilyLookup
                    ? 'familyHouseLookup.filters.familyName'
                    : 'familyHouseLookup.filters.houseName'
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SummaryItem
                label={t('familyHouseLookup.summary.selectedName')}
                value={submittedLookupName}
              />
              <SummaryItem
                label={t('familyHouseLookup.summary.membersCount')}
                value={members.length}
              />
              <SummaryItem
                label={t('familyHouseLookup.summary.lockedCount')}
                value={lockedMembersCount}
              />
              <SummaryItem
                label={t('familyHouseLookup.summary.relatedOtherGroup', {
                  group: t(
                    isFamilyLookup
                      ? 'familyHouseLookup.filters.houseName'
                      : 'familyHouseLookup.filters.familyName'
                  ),
                })}
                value={relatedOtherGroupNames.length || 0}
              />
            </div>

            <div className="rounded-xl border border-border bg-surface-alt/50 p-3 text-sm">
              <span className="font-medium text-heading">
                {t('familyHouseLookup.summary.relatedNamesLabel')}
              </span>
              <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-muted`}>
                {relatedOtherGroupNames.length > 0
                  ? relatedOtherGroupNames.join(' - ')
                  : EMPTY}
              </span>
            </div>
          </Card>

          <Card padding={false} className="overflow-hidden">
            <div className="border-b border-border px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-heading">
                  {t('familyHouseLookup.table.title')}
                </h2>
                <span className="text-sm text-muted">
                  {t('familyHouseLookup.table.results', { count: members.length })}
                </span>
              </div>
            </div>

            {membersErrorMessage ? (
              <div className="p-5">
                <EmptyState
                  icon={UsersIcon}
                  title={t('familyHouseLookup.empty.errorTitle')}
                  description={membersErrorMessage}
                />
              </div>
            ) : (
              <div className="p-2 sm:p-3">
                <Table
                  columns={columns}
                  data={members}
                  loading={membersLoading || membersFetching}
                  emptyTitle={t('familyHouseLookup.empty.resultsTitle')}
                  emptyDescription={t('familyHouseLookup.empty.resultsDescription')}
                  emptyIcon={UsersIcon}
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface-alt/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-heading">{value || 0}</p>
    </div>
  );
}

function formatAddress(address) {
  if (!address || typeof address !== 'object') return EMPTY;

  const value = [address.governorate, address.city, address.street, address.details]
    .filter(Boolean)
    .join(', ')
    .trim();

  return value || EMPTY;
}

function countFamilyLinks(user) {
  if (!user) return 0;

  return (
    (user.father ? 1 : 0) +
    (user.mother ? 1 : 0) +
    (user.spouse ? 1 : 0) +
    (Array.isArray(user.siblings) ? user.siblings.length : 0) +
    (Array.isArray(user.children) ? user.children.length : 0) +
    (Array.isArray(user.familyMembers) ? user.familyMembers.length : 0)
  );
}

function getInitial(name) {
  if (!name) return 'U';
  return String(name).trim().charAt(0).toUpperCase();
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}
