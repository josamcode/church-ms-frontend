import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar, Clock3, Edit, ExternalLink, Lock, Mail, MapPin,
  MessageCircle, Phone, Plus, Shield, Tag, Unlock, User,
  UserCircle, Users as UsersIcon,
} from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import { formatDate, getGenderLabel, getRoleLabel } from '../../../utils/formatters';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Skeleton from '../../../components/ui/Skeleton';
import Tabs from '../../../components/ui/Tabs';
import TextArea from '../../../components/ui/TextArea';
import UserSearchSelect from '../../../components/UserSearchSelect';
import toast from 'react-hot-toast';

const EMPTY = '---';

/* ── primitives ──────────────────────────────────────────────────────────── */

function SectionLabel({ children, count }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/60" />
      {count != null && (
        <span className="text-[11px] font-semibold tabular-nums text-muted">{count}</span>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, value, ltr = false }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted" />}
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</p>
      </div>
      <p className={`mt-1 text-sm font-medium text-heading ${ltr ? 'direction-ltr text-left' : ''}`}>
        {value || EMPTY}
      </p>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function UserDetailsPage() {
  const { id } = useParams();
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await usersApi.getById(id);
      return data.data;
    },
    staleTime: 60000,
  });

  const refreshUser = () => {
    queryClient.invalidateQueries({ queryKey: ['users', id] });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const unlockMutation = useMutation({
    mutationFn: () => usersApi.unlock(id),
    onSuccess: () => {
      toast.success(t('userDetails.messages.unlockedSuccess'));
      refreshUser();
    },
    onError: (err) => toast.error(normalizeApiError(err).message),
  });

  if (isLoading) return <UserDetailsSkeleton />;

  if (!user) {
    return (
      <EmptyState
        icon={UsersIcon}
        title={t('userDetails.notFound.title')}
        description={t('userDetails.notFound.description')}
      />
    );
  }

  const whatsappUrl = buildWhatsAppUrl(user.whatsappNumber || user.phonePrimary);
  const callUrl = buildCallUrl(user.phonePrimary || user.whatsappNumber);
  const familyCount = countFamilyMembers(user);
  const initial = String(user.fullName || '?').trim().charAt(0).toUpperCase();

  const tabs = [
    {
      label: t('userDetails.tabs.profile'),
      content: <ProfileTab user={user} />,
    },
    {
      label: t('userDetails.tabs.family'),
      content: (
        <FamilyTab
          user={user}
          hasPermission={hasPermission}
          queryClient={queryClient}
          onRefresh={refreshUser}
        />
      ),
    },
  ];

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: user.fullName || EMPTY },
        ]}
      />

      {/* ══ HERO ════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-surface">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/6" />

        <div className="relative p-6 lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            {/* avatar + name */}
            <div className="flex items-center gap-5">
              {user.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt=""
                  className="h-20 w-20 rounded-2xl border-2 border-primary/20 object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/10 text-2xl font-bold text-primary shadow-inner">
                  {initial}
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-primary/70">
                  {t('shared.users')}
                </p>
                <h1 className="mt-0.5 text-3xl font-bold tracking-tight text-heading">
                  {user.fullName || EMPTY}
                </h1>
                <p className="mt-1 text-sm text-muted direction-ltr text-left">
                  {user.phonePrimary || EMPTY}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="primary">{getRoleLabel(user.role)}</Badge>
                  <Badge variant={user.isLocked ? 'danger' : 'success'}>
                    {user.isLocked ? t('common.status.locked') : t('common.status.active')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={MessageCircle}
                onClick={() => whatsappUrl && window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
                disabled={!whatsappUrl}
              >
                {t('userDetails.fields.whatsapp')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={Phone}
                onClick={() => callUrl && window.open(callUrl, '_self')}
                disabled={!callUrl}
              >
                {t('userDetails.fields.call')}
              </Button>
              {hasPermission('USERS_UPDATE') && (
                <Link to={`/dashboard/users/${id}/edit`}>
                  <Button variant="outline" size="sm" icon={Edit}>
                    {t('common.actions.edit')}
                  </Button>
                </Link>
              )}
              {hasPermission('USERS_LOCK') && !user.isLocked && (
                <Link to={`/dashboard/users/${id}/lock`}>
                  <Button variant="outline" size="sm" icon={Lock}>
                    {t('common.actions.lock')}
                  </Button>
                </Link>
              )}
              {hasPermission('USERS_UNLOCK') && user.isLocked && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Unlock}
                  onClick={() => unlockMutation.mutate()}
                  loading={unlockMutation.isPending}
                >
                  {t('common.actions.unlock')}
                </Button>
              )}
            </div>
          </div>

          {/* quick stats strip */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <QuickStat icon={Clock3} label={t('userDetails.summary.joinedOn')} value={formatDate(user.createdAt)} />
            <QuickStat icon={Calendar} label={t('userDetails.summary.lastUpdated')} value={formatDate(user.updatedAt)} />
            <QuickStat icon={UsersIcon} label={t('userDetails.summary.familyLinks')} value={familyCount} />
          </div>

          {/* lock reason */}
          {user.isLocked && user.lockReason && (
            <div className="mt-4 rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-sm text-danger">
              <span className="font-semibold">{t('userDetails.summary.lockReasonLabel')}</span>{' '}
              {user.lockReason}
            </div>
          )}
        </div>
      </div>

      {/* ══ TABS ════════════════════════════════════════════════════════ */}
      <Tabs tabs={tabs} />
    </div>
  );
}

/* ── QuickStat ──────────────────────────────────────────────────────────── */

function QuickStat({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-surface/80 px-4 py-3 backdrop-blur-sm">
      {Icon && <Icon className="h-4 w-4 shrink-0 text-muted" />}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-heading">{value || EMPTY}</p>
      </div>
    </div>
  );
}

/* ── ProfileTab ─────────────────────────────────────────────────────────── */

function ProfileTab({ user }) {
  const { t } = useI18n();
  const tags = Array.isArray(user.tags) ? user.tags : [];
  const customDetails =
    user.customDetails && typeof user.customDetails === 'object'
      ? Object.entries(user.customDetails)
      : [];

  const address =
    [user.address?.governorate, user.address?.city, user.address?.street, user.address?.details]
      .filter(Boolean).join(', ') || EMPTY;

  return (
    <div className="space-y-8">

      {/* ── Personal + Contact side-by-side ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* personal */}
        <div className="space-y-4 xl:col-span-2">
          <SectionLabel>{t('userDetails.profile.personalTitle')}</SectionLabel>
          <div className="rounded-2xl border border-border bg-surface px-6 py-5">
            <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <Field icon={UserCircle} label={t('userDetails.fields.fullName')} value={user.fullName} />
              <Field icon={Shield} label={t('userDetails.fields.role')} value={getRoleLabel(user.role)} />
              <Field icon={User} label={t('userDetails.fields.gender')} value={getGenderLabel(user.gender)} />
              <Field icon={Calendar} label={t('userDetails.fields.birthDate')} value={formatDate(user.birthDate)} />
              <Field icon={User} label={t('userDetails.fields.ageGroup')} value={user.ageGroup || EMPTY} />
              <Field icon={Shield} label={t('userDetails.fields.nationalId')} value={user.nationalId || EMPTY} ltr />
            </div>
          </div>
        </div>

        {/* contact */}
        <div className="space-y-4">
          <SectionLabel>{t('userDetails.profile.contactTitle')}</SectionLabel>
          <div className="rounded-2xl border border-border bg-surface px-6 py-5 space-y-5">
            <Field icon={Phone} label={t('userDetails.fields.primaryPhone')} value={user.phonePrimary || EMPTY} ltr />
            <Field icon={Phone} label={t('userDetails.fields.secondaryPhone')} value={user.phoneSecondary || EMPTY} ltr />
            <Field icon={Phone} label={t('userDetails.fields.whatsapp')} value={user.whatsappNumber || EMPTY} ltr />
            <Field icon={Mail} label={t('userDetails.fields.email')} value={user.email || EMPTY} ltr />
          </div>
        </div>
      </div>

      {/* ── Address + Tags + Notes ── */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        {/* address */}
        <div className="space-y-4 xl:col-span-2">
          <SectionLabel>{t('userDetails.profile.addressTitle')}</SectionLabel>
          <div className="rounded-2xl border border-border bg-surface px-6 py-5">
            <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2">
              <Field icon={MapPin} label={t('userDetails.fields.address')} value={address} />
              <Field icon={UsersIcon} label={t('userDetails.fields.familyName')} value={user.familyName || EMPTY} />
              <Field icon={UsersIcon} label={t('userDetails.fields.houseName')} value={user.houseName || EMPTY} />
              {user.notes && (
                <div className="sm:col-span-2">
                  <Field icon={User} label={t('userDetails.fields.notes')} value={user.notes} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* tags */}
        <div className="space-y-4">
          <SectionLabel count={tags.length}>{t('userDetails.profile.tagsTitle')}</SectionLabel>
          <div className="rounded-2xl border border-border bg-surface px-6 py-5">
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Badge key={tag}>{tag}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{EMPTY}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Custom details ── */}
      {customDetails.length > 0 && (
        <div className="space-y-4">
          <SectionLabel count={customDetails.length}>
            {t('userDetails.profile.customDetailsTitle')}
          </SectionLabel>
          <div className="rounded-2xl border border-border bg-surface px-6 py-5">
            <div className="grid grid-cols-1 gap-x-10 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
              {customDetails.map(([key, value]) => (
                <Field key={key} icon={Tag} label={key} value={value || EMPTY} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── FamilyTab ──────────────────────────────────────────────────────────── */

function FamilyTab({ user, hasPermission, queryClient, onRefresh }) {
  const { t, isRTL } = useI18n();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ relationRole: '', name: '', targetPhone: '', notes: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [addErrors, setAddErrors] = useState({});
  const [relationRoleDropdownOpen, setRelationRoleDropdownOpen] = useState(false);

  const { data: relationRolesRes } = useQuery({
    queryKey: ['users', 'relation-roles'],
    queryFn: async () => {
      const { data } = await usersApi.getRelationRoles();
      return data?.data ?? data ?? [];
    },
    enabled: addModalOpen,
  });

  const relationRoles = Array.isArray(relationRolesRes) ? relationRolesRes : [];
  const canAdd = hasPermission('USERS_FAMILY_LINK');
  const canEdit = hasPermission('USERS_UPDATE');
  const currentUserId = String(user._id || user.id || '');

  const familyGroups = useMemo(() => buildFamilyGroups(user, t), [user, t]);
  const hasAnyFamily = familyGroups.some((group) => group.members.length > 0);
  const totalFamilyCount = familyGroups.reduce((sum, g) => sum + g.members.length, 0);

  const filteredRelationRoles = relationRoles
    .filter((item) =>
      !addForm.relationRole.trim()
        ? true
        : item.label.toLowerCase().includes(addForm.relationRole.trim().toLowerCase())
    )
    .slice(0, 20);

  const linkFamilyMutation = useMutation({
    mutationFn: (payload) => usersApi.linkFamily(user._id || user.id, payload),
    onSuccess: () => {
      toast.success(t('userDetails.messages.familyLinkedSuccess'));
      handleCloseModal();
      onRefresh();
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      if (normalized.code === 'VALIDATION_ERROR' && normalized.details) setAddErrors(normalized.details);
      toast.error(normalized.message);
    },
  });

  const handleCloseModal = () => {
    setAddModalOpen(false);
    setAddErrors({});
    setSelectedUser(null);
    setAddForm({ relationRole: '', name: '', targetPhone: '', notes: '' });
    setRelationRoleDropdownOpen(false);
  };

  const handleAddFamilySubmit = async () => {
    const relationRoleValue = addForm.relationRole.trim();
    const nameValue = selectedUser?.fullName || addForm.name.trim();
    const phoneValue = selectedUser?.phonePrimary || addForm.targetPhone.trim();

    if (!relationRoleValue) { setAddErrors({ relationRole: t('userDetails.family.modal.relationRequired') }); return; }
    if (!nameValue && !phoneValue) { setAddErrors({ targetPhone: t('userDetails.family.modal.nameOrPhoneRequired') }); return; }

    setAddErrors({});

    const existingRole = relationRoles.find(
      (role) => role.label.trim().toLowerCase() === relationRoleValue.toLowerCase()
    );

    if (!existingRole && canEdit) {
      try {
        await usersApi.createRelationRole(relationRoleValue);
        queryClient.invalidateQueries({ queryKey: ['users', 'relation-roles'] });
      } catch (err) {
        toast.error(normalizeApiError(err).message);
        return;
      }
    }

    const relation = existingRole?.relation || 'other';
    linkFamilyMutation.mutate({
      relation,
      relationRole: relationRoleValue,
      name: nameValue || undefined,
      targetPhone: phoneValue || undefined,
      notes: addForm.notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">

      {/* header strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel count={totalFamilyCount}>
          {t('userDetails.family.title')}
        </SectionLabel>
        <div className="flex flex-wrap gap-2">
          {canAdd && (
            <Button variant="outline" size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
              {t('userDetails.family.actions.addFamilyMember')}
            </Button>
          )}
          {canEdit && (
            <Link to={`/dashboard/users/${user._id || user.id}/edit`}>
              <Button variant="ghost" size="sm" icon={Edit}>
                {t('userDetails.family.actions.editProfile')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* family name / house name chips */}
      {(user.familyName || user.houseName) && (
        <div className="flex flex-wrap gap-2">
          {user.familyName && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-4 py-1.5 text-sm">
              <span className="text-muted">{t('userDetails.fields.familyName')}</span>
              <span className="font-semibold text-heading">{user.familyName}</span>
            </span>
          )}
          {user.houseName && (
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-alt px-4 py-1.5 text-sm">
              <span className="text-muted">{t('userDetails.fields.houseName')}</span>
              <span className="font-semibold text-heading">{user.houseName}</span>
            </span>
          )}
        </div>
      )}

      {/* family groups */}
      {hasAnyFamily ? (
        <div className="space-y-6">
          {familyGroups.map((group) =>
            group.members.length > 0 ? (
              <FamilyGroupSection
                key={group.key}
                title={group.title}
                members={group.members}
                currentUserId={currentUserId}
                inverse={group.inverse}
              />
            ) : null
          )}
        </div>
      ) : (
        <EmptyState
          icon={UsersIcon}
          title={t('userDetails.family.empty.title')}
          description={t('userDetails.family.empty.description')}
        />
      )}

      {/* add modal */}
      <Modal
        isOpen={addModalOpen}
        onClose={handleCloseModal}
        title={t('userDetails.family.modal.title')}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>{t('common.actions.cancel')}</Button>
            <Button loading={linkFamilyMutation.isPending} onClick={handleAddFamilySubmit}>
              {t('common.actions.add')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-base">
              {t('userDetails.family.modal.relationLabel')}
              <span className={`${isRTL ? 'mr-1' : 'ml-1'} text-danger`}>*</span>
            </label>
            <input
              type="text"
              value={addForm.relationRole}
              onChange={(e) => {
                setAddForm((prev) => ({ ...prev, relationRole: e.target.value }));
                setRelationRoleDropdownOpen(true);
                if (addErrors.relationRole) setAddErrors((prev) => ({ ...prev, relationRole: undefined }));
              }}
              onFocus={() => setRelationRoleDropdownOpen(true)}
              onBlur={() => setTimeout(() => setRelationRoleDropdownOpen(false), 150)}
              placeholder={t('userDetails.family.modal.relationPlaceholder')}
              className={`input-base w-full ${addErrors.relationRole ? 'border-danger focus:border-danger' : ''}`}
            />
            {addErrors.relationRole && <p className="mt-1 text-xs text-danger">{addErrors.relationRole}</p>}
            {relationRoleDropdownOpen && filteredRelationRoles.length > 0 && (
              <div className="absolute z-30 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-border bg-surface p-1 shadow-lg">
                {filteredRelationRoles.map((role) => (
                  <button
                    key={role.id || role.label}
                    type="button"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-base transition-colors hover:bg-surface-alt"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setAddForm((prev) => ({ ...prev, relationRole: role.label }));
                      setRelationRoleDropdownOpen(false);
                    }}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <UserSearchSelect
            label={t('userDetails.family.modal.linkExistingUser')}
            value={selectedUser}
            onChange={(selected) => {
              setSelectedUser(selected);
              setAddForm((prev) => ({
                ...prev,
                name: selected ? selected.fullName : '',
                targetPhone: selected ? selected.phonePrimary || '' : '',
              }));
            }}
            excludeUserId={user._id || user.id}
          />

          <Input
            label={t('userDetails.family.modal.name')}
            value={addForm.name}
            onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
            containerClassName="!mb-0"
          />
          <Input
            label={t('userDetails.family.modal.phone')}
            value={addForm.targetPhone}
            dir="ltr"
            className="text-left"
            onChange={(e) => {
              setAddForm((prev) => ({ ...prev, targetPhone: e.target.value }));
              if (addErrors.targetPhone) setAddErrors((prev) => ({ ...prev, targetPhone: undefined }));
            }}
            error={addErrors.targetPhone}
            containerClassName="!mb-0"
          />
          <TextArea
            label={t('userDetails.fields.notes')}
            value={addForm.notes}
            onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}

/* ── FamilyGroupSection ─────────────────────────────────────────────────── */

function FamilyGroupSection({ title, members, currentUserId, inverse = false }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{title}</span>
        <div className="h-px flex-1 bg-border/60" />
        <span className="text-[11px] tabular-nums text-muted">{members.length}</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((member, index) => (
          <FamilyMemberCard
            key={member._id || member.id || resolveMemberProfileId(member) || `${title}-${index}`}
            member={member}
            currentUserId={currentUserId}
            inverse={inverse}
          />
        ))}
      </div>
    </div>
  );
}

/* ── FamilyMemberCard ────────────────────────────────────────────────────── */

function FamilyMemberCard({ member, currentUserId, inverse }) {
  const { t } = useI18n();
  const profileId = resolveMemberProfileId(member);
  const isCurrentUser = profileId && profileId === currentUserId;
  const name = member?.name || EMPTY;
  const initial = String(name).trim().charAt(0).toUpperCase();

  const inner = (
    <div className={`group flex items-center gap-3 rounded-2xl border p-3.5 transition-all duration-150
      ${isCurrentUser
        ? 'border-primary/30 bg-primary/8'
        : 'border-border bg-surface hover:border-primary/30 hover:shadow-sm'
      }`}
    >
      {/* avatar */}
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors
        ${isCurrentUser
          ? 'bg-primary text-white'
          : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'
        }`}
      >
        {member?.avatar?.url
          ? <img src={member.avatar.url} alt="" className="h-9 w-9 rounded-full object-cover" />
          : initial
        }
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-semibold transition-colors
          ${isCurrentUser ? 'text-primary' : 'text-heading group-hover:text-primary'}`}>
          {name}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {member?.relationRole && <Badge>{member.relationRole}</Badge>}
          {inverse && <Badge variant="secondary">{t('userDetails.family.inverseLink')}</Badge>}
        </div>
        {member?.notes && (
          <p className="mt-1 line-clamp-1 text-xs text-muted">{member.notes}</p>
        )}
      </div>

      {profileId && !isCurrentUser && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-border transition-colors group-hover:text-primary" />
      )}
    </div>
  );

  if (profileId && !isCurrentUser) {
    return (
      <Link to={`/dashboard/users/${profileId}`} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
        {inner}
      </Link>
    );
  }

  return inner;
}

/* ── helpers (unchanged logic) ───────────────────────────────────────────── */

function buildFamilyGroups(user, t) {
  return [
    { key: 'parents', title: t('userDetails.family.sections.parents'), members: [user.father, user.mother].filter(Boolean), inverse: false },
    { key: 'spouse', title: t('userDetails.family.sections.spouse'), members: [user.spouse].filter(Boolean), inverse: false },
    { key: 'siblings', title: t('userDetails.family.sections.siblings'), members: Array.isArray(user.siblings) ? user.siblings : [], inverse: false },
    { key: 'children', title: t('userDetails.family.sections.children'), members: Array.isArray(user.children) ? user.children : [], inverse: false },
    { key: 'other', title: t('userDetails.family.sections.extended'), members: Array.isArray(user.familyMembers) ? user.familyMembers : [], inverse: false },
    { key: 'inverse', title: t('userDetails.family.sections.inverse'), members: Array.isArray(user.inverseFamily) ? user.inverseFamily : [], inverse: true },
  ];
}

function resolveMemberProfileId(member) {
  if (!member) return null;
  const raw =
    member.userId != null
      ? typeof member.userId === 'object'
        ? member.userId._id ?? member.userId.id
        : member.userId
      : member._id || member.id;
  return raw != null ? String(raw) : null;
}

function countFamilyMembers(user) {
  return (
    (user.father ? 1 : 0) +
    (user.mother ? 1 : 0) +
    (user.spouse ? 1 : 0) +
    (Array.isArray(user.siblings) ? user.siblings.length : 0) +
    (Array.isArray(user.children) ? user.children.length : 0) +
    (Array.isArray(user.familyMembers) ? user.familyMembers.length : 0) +
    (Array.isArray(user.inverseFamily) ? user.inverseFamily.length : 0)
  );
}

function buildWhatsAppUrl(rawPhone) {
  const p = normalizePhoneNumber(rawPhone);
  return p ? `https://wa.me/${p}` : null;
}

function buildCallUrl(rawPhone) {
  const p = normalizePhoneNumber(rawPhone);
  return p ? `tel:${p}` : null;
}

function normalizePhoneNumber(rawPhone) {
  if (!rawPhone) return null;
  const asciiPhone = toAsciiDigits(rawPhone);
  const digits = asciiPhone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('201')) return `+${digits}`;
  if (digits.startsWith('20')) return `+${digits}`;
  if (digits.startsWith('0')) return `+2${digits}`;
  if (digits.startsWith('1') && digits.length === 10) return `+20${digits}`;
  return `+${digits}`;
}

function toAsciiDigits(value) {
  return String(value).split('').map((char) => {
    const code = char.charCodeAt(0);
    if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
    if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
    return char;
  }).join('').trim();
}

function UserDetailsSkeleton() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-52 w-full" />
      <Skeleton className="h-14 w-full" />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Skeleton className="h-72 w-full xl:col-span-2" />
        <Skeleton className="h-72 w-full xl:col-span-1" />
      </div>
    </div>
  );
}