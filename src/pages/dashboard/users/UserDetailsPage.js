import { useState } from 'react';
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
import EmptyState from '../../../components/ui/EmptyState';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import TextArea from '../../../components/ui/TextArea';
import UserSearchSelect from '../../../components/UserSearchSelect';
import {
  Edit, Lock, Unlock, UserCircle, Phone, Mail, MapPin, Calendar,
  Tag, Users as UsersIcon, Shield, Plus, ExternalLink, User,
} from 'lucide-react';
import { formatDate, GENDER_LABELS, ROLE_LABELS } from '../../../utils/formatters';
import toast from 'react-hot-toast';

/* ─────────────────────── inline styles ─────────────────────── */
const styles = `
  /* ── Animations ── */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeScale {
    from { opacity: 0; transform: scale(0.97); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes pulseRing {
    0%, 100% { box-shadow: 0 0 0 0 var(--color-primary, #6366f1)22; }
    50%      { box-shadow: 0 0 0 6px var(--color-primary, #6366f1)00; }
  }

  .ud-page { animation: slideUp .35s ease-out both; }

  /* stagger children */
  .ud-stagger > * {
    animation: fadeScale .3s ease-out both;
  }
  .ud-stagger > *:nth-child(1) { animation-delay: .04s; }
  .ud-stagger > *:nth-child(2) { animation-delay: .08s; }
  .ud-stagger > *:nth-child(3) { animation-delay: .12s; }
  .ud-stagger > *:nth-child(4) { animation-delay: .16s; }
  .ud-stagger > *:nth-child(5) { animation-delay: .20s; }
  .ud-stagger > *:nth-child(6) { animation-delay: .24s; }
  .ud-stagger > *:nth-child(7) { animation-delay: .28s; }
  .ud-stagger > *:nth-child(8) { animation-delay: .32s; }

  /* ── Header card ── */
  .ud-header-card {
    position: relative;
    overflow: hidden;
  }
  .ud-header-card::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: .03;
    pointer-events: none;
    background:
      radial-gradient(circle at 15% 50%, var(--color-primary, #6366f1), transparent 50%),
      radial-gradient(circle at 85% 20%, var(--color-primary, #6366f1), transparent 40%);
  }

  /* avatar ring pulse for current user */
  .ud-avatar-ring {
    position: relative;
  }
  .ud-avatar-ring::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 9999px;
    border: 2px solid var(--color-primary, #6366f1);
    opacity: .25;
    animation: pulseRing 2.5s ease-in-out infinite;
  }

  /* ── Info rows ── */
  .ud-info-row {
    display: flex;
    align-items: flex-start;
    gap: .75rem;
    padding: .625rem .75rem;
    border-radius: .625rem;
    transition: background .2s ease, transform .15s ease;
  }
  .ud-info-row:hover {
    background: var(--color-muted, #94a3b8)08;
    transform: translateX(-2px);
  }

  /* ── Family tree ── */
  .ud-tree-connector {
    width: 2px;
    height: 1.75rem;
    margin: .25rem auto;
    background: linear-gradient(
      to bottom,
      var(--color-border, #e2e8f0),
      var(--color-border, #e2e8f0) 60%,
      transparent
    );
    border-radius: 1px;
  }

  .ud-family-node {
    transition: transform .2s ease, box-shadow .2s ease;
  }
  .ud-family-node:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px -2px rgba(0,0,0,.08);
  }

  .ud-family-node-current {
    position: relative;
  }
  .ud-family-node-current::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: .875rem;
    border: 2px solid var(--color-primary, #6366f1);
    opacity: .15;
    pointer-events: none;
  }

  /* ── Section labels ── */
  .ud-section-label {
    display: inline-flex;
    align-items: center;
    gap: .375rem;
    font-size: .6875rem;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    padding: .25rem .75rem;
    border-radius: 9999px;
    background: var(--color-muted, #94a3b8)0d;
    color: var(--color-muted, #94a3b8);
    margin-bottom: .75rem;
  }

  /* ── Lock banner ── */
  .ud-lock-banner {
    display: flex;
    align-items: center;
    gap: .75rem;
    animation: fadeScale .3s ease-out .15s both;
  }
  .ud-lock-banner svg { flex-shrink: 0; }

  /* ── Dropdown ── */
  .ud-dropdown {
    animation: fadeScale .15s ease-out;
    backdrop-filter: blur(8px);
  }

  /* ── Skeleton loading ── */
  .ud-skeleton-group {
    animation: slideUp .3s ease-out both;
  }
`;

