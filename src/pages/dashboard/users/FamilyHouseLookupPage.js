import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Building2, Search, Users as UsersIcon } from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useI18n } from '../../../i18n/i18n';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Select from '../../../components/ui/Select';
import Table from '../../../components/ui/Table';
import { getGenderLabel } from '../../../utils/formatters';
import {
  EMPTY,
  FAMILY_HOUSE_ANALYTICS_PATH,
  FAMILY_HOUSE_DETAILS_PATH,
  QUICK_USERS_LIMIT,
  RANK_LIMIT,
  buildCountList,
  buildLookupQuery,
  buildNamedCountList,
  fetchUsersWithPagination,
  normalizeText,
} from './familyHouseLookup.shared';

export default function FamilyHouseLookupPage() {
  const { t, isRTL } = useI18n();
  const [searchParams] = useSearchParams();
  const [lookupType, setLookupType] = useState('familyName');
  const [lookupName, setLookupName] = useState('');
  const [submittedLookupName, setSubmittedLookupName] = useState('');
  const [lookupDropdownOpen, setLookupDropdownOpen] = useState(false);
  const lookupInputRef = useRef(null);

  const isFamilyLookup = lookupType === 'familyName';
  const relatedLookupType = isFamilyLookup ? 'houseName' : 'familyName';
  const normalizedLookupName = normalizeText(lookupName);
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
    queryKey: ['users', 'family-house-details', lookupType, normalizedSubmittedName],
    queryFn: async () =>
      fetchUsersWithPagination(
        isFamilyLookup
          ? { familyName: submittedLookupName }
          : { houseName: submittedLookupName }
      ),
    enabled: Boolean(normalizedSubmittedName),
    staleTime: 30000,
  });

  const {
    data: directoryUsersResponse,
    error: directoryUsersError,
  } = useQuery({
    queryKey: ['users', 'family-house-lookup-directory'],
    queryFn: async () => fetchUsersWithPagination(),
    staleTime: 60000,
  });

  const lookupNames = useMemo(
    () => (Array.isArray(lookupNamesResponse) ? lookupNamesResponse : []),
    [lookupNamesResponse]
  );

  const filteredLookupNames = useMemo(() => {
    if (!normalizedLookupName) return lookupNames.slice(0, 20);
    return lookupNames
      .filter((name) => normalizeText(name).includes(normalizedLookupName))
      .slice(0, 20);
  }, [lookupNames, normalizedLookupName]);

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

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        String(a?.fullName || '').localeCompare(String(b?.fullName || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [members]
  );

  const quickUsers = useMemo(() => sortedMembers.slice(0, QUICK_USERS_LIMIT), [sortedMembers]);

  const directoryUsers = useMemo(
    () => (Array.isArray(directoryUsersResponse) ? directoryUsersResponse : []),
    [directoryUsersResponse]
  );

  const selectedLockedMembers = useMemo(
    () => members.filter((member) => member.isLocked).length,
    [members]
  );

  const selectedRelatedRanks = useMemo(
    () => buildNamedCountList(members, isFamilyLookup ? 'houseName' : 'familyName'),
    [isFamilyLookup, members]
  );

  const selectedAgeBreakdown = useMemo(
    () =>
      buildCountList(
        members.map(
          (member) =>
            String(member?.ageGroup || '').trim() ||
            t('familyHouseLookup.analytics.unknownAgeGroup')
        )
      ),
    [members, t]
  );

  const selectedGenderBreakdown = useMemo(
    () =>
      buildCountList(
        members.map((member) =>
          member?.gender
            ? getGenderLabel(member.gender)
            : t('familyHouseLookup.analytics.unknownGender')
        )
      ),
    [members, t]
  );

  const selectedCoveragePct = useMemo(() => {
    if (!directoryUsers.length) return 0;
    return (members.length / directoryUsers.length) * 100;
  }, [directoryUsers.length, members.length]);

  useEffect(() => {
    const urlLookupType = searchParams.get('lookupType');
    const urlLookupName = String(searchParams.get('lookupName') || '').trim();

    if (urlLookupType === 'houseName' || urlLookupType === 'familyName') {
      setLookupType(urlLookupType);
    }

    if (urlLookupName) {
      setLookupName(urlLookupName);
      setSubmittedLookupName(urlLookupName);
      setLookupDropdownOpen(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSubmittedLookupName(lookupName.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [lookupName]);

  const membersErrorMessage = membersError
    ? normalizeApiError(membersError).message
    : null;

  const directoryErrorMessage = directoryUsersError
    ? normalizeApiError(directoryUsersError).message
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
        key: 'ageGroup',
        label: t('familyHouseLookup.columns.ageGroup'),
        render: (row) => row.ageGroup || EMPTY,
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
        key: 'familyName',
        label: t('familyHouseLookup.columns.familyName'),
        render: (row) => (
          <LookupNameLink
            lookupType="familyName"
            name={row.familyName}
            emptyValue={EMPTY}
          />
        ),
      },
      {
        key: 'houseName',
        label: t('familyHouseLookup.columns.houseName'),
        render: (row) => (
          <LookupNameLink
            lookupType="houseName"
            name={row.houseName}
            emptyValue={EMPTY}
          />
        ),
      },
    ],
    [t]
  );

  const handleClear = () => {
    setLookupName('');
    setSubmittedLookupName('');
    setLookupDropdownOpen(false);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: t('familyHouseLookup.detailsPage.page') },
        ]}
      />

      <Card padding={false} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative p-6 lg:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-heading">
                  {t('familyHouseLookup.detailsPage.title')}
                </h1>
                <p className="mt-1 text-sm text-muted">
                  {t('familyHouseLookup.detailsPage.subtitle')}
                </p>
              </div>
            </div>
            <Link to={FAMILY_HOUSE_ANALYTICS_PATH}>
              <Button variant="outline" icon={ArrowLeft}>
                {t('familyHouseLookup.detailsPage.backToAnalytics')}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[200px_minmax(0,1fr)_auto]">
          <Select
            label={t('familyHouseLookup.filters.searchType')}
            value={lookupType}
            onChange={(event) => {
              setLookupType(event.target.value);
              setLookupName('');
              setSubmittedLookupName('');
              setLookupDropdownOpen(false);
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

          <div className="relative">
            <label className="block text-sm font-medium text-base mb-1.5">
              {t('familyHouseLookup.filters.lookupName')}
            </label>
            <div className="relative">
              <Search
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none ${
                  isRTL ? 'right-3' : 'left-3'
                }`}
              />
              <input
                ref={lookupInputRef}
                type="text"
                value={lookupName}
                onChange={(event) => {
                  setLookupName(event.target.value);
                  setLookupDropdownOpen(true);
                }}
                onFocus={() => setLookupDropdownOpen(true)}
                onBlur={() => setTimeout(() => setLookupDropdownOpen(false), 150)}
                placeholder={t(
                  isFamilyLookup
                    ? 'familyHouseLookup.filters.familyNamePlaceholder'
                    : 'familyHouseLookup.filters.houseNamePlaceholder'
                )}
                className={`input-base w-full ${isRTL ? 'pr-10' : 'pl-10'}`}
              />
            </div>
            {lookupDropdownOpen && (
              <ul
                className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-border shadow-lg py-1"
                style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
                role="listbox"
              >
                {lookupNamesLoading ? (
                  <li className="px-3 py-2 text-sm text-muted">
                    {t('familyHouseLookup.filters.loadingNames')}
                  </li>
                ) : filteredLookupNames.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted">{t('common.search.noResults')}</li>
                ) : (
                  filteredLookupNames.map((name) => (
                    <li
                      key={name}
                      role="option"
                      aria-selected={lookupName === name}
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-muted focus:bg-muted"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setLookupName(name);
                        setSubmittedLookupName(name.trim());
                        setLookupDropdownOpen(false);
                      }}
                    >
                      {name}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <div className={`flex items-end gap-2 ${isRTL ? 'lg:justify-start' : 'lg:justify-end'}`}>
            {(lookupName || submittedLookupName) && (
              <Button variant="ghost" onClick={handleClear}>
                {t('familyHouseLookup.filters.clear')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {directoryErrorMessage ? (
        <Card>
          <EmptyState
            icon={UsersIcon}
            title={t('familyHouseLookup.empty.errorTitle')}
            description={directoryErrorMessage}
          />
        </Card>
      ) : null}

      <Card className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-heading">
            {t('familyHouseLookup.analytics.selectedTitle')}
          </h2>
          <Badge variant={isFamilyLookup ? 'primary' : 'secondary'}>
            {t(
              isFamilyLookup
                ? 'familyHouseLookup.filters.familyName'
                : 'familyHouseLookup.filters.houseName'
            )}
          </Badge>
        </div>

        {!normalizedSubmittedName ? (
          <EmptyState
            icon={Search}
            title={t('familyHouseLookup.detailsPage.noSelectionTitle')}
            description={t('familyHouseLookup.detailsPage.noSelectionDescription')}
          />
        ) : membersErrorMessage ? (
          <EmptyState
            icon={UsersIcon}
            title={t('familyHouseLookup.empty.errorTitle')}
            description={membersErrorMessage}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
              <SummaryItem
                label={t('familyHouseLookup.summary.selectedName')}
                value={submittedLookupName || EMPTY}
              />
              <SummaryItem
                label={t('familyHouseLookup.summary.membersCount')}
                value={members.length}
              />
              <SummaryItem
                label={t('familyHouseLookup.summary.lockedCount')}
                value={selectedLockedMembers}
              />
              <SummaryItem
                label={t('familyHouseLookup.summary.relatedOtherGroup', {
                  group: t(
                    isFamilyLookup
                      ? 'familyHouseLookup.filters.houseName'
                      : 'familyHouseLookup.filters.familyName'
                  ),
                })}
                value={selectedRelatedRanks.length}
              />
              <SummaryItem
                label={t('familyHouseLookup.analytics.coverage')}
                value={`${selectedCoveragePct.toFixed(1)}%`}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <RankedBars
                title={t('familyHouseLookup.analytics.relatedDistribution')}
                items={selectedRelatedRanks.slice(0, RANK_LIMIT)}
                loading={membersLoading || membersFetching}
                emptyLabel={t('familyHouseLookup.analytics.noRelatedGroups')}
                linkType={relatedLookupType}
              />
              <RankedBars
                title={t('familyHouseLookup.analytics.ageBreakdown')}
                items={selectedAgeBreakdown}
                loading={membersLoading || membersFetching}
                emptyLabel={t('familyHouseLookup.analytics.noAgeData')}
              />
              <RankedBars
                title={t('familyHouseLookup.analytics.genderBreakdown')}
                items={selectedGenderBreakdown}
                loading={membersLoading || membersFetching}
                emptyLabel={t('familyHouseLookup.analytics.noGenderData')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <QuickAccessMembers
                title={t('familyHouseLookup.analytics.quickUsers')}
                users={quickUsers}
                emptyLabel={t('familyHouseLookup.analytics.noUsers')}
              />
              <QuickAccessGroups
                title={t('familyHouseLookup.analytics.quickRelatedGroups')}
                groups={selectedRelatedRanks.slice(0, QUICK_USERS_LIMIT)}
                emptyLabel={t('familyHouseLookup.analytics.noRelatedGroups')}
                lookupType={relatedLookupType}
              />
            </div>
          </>
        )}
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
              emptyTitle={t(
                normalizedSubmittedName
                  ? 'familyHouseLookup.empty.resultsTitle'
                  : 'familyHouseLookup.empty.initialTitle'
              )}
              emptyDescription={t(
                normalizedSubmittedName
                  ? 'familyHouseLookup.empty.resultsDescription'
                  : 'familyHouseLookup.empty.initialDescription'
              )}
              emptyIcon={UsersIcon}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function SummaryItem({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface-alt/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        {Icon ? <Icon className="h-3.5 w-3.5 text-muted" /> : null}
      </div>
      <p className="mt-1 text-lg font-semibold text-heading">{value || 0}</p>
    </div>
  );
}

function RankedBars({ title, items, loading, emptyLabel, linkType }) {
  const maxValue = Math.max(...items.map((item) => item.count || 0), 1);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      {loading ? (
        <p className="mt-3 text-sm text-muted">...</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => {
            const width = Math.max((item.count / maxValue) * 100, 4);
            return (
              <div key={`${item.name}-${item.count}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  {linkType ? (
                    <Link
                      to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery(linkType, item.name)}`}
                      className="truncate text-xs font-semibold text-heading hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <span className="truncate text-xs font-semibold text-heading">{item.name}</span>
                  )}
                  <Badge variant="primary">{item.count}</Badge>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickAccessMembers({ title, users, emptyLabel }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      {users.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {users.map((user) => {
            const userId = user._id || user.id;
            if (!userId) return null;
            return (
              <Link
                key={userId}
                to={`/dashboard/users/${userId}`}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-heading hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
              >
                {user.fullName || EMPTY}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function QuickAccessGroups({ title, groups, emptyLabel, lookupType }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      {groups.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyLabel}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {groups.map((group) => (
            <Link
              key={group.name}
              to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery(lookupType, group.name)}`}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-heading hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <span>{group.name}</span>
              <span className="text-primary">({group.count})</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function LookupNameLink({ lookupType, name, emptyValue }) {
  const normalizedName = String(name || '').trim();
  if (!normalizedName) return <span className="text-muted">{emptyValue}</span>;

  return (
    <Link
      to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery(lookupType, normalizedName)}`}
      className="text-heading hover:text-primary"
    >
      {normalizedName}
    </Link>
  );
}

function getInitial(name) {
  if (!name) return 'U';
  return String(name).trim().charAt(0).toUpperCase();
}
