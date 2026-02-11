import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock3,
  Edit,
  ExternalLink,
  Lock,
  Mail,
  MapPin,
  Phone,
  Plus,
  Shield,
  Tag,
  Unlock,
  User,
  UserCircle,
  Users as UsersIcon,
} from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import { formatDate, getGenderLabel, getRoleLabel } from '../../../utils/formatters';
import Badge from '../../../components/ui/Badge';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import Skeleton from '../../../components/ui/Skeleton';
import Tabs from '../../../components/ui/Tabs';
import TextArea from '../../../components/ui/TextArea';
import UserSearchSelect from '../../../components/UserSearchSelect';
import toast from 'react-hot-toast';

const EMPTY = '---';

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
      toast.success('User account unlocked successfully.');
      refreshUser();
    },
    onError: (err) => toast.error(normalizeApiError(err).message),
  });

  if (isLoading) {
    return <UserDetailsSkeleton />;
  }

  if (!user) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="User not found"
        description="This profile could not be loaded or may have been removed."
      />
    );
  }

  const familyCount = countFamilyMembers(user);
  const tabs = [
    {
      label: 'Profile',
      content: <ProfileTab user={user} />,
    },
    {
      label: 'Family',
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
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs
        items={[
          { label: t('shared.dashboard'), href: '/dashboard' },
          { label: t('shared.users'), href: '/dashboard/users' },
          { label: user.fullName || EMPTY },
        ]}
      />

      <Card padding={false} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative p-6 lg:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              {user.avatar?.url ? (
                <img
                  src={user.avatar.url}
                  alt=""
                  className="h-20 w-20 rounded-2xl border border-border object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
                  <UserCircle className="h-11 w-11 text-primary" />
                </div>
              )}

              <div>
                <h1 className="text-2xl font-bold text-heading">{user.fullName || EMPTY}</h1>
                <p className="mt-1 text-sm text-muted direction-ltr text-left">{user.phonePrimary || EMPTY}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{getRoleLabel(user.role)}</Badge>
                  <Badge variant={user.isLocked ? 'danger' : 'success'}>
                    {user.isLocked ? t('common.status.locked') : t('common.status.active')}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
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

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <MiniStat label="Joined on" value={formatDate(user.createdAt)} icon={Clock3} />
            <MiniStat label="Last updated" value={formatDate(user.updatedAt)} icon={Calendar} />
            <MiniStat label="Family links" value={familyCount} icon={UsersIcon} />
          </div>

          {user.isLocked && user.lockReason && (
            <div className="mt-5 rounded-xl border border-danger/20 bg-danger-light p-3 text-sm text-danger">
              <span className="font-semibold">Lock reason:</span> {user.lockReason}
            </div>
          )}
        </div>
      </Card>

      <Tabs tabs={tabs} />
    </div>
  );
}

