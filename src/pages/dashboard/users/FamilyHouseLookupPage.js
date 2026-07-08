import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  HandCoins,
  LockKeyhole,
  Pencil,
  Search,
  ShieldCheck,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { aidsApi, householdClassificationsApi, usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import PageHeader from '../../../components/ui/PageHeader';
import Skeleton from '../../../components/ui/Skeleton';
import StatCard from '../../../components/ui/StatCard';
import Table from '../../../components/ui/Table';
import FamilyHouseProfileInsights from '../../../components/users/FamilyHouseProfileInsights';
import HouseholdQuickEditModal from '../../../components/users/HouseholdQuickEditModal';
import { getGenderLabel } from '../../../utils/formatters';
import { localizeAidOccurrence } from '../../../utils/aidOccurrenceLocalization';
import {
  describeCriterionActualValue,
  formatCurrencyEGP,
  getStatusText,
} from '../households/householdClassifications.shared';
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

const DETAILS_COPY = {
  en: {
    householdClassificationTitle: 'Household classification',
    householdClassificationSubtitle:
      'See the evaluated house status, the stored house profile, and the full rule breakdown for this house.',
    houseName: 'House name',
    source: 'Source',
    primaryClassification: 'Primary classification',
    computedPrimaryClassification: 'Computed classification',
    classificationMode: 'Classification mode',
    manualOverride: 'Manual override',
    computedMode: 'Computed from rules',
    matchedCategories: 'Matched categories',
    totalIncome: 'Total income',
    averageIncome: 'Average income',
    incomeSources: 'Income sources',
    editHouse: 'Edit house',
    manageRules: 'Manage rules',
    noMatchedCategories: 'No categories matched this house yet.',
    noClassificationData:
      'No household classification result was found for this house. Review the house name or refresh member data.',
    noIncomeSources: 'No house income sources are stored yet.',
    evaluationTitle: 'Rule evaluation',
    evaluationSubtitle:
      'Each category below shows whether the current house data satisfies its configured criteria.',
    criteriaActualValue: 'Actual value',
    noCriteria: 'No criteria are configured for this category.',
    matched: 'Matched',
    notMatched: 'Not matched',
    actionsColumn: 'Actions',
    quickEdit: 'Quick edit',
    fullEdit: 'Full edit',
    familyHintTitle: 'Household statuses are available by house',
    familyHintDescription:
      'Classification is evaluated per house name. Open one of the houses in this family to review or edit the full house record.',
    openHouseStatus: 'Open house status',
    aidsHistoryTitle: 'Aid history',
    aidsHistorySubtitle:
      'Review the aid groups this selected family or house has already received.',
    aidsHistoryEmpty: 'No aid records yet',
    aidsHistoryEmptyDescription:
      'Aid groups recorded for this family or house will appear here.',
    beneficiariesLabel: 'Beneficiaries',
    housesLabel: 'Houses included',
    notesLabel: 'Notes',
    openAidDetails: 'Open aid details',
  },
  ar: {
    householdClassificationTitle: 'تصنيف البيت',
    householdClassificationSubtitle:
      'راجع حالة البيت المحسوبة، وملف البيت المحفوظ، والتفصيل الكامل لتقييم القواعد لهذا البيت.',
    houseName: 'اسم البيت',
    source: 'مصدر التجميع',
    primaryClassification: 'التصنيف الأساسي',
    computedPrimaryClassification: 'التصنيف المحسوب',
    classificationMode: 'وضع التصنيف',
    manualOverride: 'تعيين يدوي',
    computedMode: 'محسوب من القواعد',
    matchedCategories: 'التصنيفات المطابقة',
    totalIncome: 'إجمالي الدخل',
    averageIncome: 'متوسط الدخل',
    incomeSources: 'مصادر الدخل',
    editHouse: 'تعديل البيت',
    manageRules: 'إدارة القواعد',
    noMatchedCategories: 'لا توجد تصنيفات مطابقة لهذا البيت حالياً.',
    noClassificationData:
      'لا توجد نتيجة تصنيف لهذا البيت حالياً. راجع اسم البيت أو حدّث بيانات الأفراد.',
    noIncomeSources: 'لا توجد مصادر دخل محفوظة لهذا البيت حالياً.',
    evaluationTitle: 'تفصيل تقييم القواعد',
    evaluationSubtitle:
      'كل فئة بالأسفل توضح هل بيانات هذا البيت الحالية تحقق المعايير المضبوطة أم لا.',
    criteriaActualValue: 'القيمة الفعلية',
    noCriteria: 'لا توجد معايير مضبوطة لهذه الفئة.',
    matched: 'مطابق',
    notMatched: 'غير مطابق',
    actionsColumn: 'الإجراءات',
    quickEdit: 'تعديل سريع',
    fullEdit: 'تعديل كامل',
    familyHintTitle: 'تصنيفات البيوت تظهر لكل بيت على حدة',
    familyHintDescription:
      'التصنيف يتم حسابه حسب اسم البيت. افتح أحد البيوت المرتبطة بهذه العائلة لعرض ملف البيت بالكامل وتعديله.',
    openHouseStatus: 'فتح حالة البيت',
    aidsHistoryTitle: 'سجل المساعدات',
    aidsHistorySubtitle:
      'راجع مجموعات المساعدات التي حصلت عليها هذه العائلة أو هذا البيت من قبل.',
    aidsHistoryEmpty: 'لا توجد سجلات مساعدات',
    aidsHistoryEmptyDescription:
      'ستظهر هنا مجموعات المساعدات المسجلة لهذه العائلة أو لهذا البيت.',
    beneficiariesLabel: 'عدد المستفيدين',
    housesLabel: 'البيوت المشمولة',
    notesLabel: 'ملاحظات',
    openAidDetails: 'فتح تفاصيل المساعدة',
  },
};

function formatDisplayDate(value, language = 'en') {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || EMPTY);

  return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function FamilyHouseLookupPage() {
  const { t, isRTL, language } = useI18n();
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [lookupType, setLookupType] = useState('familyName');
  const [lookupName, setLookupName] = useState('');
  const [submittedLookupName, setSubmittedLookupName] = useState('');
  const [lookupDropdownOpen, setLookupDropdownOpen] = useState(false);
  const [houseEditOpen, setHouseEditOpen] = useState(false);
  const lookupInputRef = useRef(null);
  const detailsCopy = DETAILS_COPY[language === 'ar' ? 'ar' : 'en'];

  const isFamilyLookup = lookupType === 'familyName';
  const relatedLookupType = isFamilyLookup ? 'houseName' : 'familyName';
  const normalizedLookupName = normalizeText(lookupName);
  const normalizedSubmittedName = normalizeText(submittedLookupName);
  const canViewHouseholdClassification = hasPermission('HOUSEHOLD_CLASSIFICATIONS_VIEW');
  const canViewAidHistory = hasPermission('HOUSEHOLD_CLASSIFICATIONS_VIEW');
  const canEditHouseholdMembers = hasPermission('USERS_UPDATE');
  const canManageHouseholdClassifications = hasPermission('HOUSEHOLD_CLASSIFICATIONS_MANAGE');
  const canEditHousehold =
    canEditHouseholdMembers || canManageHouseholdClassifications;

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

  const {
    data: selectedHousehold,
    isLoading: selectedHouseholdLoading,
    isFetching: selectedHouseholdFetching,
    error: selectedHouseholdError,
  } = useQuery({
    queryKey: ['household-classifications', 'selected-household', normalizedSubmittedName],
    queryFn: async () => {
      const { data } = await householdClassificationsApi.getHouseholdByName(
        submittedLookupName.trim()
      );
      return data?.data ?? data ?? null;
    },
    enabled:
      canViewHouseholdClassification &&
      !isFamilyLookup &&
      Boolean(normalizedSubmittedName),
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

  const sortedMembers = useMemo(
    () =>
      [...members].sort((a, b) =>
        String(a?.fullName || '').localeCompare(String(b?.fullName || ''), undefined, {
          sensitivity: 'base',
        })
      ),
    [members]
  );

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

  const aidHouseNames = useMemo(() => {
    if (!normalizedSubmittedName) return [];

    if (!isFamilyLookup) {
      const directHouseName = String(submittedLookupName || '').trim();
      return directHouseName ? [directHouseName] : [];
    }

    return [...new Set(
      members
        .map((member) => String(member?.houseName || '').trim())
        .filter(Boolean)
    )];
  }, [isFamilyLookup, members, normalizedSubmittedName, submittedLookupName]);

  const aidHistoryKey = useMemo(() => [...aidHouseNames].sort().join('|'), [aidHouseNames]);

  const {
    data: aidHistoryResponse,
    isLoading: aidHistoryLoading,
    isFetching: aidHistoryFetching,
    error: aidHistoryError,
  } = useQuery({
    queryKey: ['aids', 'family-house-history', aidHistoryKey],
    queryFn: async () => {
      const { data } = await aidsApi.searchHistory({ houseNames: aidHouseNames });
      return data?.data ?? [];
    },
    enabled: canViewAidHistory && Boolean(normalizedSubmittedName) && aidHouseNames.length > 0,
    staleTime: 30000,
  });

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

  const selectedHouseholdErrorMessage = selectedHouseholdError
    ? normalizeApiError(selectedHouseholdError).message
    : null;

  const aidHistoryErrorMessage = aidHistoryError
    ? normalizeApiError(aidHistoryError).message
    : null;
  const aidHistoryItems = Array.isArray(aidHistoryResponse) ? aidHistoryResponse : [];
  const shouldShowAidHistory =
    aidHistoryLoading || aidHistoryFetching || !!aidHistoryErrorMessage || aidHistoryItems.length > 0;

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        label: t('familyHouseLookup.columns.name'),
        render: (row) => {
          const userId = row._id || row.id;
          return (
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
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
                {row.isLocked ? (
                  <span className="absolute -bottom-0.5 -left-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white ring-2 ring-surface">
                    <LockKeyhole className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                ) : null}
              </div>
              <div className="min-w-0">
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
                <p className={`${isRTL ? 'text-center' : 'text-left'} text-xs text-muted`}>
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
          <span className={`${isRTL ? 'text-center' : 'text-left'}`}>
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
    [t, isRTL]
  );

  const handleClear = () => {
    setLookupName('');
    setSubmittedLookupName('');
    setLookupDropdownOpen(false);
  };

  const handleHouseholdSaved = (updatedHousehold) => {
    setHouseEditOpen(false);
    if (updatedHousehold?.householdName) {
      setLookupType('houseName');
      setLookupName(updatedHousehold.householdName);
      setSubmittedLookupName(updatedHousehold.householdName);
    }
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['household-classifications'] });
  };

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: t('familyHouseLookup.detailsPage.page') },
        ]}
      />

      {/* <Card padding={false} className="relative overflow-hidden">
        <div className="relative p-6 lg:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <PageHeader
                contentOnly
                // eyebrow={t('visitations.list.page')}
                className="border-b border-border pb-6"
              />
            </div>
            <Link to={FAMILY_HOUSE_ANALYTICS_PATH}>
              <Button variant="outline" icon={ArrowLeft}>
                {t('familyHouseLookup.detailsPage.backToAnalytics')}
              </Button>
            </Link>
          </div>
        </div>
      </Card> */}

      <PageHeader
        title={t('familyHouseLookup.detailsPage.title')}
        subtitle={t('familyHouseLookup.detailsPage.subtitle')}
        className="border-b border-border pb-6"
        actions={
          <Link to={FAMILY_HOUSE_ANALYTICS_PATH}>
            <Button variant="outline" icon={ArrowLeft}>
              {t('familyHouseLookup.detailsPage.backToAnalytics')}
            </Button>
          </Link>
        }
      />

      <Card tone="primary" className="space-y-4 sm:space-y-5">
        <CardHeader
          icon={Search}
          title={t('familyHouseLookup.title')}
          subtitle={t('familyHouseLookup.subtitle')}
          className="!mb-0"
        />

        {/* Search-type segmented toggle — lightweight segmented control */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
            {t('familyHouseLookup.filters.searchType')}
          </label>
          <div
            role="tablist"
            className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1"
          >
            {[
              { value: 'familyName', label: t('familyHouseLookup.filters.familyName') },
              { value: 'houseName', label: t('familyHouseLookup.filters.houseName') },
            ].map((option) => {
              const active = lookupType === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setLookupType(option.value);
                    setLookupName('');
                    setSubmittedLookupName('');
                    setLookupDropdownOpen(false);
                  }}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:bg-surface-alt hover:text-heading'
                    }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Primary action: the lookup search field with autocomplete */}
        <div className="relative">
          <Input
            ref={lookupInputRef}
            label={t('familyHouseLookup.filters.lookupName')}
            icon={Search}
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
            containerClassName="!mb-0"
            className={`h-12 text-base ${isRTL ? 'pl-11' : 'pr-11'}`}
          />
          {(lookupName || submittedLookupName) ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              icon={X}
              onClick={handleClear}
              aria-label={t('familyHouseLookup.filters.clear')}
              className={`absolute bottom-1.5 !h-9 !w-9 !px-0 rounded-full ${isRTL ? 'left-1.5' : 'right-1.5'}`}
            />
          ) : null}
          {lookupDropdownOpen && (
            <ul
              className="absolute z-20 mt-1.5 w-full max-h-64 overflow-auto rounded-xl border border-border bg-surface shadow-dropdown py-1"
              role="listbox"
            >
              {lookupNamesLoading ? (
                <li className="px-3.5 py-2.5 text-sm text-muted">
                  {t('familyHouseLookup.filters.loadingNames')}
                </li>
              ) : filteredLookupNames.length === 0 ? (
                <li className="px-3.5 py-2.5 text-sm text-muted">{t('common.search.noResults')}</li>
              ) : (
                filteredLookupNames.map((name) => {
                  const selected = lookupName === name;
                  return (
                    <li
                      key={name}
                      role="option"
                      aria-selected={selected}
                      className={`flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors ${selected
                        ? 'bg-primary/8 text-primary'
                        : 'text-heading hover:bg-surface-alt'
                        }`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setLookupName(name);
                        setSubmittedLookupName(name.trim());
                        setLookupDropdownOpen(false);
                      }}
                    >
                      <span className="truncate">{name}</span>
                    </li>
                  );
                })
              )}
            </ul>
          )}
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

      {!normalizedSubmittedName ? (
        <Card>
          <EmptyState
            icon={Search}
            title={t('familyHouseLookup.detailsPage.noSelectionTitle')}
            description={t('familyHouseLookup.detailsPage.noSelectionDescription')}
          />
        </Card>
      ) : membersErrorMessage ? (
        <Card>
          <EmptyState
            icon={UsersIcon}
            title={t('familyHouseLookup.empty.errorTitle')}
            description={membersErrorMessage}
          />
        </Card>
      ) : (
        <Card className="space-y-5">
          {/* Strong summary header: selected family/house name + type */}
          <div className="flex items-start gap-3.5">
            <span
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${isFamilyLookup ? 'bg-primary/10 text-primary' : 'bg-secondary/12 text-secondary'
                }`}
            >
              {isFamilyLookup ? (
                <UsersIcon className="h-6 w-6" />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isFamilyLookup ? 'primary' : 'gold'} dot>
                  {t(
                    isFamilyLookup
                      ? 'familyHouseLookup.filters.familyName'
                      : 'familyHouseLookup.filters.houseName'
                  )}
                </Badge>
                {membersFetching ? (
                  <span className="text-xs text-muted">
                    {t('familyHouseLookup.filters.loadingNames')}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-1.5 break-words text-2xl font-bold leading-tight tracking-tight text-heading">
                {submittedLookupName}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {t('familyHouseLookup.table.results', { count: members.length })}
              </p>
            </div>
          </div>

          {/* Key stats — scannable strip, 2-up on mobile / 4-up on desktop */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={UsersIcon}
              label={t('familyHouseLookup.summary.membersCount')}
              value={members.length}
              tone="primary"
              isRTL={isRTL}
            />
            <StatCard
              icon={LockKeyhole}
              label={t('familyHouseLookup.summary.lockedCount')}
              value={selectedLockedMembers}
              tone={selectedLockedMembers > 0 ? 'danger' : 'success'}
              isRTL={isRTL}
            />
            <StatCard
              icon={Building2}
              label={t('familyHouseLookup.summary.relatedOtherGroup', {
                group: t(
                  isFamilyLookup
                    ? 'familyHouseLookup.filters.houseName'
                    : 'familyHouseLookup.filters.familyName'
                ),
              })}
              value={selectedRelatedRanks.length}
              tone="gold"
              isRTL={isRTL}
            />
            <StatCard
              icon={ShieldCheck}
              label={t('familyHouseLookup.analytics.coverage')}
              value={`${selectedCoveragePct.toFixed(1)}%`}
              tone="info"
              isRTL={isRTL}
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
        </Card>
      )}

      {normalizedSubmittedName && canViewHouseholdClassification && isFamilyLookup ? (
        <FamilyClassificationHint
          copy={detailsCopy}
          relatedHouses={selectedRelatedRanks.slice(0, QUICK_USERS_LIMIT)}
        />
      ) : null}

      {normalizedSubmittedName && canViewHouseholdClassification && !isFamilyLookup ? (
        <HouseholdClassificationPanel
          household={selectedHousehold}
          loading={selectedHouseholdLoading || selectedHouseholdFetching}
          errorMessage={selectedHouseholdErrorMessage}
          copy={detailsCopy}
          language={language}
          canEditHousehold={canEditHousehold}
          canManageHouseholdClassifications={canManageHouseholdClassifications}
          onEditHousehold={() => setHouseEditOpen(true)}
        />
      ) : null}

      {normalizedSubmittedName && !membersErrorMessage ? (
        <FamilyHouseProfileInsights
          members={sortedMembers}
          lookupType={lookupType}
          lookupName={submittedLookupName}
          loading={membersLoading || membersFetching}
        />
      ) : null}

      {normalizedSubmittedName && canViewAidHistory && !membersErrorMessage && shouldShowAidHistory ? (
        <AidHistoryPanel
          items={aidHistoryItems}
          loading={aidHistoryLoading || aidHistoryFetching}
          errorMessage={aidHistoryErrorMessage}
          copy={detailsCopy}
          language={language}
        />
      ) : null}

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <CardHeader
            icon={UsersIcon}
            title={t('familyHouseLookup.table.title')}
            action={
              <Badge variant="primary">
                {t('familyHouseLookup.table.results', { count: members.length })}
              </Badge>
            }
            className="!mb-0"
          />
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
              flush
              columns={columns}
              data={sortedMembers}
              loading={membersLoading || membersFetching}
              renderMode="auto"
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

      <HouseholdQuickEditModal
        household={selectedHousehold}
        isOpen={houseEditOpen}
        onClose={() => setHouseEditOpen(false)}
        onSaved={handleHouseholdSaved}
        canEditMembers={canEditHouseholdMembers}
        canManageHouseholdClassifications={canManageHouseholdClassifications}
      />
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-alt/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-heading">{value || 0}</p>
    </div>
  );
}

function FamilyClassificationHint({ copy, relatedHouses = [] }) {
  return (
    <Card className="space-y-4">
      <CardHeader
        icon={Building2}
        title={copy.familyHintTitle}
        subtitle={copy.familyHintDescription}
        action={<Badge variant="secondary">{relatedHouses.length}</Badge>}
        className="!mb-0"
      />

      {relatedHouses.length === 0 ? (
        <p className="text-sm text-muted">{copy.noClassificationData}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {relatedHouses.map((house) => (
            <Link
              key={house.name}
              to={`${FAMILY_HOUSE_DETAILS_PATH}?${buildLookupQuery('houseName', house.name)}`}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-heading hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <span>{house.name}</span>
              <span className="text-primary">({house.count})</span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function AidHistoryPanel({ items, loading, errorMessage, copy, language }) {
  return (
    items.length === 0 && (
      <Card className="space-y-5">
        <CardHeader
          icon={HandCoins}
          title={copy.aidsHistoryTitle}
          subtitle={copy.aidsHistorySubtitle}
          action={<Badge variant="secondary">{items.length}</Badge>}
          className="!mb-0"
        />

        {errorMessage ? (
          <EmptyState icon={HandCoins} title={copy.aidsHistoryTitle} description={errorMessage} />
        ) : loading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-44 w-full rounded-2xl" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={HandCoins}
            title={copy.aidsHistoryEmpty}
            description={copy.aidsHistoryEmptyDescription}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {items.map((item) => {
              const params = buildLookupQueryForAidDetails(item);

              return (
                <Link
                  key={`${item.date}-${item.category}-${item.description}`}
                  to={`/dashboard/lords-brethren/aid-history/details?${params}`}
                  className="group rounded-xl border border-border bg-surface p-5 shadow-card transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {formatDisplayDate(item.date, language)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-heading">{item.description || EMPTY}</h3>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted transition-colors group-hover:text-primary" />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Badge variant="primary">{item.category || EMPTY}</Badge>
                    <Badge variant="default">{localizeAidOccurrence(item.occurrence, language)}</Badge>
                  </div>

                  {item.notes ? (
                    <div className="mt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {copy.notesLabel}
                      </p>
                      <p className="mt-2 line-clamp-3 text-sm text-muted">{item.notes}</p>
                    </div>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    )
  );
}

function HouseholdClassificationPanel({
  household,
  loading,
  errorMessage,
  copy,
  language,
  canEditHousehold,
  canManageHouseholdClassifications,
  onEditHousehold,
}) {
  return (
    <Card className="space-y-5">
      <CardHeader
        icon={Building2}
        title={copy.householdClassificationTitle}
        subtitle={copy.householdClassificationSubtitle}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {canEditHousehold && household ? (
              <Button type="button" variant="outline" size="sm" icon={Pencil} onClick={onEditHousehold}>
                {copy.editHouse}
              </Button>
            ) : null}
            {canManageHouseholdClassifications ? (
              <Link to="/dashboard/households/classifications">
                <Button type="button" variant="outline" size="sm" icon={ShieldCheck}>
                  {copy.manageRules}
                </Button>
              </Link>
            ) : null}
          </div>
        }
        className="!mb-0"
      />

      {errorMessage ? (
        <EmptyState
          icon={Building2}
          title={copy.householdClassificationTitle}
          description={errorMessage}
        />
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-3 rounded-xl bg-surface-alt/40 p-4">
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : !household ? (
        <EmptyState
          icon={Building2}
          title={copy.householdClassificationTitle}
          description={copy.noClassificationData}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
            <SummaryItem label={copy.houseName} value={household.householdName || EMPTY} />
            {/* <SummaryItem label={copy.source} value={getHouseholdSourceLabel(household.sourceField, language)} /> */}
            <SummaryItem
              label={copy.primaryClassification}
              value={household.primaryClassification?.name || getStatusText('unclassified', language)}
            />
            <SummaryItem
              label={copy.classificationMode}
              value={household.isPrimaryClassificationManual ? copy.manualOverride : copy.computedMode}
            />
            <SummaryItem label={tallyLabel(language, 'members')} value={household.memberCount} />
            <SummaryItem
              label={copy.totalIncome}
              value={formatCurrencyEGP(household.totalMemberIncome, language)}
            />
            <SummaryItem
              label={copy.averageIncome}
              value={formatCurrencyEGP(household.averageMemberIncome, language)}
            />
            {/* <SummaryItem
              label={copy.matchedCategories}
              value={household.matchedCategories?.length || 0}
            /> */}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-xl bg-surface-alt/40 p-4">
              <p className="text-sm font-semibold text-heading">{copy.primaryClassification}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <HouseholdStatusBadge
                  classification={household.primaryClassification}
                  language={language}
                />
                <Badge variant={household.isPrimaryClassificationManual ? 'secondary' : 'default'}>
                  {household.isPrimaryClassificationManual ? copy.manualOverride : copy.computedMode}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl bg-surface-alt/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-heading">{copy.incomeSources}</p>
                <Badge variant="default">{household.incomeSources?.length || 0}</Badge>
              </div>
              {household.incomeSources?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {household.incomeSources.map((source) => (
                    <Badge key={source} variant="secondary">
                      {source}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">{copy.noIncomeSources}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-heading">{copy.matchedCategories}</p>
              <Badge variant="default">{household.matchedCategories?.length || 0}</Badge>
            </div>
            {household.matchedCategories?.length ? (
              <div className="flex flex-wrap gap-2">
                {household.matchedCategories.map((category) => (
                  <HouseholdStatusBadge key={category.id} classification={category} language={language} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{copy.noMatchedCategories}</p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}

function HouseholdEvaluationCard({ evaluation, language, copy }) {
  return (
    <Card padding="sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-heading">{evaluation.name}</h3>
          {evaluation.description ? (
            <p className="mt-1 text-sm text-muted">{evaluation.description}</p>
          ) : null}
        </div>
        <Badge variant={evaluation.matched ? 'success' : 'default'}>
          {evaluation.matched ? copy.matched : copy.notMatched}
        </Badge>
      </div>

      {evaluation.criteria?.length ? (
        <div className="mt-4 space-y-3">
          {evaluation.criteria.map((criterion) => (
            <CriterionResultRow
              key={criterion.id || `${evaluation.id}-${criterion.metric}-${criterion.operator}`}
              criterion={criterion}
              language={language}
              copy={copy}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">{copy.noCriteria}</p>
      )}
    </Card>
  );
}

function CriterionResultRow({ criterion, language, copy }) {
  return (
    <Card tone="muted" padding="sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-heading">
            {criterion.label || criterion.metric}
          </p>
          <p className="mt-1 text-xs text-muted">
            {getStatusText(criterion.isRequired ? 'required' : 'optional', language)}
          </p>
        </div>
        <Badge variant={criterion.passed ? 'success' : 'default'}>
          {getStatusText(criterion.passed ? 'passed' : 'failed', language)}
        </Badge>
      </div>

      <div className="mt-3">
        <span className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted">
          {copy.criteriaActualValue}: {describeCriterionActualValue(criterion, language)}
        </span>
      </div>
    </Card>
  );
}

function HouseholdStatusBadge({ classification, language }) {
  if (!classification) {
    return <Badge>{getStatusText('unclassified', language)}</Badge>;
  }

  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{
        color: classification.color || '#2563eb',
        borderColor: `${classification.color || '#2563eb'}33`,
        backgroundColor: `${classification.color || '#2563eb'}12`,
      }}
    >
      {classification.name}
    </span>
  );
}

function tallyLabel(language, key) {
  if (key === 'members') {
    return language === 'ar' ? 'عدد الأفراد' : 'Members';
  }
  return key;
}

function RankedBars({ title, items, loading, emptyLabel, linkType }) {
  const maxValue = Math.max(...items.map((item) => item.count || 0), 1);

  return (
    <div className="rounded-xl bg-surface-alt/40 p-4">
      <h3 className="text-sm font-semibold text-heading">{title}</h3>
      {loading ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-6" />
              </div>
              <Skeleton className="h-1.5 w-full !rounded-full" />
            </div>
          ))}
        </div>
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

function buildLookupQueryForAidDetails(item) {
  return new URLSearchParams({
    date: item.date,
    category: item.category,
    occurrence: item.occurrence,
    description: item.description,
  }).toString();
}

function getInitial(name) {
  if (!name) return 'U';
  return String(name).trim().charAt(0).toUpperCase();
}