/* ═══════════════════════ MAIN PAGE ═══════════════════════ */

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

  /* ── loading state ── */
  if (isLoading) {
    return (
      <div className="ud-skeleton-group space-y-5 max-w-5xl mx-auto">
        <style>{styles}</style>
        <Skeleton className="h-7 w-56 rounded-lg" />
        <div className="rounded-2xl overflow-hidden">
          <Skeleton className="h-36 w-full" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    {
      label: 'المعلومات الشخصية',
      content: <PersonalInfoTab user={user} />,
    },
    {
      label: 'العائلة',
      content: (
        <FamilyTab
          user={user}
          hasPermission={hasPermission}
          queryClient={queryClient}
          invalidateUser={() => queryClient.invalidateQueries({ queryKey: ['users', id] })}
        />
      ),
    },
  ];

  return (
    <div className="ud-page">
      <style>{styles}</style>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs items={[
          { label: 'لوحة التحكم', href: '/dashboard' },
          { label: 'المستخدمون', href: '/dashboard/users' },
          { label: user.fullName },
        ]} />

        {/* ── Header Card ── */}
        <Card className="ud-header-card">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              {/* Identity cluster */}
              <div className="flex items-center gap-4">
                <div className="ud-avatar-ring relative flex-shrink-0">
                  {user.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt=""
                      className="w-[4.5rem] h-[4.5rem] rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCircle className="w-9 h-9 text-primary" />
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-heading leading-tight tracking-tight">
                    {user.fullName}
                  </h1>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="primary">{ROLE_LABELS[user.role]}</Badge>
                    <Badge variant={user.isLocked ? 'danger' : 'success'}>
                      {user.isLocked ? 'مغلق' : 'نشط'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap self-start sm:self-center">
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
                  <Button
                    variant="outline" size="sm" icon={Unlock}
                    onClick={() => unlockMutation.mutate()}
                    loading={unlockMutation.isPending}
                  >
                    فتح
                  </Button>
                )}
              </div>
            </div>

            {/* Lock banner */}
            {user.isLocked && user.lockReason && (
              <div className="ud-lock-banner mt-5 bg-danger-light border border-danger/20 rounded-xl p-3.5 text-sm text-danger">
                <Lock className="w-4 h-4" />
                <div>
                  <strong className="font-semibold">سبب القفل:</strong>{' '}
                  <span className="opacity-90">{user.lockReason}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ── Tabs ── */}
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}

/* ═══════════════════ PERSONAL INFO TAB ═══════════════════ */

function PersonalInfoTab({ user }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 ud-stagger">
      {/* Basic data */}
      <Card>
        <CardHeader title="البيانات الأساسية" />
        <div className="space-y-0.5 -mx-1">
        
          <InfoRow icon={Calendar} label="تاريخ الميلاد" value={formatDate(user.birthDate)} />
          <InfoRow icon={UserCircle} label="الجنس" value={GENDER_LABELS[user.gender]} />
          <InfoRow icon={UserCircle} label="الفئة العمرية" value={user.ageGroup} />
          <InfoRow icon={Phone} label="الهاتف الأساسي" value={user.phonePrimary} dir="ltr" />
          {user.phoneSecondary && (
            <InfoRow icon={Phone} label="الهاتف الثانوي" value={user.phoneSecondary} dir="ltr" />
          )}
          {user.whatsappNumber && (
            <InfoRow icon={Phone} label="واتساب" value={user.whatsappNumber} dir="ltr" />
          )}
          {user.email && (
            <InfoRow icon={Mail} label="البريد الإلكتروني" value={user.email} dir="ltr" />
          )}
          {user.nationalId && (
            <InfoRow icon={Shield} label="الرقم القومي" value={user.nationalId} dir="ltr" />
          )}
        </div>
      </Card>

      {/* Address & extras */}
      <Card>
        <CardHeader title="العنوان والمعلومات الإضافية" />
        <div className="space-y-0.5 -mx-1">
          {user.address && (
            <InfoRow
              icon={MapPin}
              label="العنوان"
              value={[user.address.governorate, user.address.city, user.address.street, user.address.details]
                .filter(Boolean)
                .join('، ')}
            />
          )}
          {user.familyName && <InfoRow icon={UsersIcon} label="اسم العائلة" value={user.familyName} />}
          {user.notes && <InfoRow icon={UserCircle} label="ملاحظات" value={user.notes} />}
          {user.tags?.length > 0 && (
            <div className="ud-info-row">
              <Tag className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-muted block mb-1.5">الوسوم</span>
                <div className="flex flex-wrap gap-1.5">
                  {user.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Custom details */}
      {user.customDetails && typeof user.customDetails === 'object' && Object.keys(user.customDetails).length > 0 && (
        <Card className="lg:col-span-2">
          <CardHeader title="تفاصيل مخصصة" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 -mx-1">
            {Object.entries(user.customDetails).map(([key, value]) => (
              <InfoRow key={key} icon={Tag} label={key} value={value || '—'} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════ FAMILY TREE NODE ═══════════════════ */

function FamilyTreeNode({ member, isCurrentUser, isInverse, avatarUrl }) {
  const uid = member?.userId != null
    ? (typeof member.userId === 'object' ? (member.userId._id ?? member.userId?.id) : member.userId)
    : null;
  const profileId = uid != null ? String(uid) : null;
  const name = member?.name || '—';

  const nodeContent = (
    <div
      className={`
        ud-family-node flex items-center gap-3 p-3.5 rounded-xl border min-w-0 w-[270px]
        ${isCurrentUser
          ? 'ud-family-node-current bg-primary/8 border-primary/30 shadow-sm'
          : 'bg-surface-alt border-border hover:border-primary/40 hover:bg-surface'}
      `}
    >
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-11 h-11 rounded-full overflow-hidden flex items-center justify-center
        ${isCurrentUser ? 'bg-primary/15' : 'bg-muted/10'}
      `}>
        {avatarUrl && isCurrentUser ? (
          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className={`w-5 h-5 ${isCurrentUser ? 'text-primary' : 'text-muted'}`} />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className={`font-semibold text-sm truncate leading-tight ${isCurrentUser ? 'text-primary' : 'text-heading'}`}>
          {name}
        </p>
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          {member?.relationRole && (
            <span className="text-xs text-muted leading-none">{member.relationRole}</span>
          )}
          {isInverse && (
            <Badge variant="default" className="text-[10px] font-normal text-muted leading-none">
              من الطرف الآخر
            </Badge>
          )}
        </div>
        {member?.notes && (
          <p className="text-xs text-muted/70 mt-1 truncate leading-snug" title={member.notes}>
            {member.notes}
          </p>
        )}
      </div>

      {/* Link icon */}
      {profileId && !isCurrentUser && (
        <Link
          to={`/dashboard/users/${profileId}`}
          className="flex-shrink-0 p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors"
          title="عرض الملف"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      )}
    </div>
  );

  if (profileId && !isCurrentUser) {
    return <Link to={`/dashboard/users/${profileId}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl">{nodeContent}</Link>;
  }
  return nodeContent;
}

/* ═══════════════════ TREE SECTION ═══════════════════ */

function TreeSection({ title, nodes, renderNode }) {
  if (!nodes?.length) return null;
  return (
    <div>
      {title && (
        <div className="ud-section-label">{title}</div>
      )}
      <div className="flex flex-wrap gap-3 ud-stagger">
        {nodes.map((node, i) => (
          <div key={node._id || node.userId || i}>
            {renderNode ? renderNode(node, i) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════ FAMILY TREE ═══════════════════ */

function FamilyTree({ user }) {
  const hasParents = user.father || user.mother;
  const hasSpouse = !!user.spouse;
  const hasSiblings = user.siblings?.length > 0;
  const hasChildren = user.children?.length > 0;
  const hasOther = user.familyMembers?.length > 0;
  const hasInverse = user.inverseFamily?.length > 0;
  const hasAny = hasParents || hasSpouse || hasSiblings || hasChildren || hasOther || hasInverse;

  if (!hasAny) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="لا توجد بيانات عائلة مسجلة"
        description="يمكنك إضافة أفراد العائلة باستخدام الزر أعلاه إذا كانت لديك الصلاحية."
      />
    );
  }

  return (
    <div className="family-tree space-y-2" dir="rtl">
      {/* Generation 1: Parents */}
      {hasParents && (
        <div className="flex flex-col items-center">
          <TreeSection
            title="الوالدان"
            nodes={[user.father, user.mother].filter(Boolean)}
            renderNode={(m) => <FamilyTreeNode key={m._id} member={m} />}
          />
          <div className="ud-tree-connector" aria-hidden />
        </div>
      )}

      {/* Generation 2: Current user (focus) */}
      <div className="flex flex-col items-center">
        <FamilyTreeNode
          member={{ name: user.fullName, relationRole: 'صاحب الملف' }}
          isCurrentUser
          avatarUrl={user.avatar?.url}
        />
        {(hasSpouse || hasSiblings || hasChildren) && (
          <div className="ud-tree-connector" aria-hidden />
        )}
      </div>

      {/* Same generation: Spouse + Siblings */}
      {(hasSpouse || hasSiblings) && (
        <div className="flex flex-col items-center">
          <TreeSection
            title={hasSpouse && hasSiblings ? 'الزوج/الزوجة والإخوة' : hasSpouse ? 'الزوج/الزوجة' : 'الإخوة'}
            nodes={[user.spouse, ...(user.siblings || [])].filter(Boolean)}
            renderNode={(m) => <FamilyTreeNode key={m._id} member={m} />}
          />
          {hasChildren && <div className="ud-tree-connector" aria-hidden />}
        </div>
      )}

      {/* Generation 3: Children */}
      {hasChildren && (
        <div className="flex flex-col items-center">
          <TreeSection
            title="الأبناء"
            nodes={user.children}
            renderNode={(m) => <FamilyTreeNode key={m._id} member={m} />}
          />
        </div>
      )}

      {/* Extended family — visual separator */}
      {(hasOther || hasInverse) && (
        <div className="pt-4 mt-2 border-t border-border/50 space-y-6">
          {hasOther && (
            <div className="flex flex-col items-center">
              <TreeSection
                title="أقارب آخرون"
                nodes={user.familyMembers}
                renderNode={(m) => <FamilyTreeNode key={m._id} member={m} />}
              />
            </div>
          )}
          {hasInverse && (
            <div className="flex flex-col items-center">
              <TreeSection
                title="مرتبط من جهة الطرف الآخر"
                nodes={user.inverseFamily}
                renderNode={(m) => <FamilyTreeNode key={m._id || m.userId} member={m} isInverse />}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ FAMILY TAB ═══════════════════ */

function FamilyTab({ user, hasPermission, queryClient, invalidateUser }) {
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

  const linkFamilyMutation = useMutation({
    mutationFn: (data) => usersApi.linkFamily(user._id || user.id, data),
    onSuccess: () => {
      toast.success('تم إضافة فرد العائلة بنجاح');
      setAddModalOpen(false);
      setAddForm({ relationRole: '', name: '', targetPhone: '', notes: '' });
      setSelectedUser(null);
      setAddErrors({});
      invalidateUser();
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      if (normalized.code === 'VALIDATION_ERROR' && normalized.details) {
        setAddErrors(normalized.details);
      }
      toast.error(normalized.message);
    },
  });

  const canAdd = hasPermission('USERS_FAMILY_LINK');
  const canEdit = hasPermission('USERS_UPDATE');

  const handleAddFamilySubmit = async () => {
    const relationRoleValue = addForm.relationRole?.trim();
    if (!relationRoleValue) {
      setAddErrors({ relationRole: 'وصف صلة القرابة مطلوب' });
      return;
    }
    setAddErrors({});
    const role = relationRoles.find((r) => r.label === relationRoleValue);
    const relation = role ? role.relation : 'other';
    if (!role && canEdit) {
      try {
        await usersApi.createRelationRole(relationRoleValue);
        queryClient.invalidateQueries({ queryKey: ['users', 'relation-roles'] });
      } catch (err) {
        toast.error(normalizeApiError(err).message);
        return;
      }
    }
    const nameToSend = selectedUser ? selectedUser.fullName : addForm.name.trim();
    const phoneToSend = selectedUser ? selectedUser.phonePrimary : addForm.targetPhone.trim();
    linkFamilyMutation.mutate({
      relation,
      relationRole: relationRoleValue,
      name: nameToSend || undefined,
      targetPhone: phoneToSend || undefined,
      notes: addForm.notes.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader
        title="أفراد العائلة"
        action={
          <div className="flex gap-2 flex-wrap">
            {canAdd && (
              <Button variant="outline" size="sm" icon={Plus} onClick={() => setAddModalOpen(true)}>
                إضافة فرد عائلة
              </Button>
            )}
            {canEdit && (
              <Link to={`/dashboard/users/${user._id || user.id}/edit`}>
                <Button variant="outline" size="sm" icon={Edit}>
                  تعديل بيانات العائلة
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {user.familyName && <InfoRow icon={UsersIcon} label="اسم العائلة" value={user.familyName} />}


      <div className="py-2">
        <FamilyTree user={user} />
      </div>

      {/* ── Add Modal ── */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setAddErrors({}); }}
        title="إضافة فرد عائلة"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddModalOpen(false)}>إلغاء</Button>
            <Button loading={linkFamilyMutation.isPending} onClick={handleAddFamilySubmit}>
              إضافة
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Relation role combobox */}
          <div className="relative">
            <label className="block text-sm font-medium text-heading mb-1.5">
              وصف صلة القرابة <span className="text-danger mr-1">*</span>
            </label>
            <input
              type="text"
              value={addForm.relationRole}
              onChange={(e) => {
                setAddForm((f) => ({ ...f, relationRole: e.target.value }));
                setRelationRoleDropdownOpen(true);
                if (addErrors.relationRole) setAddErrors((err) => ({ ...err, relationRole: undefined }));
              }}
              onFocus={() => setRelationRoleDropdownOpen(true)}
              onBlur={() => setTimeout(() => setRelationRoleDropdownOpen(false), 200)}
              placeholder="اختر من القائمة أو اكتب وصفاً جديداً (مثال: الأب، عم، خال...)"
              className={`input-base w-full transition-colors ${addErrors.relationRole ? 'border-danger focus:border-danger' : ''}`}
            />
            {addErrors.relationRole && (
              <p className="text-xs text-danger mt-1.5 flex items-center gap-1">
                <span className="inline-block w-1 h-1 rounded-full bg-danger" />
                {addErrors.relationRole}
              </p>
            )}
            {relationRoleDropdownOpen && relationRoles.length > 0 && (
              <ul
                className="ud-dropdown absolute z-20 mt-1.5 w-full max-h-48 overflow-auto rounded-xl border border-border shadow-xl py-1"
                style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
                role="listbox"
              >
                {relationRoles
                  .filter(
                    (r) =>
                      !addForm.relationRole ||
                      r.label.toLowerCase().includes(addForm.relationRole.trim().toLowerCase())
                  )
                  .slice(0, 20)
                  .map((r) => (
                    <li
                      key={r.id || r.label}
                      role="option"
                      className="px-3.5 py-2.5 text-sm cursor-pointer rounded-lg mx-1 transition-colors hover:bg-muted/10 focus:bg-muted/10"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setAddForm((f) => ({ ...f, relationRole: r.label }));
                        setRelationRoleDropdownOpen(false);
                      }}
                    >
                      {r.label}
                    </li>
                  ))}
                {addForm.relationRole?.trim() &&
                  !relationRoles.some(
                    (r) => r.label.trim().toLowerCase() === addForm.relationRole.trim().toLowerCase()
                  ) && (
                    <li
                      role="option"
                      className="px-3.5 py-2.5 text-sm text-muted border-t border-border/50 mx-1 mt-1"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setRelationRoleDropdownOpen(false);
                      }}
                    >
                      إضافة «{addForm.relationRole.trim()}» للقائمة عند الحفظ
                    </li>
                  )}
              </ul>
            )}
          </div>

          <UserSearchSelect
            label="ربط بمستخدم مسجل (اختياري)"
            value={selectedUser}
            onChange={(u) => {
              setSelectedUser(u);
              setAddForm((f) => ({
                ...f,
                name: u ? u.fullName : '',
                targetPhone: u ? (u.phonePrimary || '') : '',
              }));
            }}
            excludeUserId={user._id || user.id}
          />

          <Input
            label="الاسم (أو اكتبه يدوياً إن لم تربط بمستخدم)"
            value={addForm.name}
            onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="رقم الهاتف (لربط أو اكتبه يدوياً)"
            dir="ltr"
            className="text-left"
            value={addForm.targetPhone}
            onChange={(e) => setAddForm((f) => ({ ...f, targetPhone: e.target.value }))}
          />
          <TextArea
            label="ملاحظات"
            value={addForm.notes}
            onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </Card>
  );
}

/* ═══════════════════ INFO ROW ═══════════════════ */

function InfoRow({ icon: Icon, label, value, dir }) {
  return (
    <div className="ud-info-row">
      <div className="w-8 h-8 rounded-lg bg-muted/8 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-muted" />
      </div>
      <div className="min-w-0">
        <span className="text-xs text-muted leading-none">{label}</span>
        <p className={`text-sm font-medium text-heading mt-0.5 ${dir === 'ltr' ? 'direction-ltr text-left' : ''}`}>
          {value || '---'}
        </p>
      </div>
    </div>
  );
}