function ProfileTab({ user }) {
  const tags = Array.isArray(user.tags) ? user.tags : [];
  const customDetails =
    user.customDetails && typeof user.customDetails === 'object' ? Object.entries(user.customDetails) : [];

  const address =
    [user.address?.governorate, user.address?.city, user.address?.street, user.address?.details]
      .filter(Boolean)
      .join(', ') || EMPTY;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader title="Personal information" subtitle="Core identity and account details" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoItem icon={UserCircle} label="Full name" value={user.fullName} />
          <InfoItem icon={Shield} label="Role" value={getRoleLabel(user.role)} />
          <InfoItem icon={User} label="Gender" value={getGenderLabel(user.gender)} />
          <InfoItem icon={Calendar} label="Birth date" value={formatDate(user.birthDate)} />
          <InfoItem icon={User} label="Age group" value={user.ageGroup || EMPTY} />
          <InfoItem icon={Shield} label="National ID" value={user.nationalId || EMPTY} ltr />
        </div>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader title="Contact" subtitle="Primary communication channels" />
        <div className="space-y-3">
          <InfoItem icon={Phone} label="Primary phone" value={user.phonePrimary || EMPTY} ltr compact />
          <InfoItem icon={Phone} label="Secondary phone" value={user.phoneSecondary || EMPTY} ltr compact />
          <InfoItem icon={Phone} label="WhatsApp" value={user.whatsappNumber || EMPTY} ltr compact />
          <InfoItem icon={Mail} label="Email" value={user.email || EMPTY} ltr compact />
        </div>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader title="Address and notes" subtitle="Location and internal notes" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InfoItem icon={MapPin} label="Address" value={address} />
          <InfoItem icon={UsersIcon} label="Family name" value={user.familyName || EMPTY} />
          <InfoItem icon={User} label="Notes" value={user.notes || EMPTY} className="md:col-span-2" />
        </div>
      </Card>

      <Card className="xl:col-span-1">
        <CardHeader title="Tags" subtitle="Classification labels" />
        {tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">{EMPTY}</p>
        )}
      </Card>

      {customDetails.length > 0 && (
        <Card className="xl:col-span-3">
          <CardHeader title="Custom details" subtitle="Additional profile fields" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {customDetails.map(([key, value]) => (
              <InfoItem key={key} icon={Tag} label={key} value={value || EMPTY} compact />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function FamilyTab({ user, hasPermission, queryClient, onRefresh }) {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    relationRole: '',
    name: '',
    targetPhone: '',
    notes: '',
  });
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

  const familyGroups = useMemo(() => buildFamilyGroups(user), [user]);
  const hasAnyFamily = familyGroups.some((group) => group.members.length > 0);

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
      toast.success('Family member linked successfully.');
      handleCloseModal();
      onRefresh();
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      if (normalized.code === 'VALIDATION_ERROR' && normalized.details) {
        setAddErrors(normalized.details);
      }
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

    if (!relationRoleValue) {
      setAddErrors({ relationRole: 'Relation label is required.' });
      return;
    }

    if (!nameValue && !phoneValue) {
      setAddErrors({ targetPhone: 'Add a linked user, name, or phone number.' });
      return;
    }

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
    <Card className="space-y-5">
      <CardHeader
        title="Family network"
        subtitle="Linked members and relationship map"
        action={
          <div className="flex flex-wrap gap-2">
            {canAdd && (
              <Button variant="outline" size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
                Add family member
              </Button>
            )}
            {canEdit && (
              <Link to={`/dashboard/users/${user._id || user.id}/edit`}>
                <Button variant="outline" size="sm" icon={Edit}>
                  Edit profile
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {user.familyName && (
        <div className="rounded-xl border border-border bg-surface-alt/60 px-4 py-3 text-sm">
          <span className="text-muted">Family name:</span>
          <span className="ml-2 font-semibold text-heading">{user.familyName}</span>
        </div>
      )}

      {hasAnyFamily ? (
        <div className="space-y-5">
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
          title="No family members linked"
          description="Use the add action to attach relatives or linked profiles."
        />
      )}

      <Modal
        isOpen={addModalOpen}
        onClose={handleCloseModal}
        title="Add family member"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button loading={linkFamilyMutation.isPending} onClick={handleAddFamilySubmit}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-base">
              Relation label <span className="ml-1 text-danger">*</span>
            </label>
            <input
              type="text"
              value={addForm.relationRole}
              onChange={(e) => {
                setAddForm((prev) => ({ ...prev, relationRole: e.target.value }));
                setRelationRoleDropdownOpen(true);
                if (addErrors.relationRole) {
                  setAddErrors((prev) => ({ ...prev, relationRole: undefined }));
                }
              }}
              onFocus={() => setRelationRoleDropdownOpen(true)}
              onBlur={() => setTimeout(() => setRelationRoleDropdownOpen(false), 150)}
              placeholder="Choose existing role or type a new one"
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
            label="Link to an existing user (optional)"
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
            label="Name (optional if linked)"
            value={addForm.name}
            onChange={(e) => setAddForm((prev) => ({ ...prev, name: e.target.value }))}
            containerClassName="!mb-0"
          />

          <Input
            label="Phone number (optional if linked)"
            value={addForm.targetPhone}
            dir="ltr"
            className="text-left"
            onChange={(e) => {
              setAddForm((prev) => ({ ...prev, targetPhone: e.target.value }));
              if (addErrors.targetPhone) {
                setAddErrors((prev) => ({ ...prev, targetPhone: undefined }));
              }
            }}
            error={addErrors.targetPhone}
            containerClassName="!mb-0"
          />

          <TextArea
            label="Notes"
            value={addForm.notes}
            onChange={(e) => setAddForm((prev) => ({ ...prev, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </Card>
  );
}

function buildFamilyGroups(user) {
  return [
    {
      key: 'parents',
      title: 'Parents',
      members: [user.father, user.mother].filter(Boolean),
      inverse: false,
    },
    {
      key: 'spouse',
      title: 'Spouse',
      members: [user.spouse].filter(Boolean),
      inverse: false,
    },
    {
      key: 'siblings',
      title: 'Siblings',
      members: Array.isArray(user.siblings) ? user.siblings : [],
      inverse: false,
    },
    {
      key: 'children',
      title: 'Children',
      members: Array.isArray(user.children) ? user.children : [],
      inverse: false,
    },
    {
      key: 'other',
      title: 'Extended family',
      members: Array.isArray(user.familyMembers) ? user.familyMembers : [],
      inverse: false,
    },
    {
      key: 'inverse',
      title: 'Linked from other profiles',
      members: Array.isArray(user.inverseFamily) ? user.inverseFamily : [],
      inverse: true,
    },
  ];
}

function FamilyGroupSection({ title, members, currentUserId, inverse = false }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

function FamilyMemberCard({ member, currentUserId, inverse }) {
  const profileId = resolveMemberProfileId(member);
  const isCurrentUser = profileId && profileId === currentUserId;

  const content = (
    <div
      className={`rounded-xl border p-3 transition-all ${
        isCurrentUser
          ? 'border-primary/40 bg-primary/10'
          : 'border-border bg-surface-alt/40 hover:border-primary/30 hover:bg-surface'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
          {member?.avatar?.url ? (
            <img src={member.avatar.url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-heading">{member?.name || EMPTY}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {member?.relationRole && <Badge>{member.relationRole}</Badge>}
            {inverse && <Badge variant="secondary">Inverse link</Badge>}
          </div>
          {member?.notes && <p className="mt-1 line-clamp-2 text-xs text-muted">{member.notes}</p>}
        </div>

        {profileId && !isCurrentUser && (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-primary">
            <ExternalLink className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );

  if (profileId && !isCurrentUser) {
    return (
      <Link
        to={`/dashboard/users/${profileId}`}
        className="block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        {content}
      </Link>
    );
  }

  return content;
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
  const groups = buildFamilyGroups(user);
  return groups.reduce((total, group) => total + group.members.length, 0);
}

function UserDetailsSkeleton() {
  return (
    <div className="space-y-6">
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

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface/90 px-4 py-3">
      <div className="mb-1 flex items-center gap-2 text-muted">
        {Icon && <Icon className="h-4 w-4" />}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-heading">{value || EMPTY}</p>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value, ltr = false, compact = false, className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-surface-alt/60 p-3 ${className}`}>
      <div className={`flex items-start gap-3 ${compact ? 'items-center' : ''}`}>
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className={`mt-1 text-sm font-semibold text-heading ${ltr ? 'direction-ltr text-left' : ''}`}>
            {value || EMPTY}
          </p>
        </div>
      </div>
    </div>
  );
}