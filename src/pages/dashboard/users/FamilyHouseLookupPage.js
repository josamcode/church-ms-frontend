import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, Search, Users as UsersIcon } from 'lucide-react';
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

const EMPTY = '---';

export default function FamilyHouseLookupPage() {
  const { t, isRTL } = useI18n();
  const [searchParams] = useSearchParams();
  const [lookupType, setLookupType] = useState('familyName');
  const [lookupName, setLookupName] = useState('');
  const [submittedLookupName, setSubmittedLookupName] = useState('');
  const [lookupDropdownOpen, setLookupDropdownOpen] = useState(false);
  const lookupInputRef = useRef(null);

  const isFamilyLookup = lookupType === 'familyName';
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

  const summaryRelatedNames = useMemo(() => {
    if (normalizedSubmittedName) return relatedOtherGroupNames;
    return lookupNames.slice(0, 15);
  }, [lookupNames, normalizedSubmittedName, relatedOtherGroupNames]);

  useEffect(() => {
    const urlLookupType = searchParams.get('lookupType');
    const urlLookupName = String(searchParams.get('lookupName') || '').trim();

    const nextLookupType =
      urlLookupType === 'houseName' || urlLookupType === 'familyName'
        ? urlLookupType
        : null;

    if (nextLookupType) setLookupType(nextLookupType);

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
                className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none ${isRTL ? 'right-3' : 'left-3'
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
            value={submittedLookupName || EMPTY}
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
            value={summaryRelatedNames.length || 0}
          />
        </div>

        {/* relatedNamesLabel */}
        <div className="rounded-xl border border-border bg-surface-alt/50 p-3 text-sm">
          <span className="font-medium text-heading">
            {t('familyHouseLookup.summary.relatedNamesLabel')}
          </span>
          <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-muted`}>
            {summaryRelatedNames.length > 0
              ? summaryRelatedNames.join(' - ')
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

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-surface-alt/50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-heading">{value || 0}</p>
    </div>
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
