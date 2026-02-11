import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Eye,
  Edit,
  Lock,
  Unlock,
  Trash2,
  Users,
  UserCheck,
  UserX,
  ShieldCheck,
} from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import { useI18n } from '../../../i18n/i18n';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Table, { RowActions } from '../../../components/ui/Table';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import toast from 'react-hot-toast';
import { AGE_GROUPS, formatDate, getGenderLabel, getRoleLabel } from '../../../utils/formatters';

export default function UsersListPage() {
  const { hasPermission } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({ fullName: '', ageGroup: '', gender: '', role: '' });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const queryParams = {
    limit,
    sort: 'createdAt',
    order: 'desc',
    ...(cursor && { cursor }),
    ...(filters.fullName && { fullName: filters.fullName }),
    ...(filters.ageGroup && { ageGroup: filters.ageGroup }),
    ...(filters.gender && { gender: filters.gender }),
    ...(filters.role && { role: filters.role }),
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', queryParams],
    queryFn: async () => {
      const { data } = await usersApi.list(queryParams);
      return data;
    },
    staleTime: 30000,
    keepPreviousData: true,
  });

  const users = useMemo(() => data?.data ?? [], [data?.data]);
  const meta = data?.meta || null;

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
    setCursorStack([null]);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ fullName: '', ageGroup: '', gender: '', role: '' });
    setCursor(null);
    setCursorStack([null]);
  }, []);

  const handleNext = useCallback(() => {
    if (meta?.nextCursor) {
      setCursorStack((prev) => [...prev, meta.nextCursor]);
      setCursor(meta.nextCursor);
    }
  }, [meta?.nextCursor]);

  const handlePrev = useCallback(() => {
    setCursorStack((prev) => {
      const newStack = prev.slice(0, -1);
      setCursor(newStack[newStack.length - 1] || null);
      return newStack;
    });
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget._id || deleteTarget.id);
      toast.success('User deleted successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean), [filters]);
  const lockedCount = useMemo(() => users.filter((row) => row.isLocked).length, [users]);
  const activeCount = users.length - lockedCount;

  const roleOptions = [
    { value: 'SUPER_ADMIN', label: getRoleLabel('SUPER_ADMIN') },
    { value: 'ADMIN', label: getRoleLabel('ADMIN') },
    { value: 'USER', label: getRoleLabel('USER') },
  ];

  const genderOptions = [
    { value: 'male', label: getGenderLabel('male') },
    { value: 'female', label: getGenderLabel('female') },
  ];

  const columns = useMemo(
    () => [
      {
        key: 'fullName',
        label: 'Name',
        render: (row) => (
          <div className="flex items-center gap-3">
            {row.avatar?.url ? (
              <img src={row.avatar.url} alt="" className="h-9 w-9 rounded-full border border-border object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                {getInitial(row.fullName)}
              </div>
            )}
            <div>
              <p className="font-medium text-heading">{row.fullName || t('common.placeholder.empty')}</p>
              <p className="text-xs text-muted direction-ltr text-left">{row.phonePrimary || t('common.placeholder.empty')}</p>
            </div>
          </div>
        ),
        onClick: (row) => navigate(`/dashboard/users/${row._id}`),
        cellClassName: 'cursor-pointer',
      },
      {
        key: 'phonePrimary',
        label: 'Phone',
        render: (row) => <span className="direction-ltr text-left">{row.phonePrimary || t('common.placeholder.empty')}</span>,
      },
      {
        key: 'role',
        label: 'Role',
        render: (row) => <Badge variant="primary">{getRoleLabel(row.role)}</Badge>,
      },
      {
        key: 'ageGroup',
        label: 'Age group',
        render: (row) => row.ageGroup || t('common.placeholder.empty'),
      },
      {
        key: 'gender',
        label: 'Gender',
        render: (row) => getGenderLabel(row.gender),
      },
      {
        key: 'createdAt',
        label: 'Joined',
        render: (row) => formatDate(row.createdAt),
      },
      {
        key: 'isLocked',
        label: 'Status',
        render: (row) => (
          <Badge variant={row.isLocked ? 'danger' : 'success'}>
            {row.isLocked ? t('common.status.locked') : t('common.status.active')}
          </Badge>
        ),
      },
      {
        key: 'actions',
        label: '',
        cellClassName: 'w-10',
        render: (row) => (
          <RowActions
            actions={[
              { label: t('common.actions.view'), icon: Eye, onClick: () => navigate(`/dashboard/users/${row._id}`) },
              ...(hasPermission('USERS_UPDATE')
                ? [{ label: t('common.actions.edit'), icon: Edit, onClick: () => navigate(`/dashboard/users/${row._id}/edit`) }]
                : []),
              ...(hasPermission('USERS_LOCK') && !row.isLocked
                ? [{ label: t('common.actions.lock'), icon: Lock, onClick: () => navigate(`/dashboard/users/${row._id}/lock`) }]
                : []),
              ...(hasPermission('USERS_UNLOCK') && row.isLocked
                ? [{ label: t('common.actions.unlock'), icon: Unlock, onClick: () => navigate(`/dashboard/users/${row._id}/unlock`) }]
                : []),
              ...(hasPermission('USERS_DELETE')
                ? [{ divider: true }, { label: t('common.actions.delete'), icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) }]
                : []),
            ]}
          />
        ),
      },
    ],
    [hasPermission, navigate, t]
  );

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumbs items={[{ label: t('shared.dashboard'), href: '/dashboard' }, { label: t('shared.users') }]} />

      <Card padding={false} className="relative overflow-hidden border-primary/20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="relative p-6 lg:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-heading">{t('shared.users')}</h1>
              <p className="mt-1 text-sm text-muted">Manage accounts, permissions, and access from one place.</p>
            </div>
            {hasPermission('USERS_CREATE') && (
              <Link to="/dashboard/users/new">
                <Button icon={Plus}>Add User</Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard icon={Users} label="Users on this page" value={users.length} />
            <StatCard icon={UserCheck} label="Active accounts" value={activeCount} tone="success" />
            <StatCard icon={UserX} label="Locked accounts" value={lockedCount} tone="danger" />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Filters</h2>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SearchInput
            value={filters.fullName}
            onChange={(v) => handleFilterChange('fullName', v)}
            placeholder="Search by user name"
          />
          <Select
            options={AGE_GROUPS.map((g) => ({ value: g, label: g }))}
            value={filters.ageGroup}
            onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
            placeholder="Age group"
            containerClassName="!mb-0"
          />
          <Select
            options={genderOptions}
            value={filters.gender}
            onChange={(e) => handleFilterChange('gender', e.target.value)}
            placeholder="Gender"
            containerClassName="!mb-0"
          />
          <Select
            options={roleOptions}
            value={filters.role}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            placeholder="Role"
            containerClassName="!mb-0"
          />
        </div>
      </Card>

      <Card padding={false} className="overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-heading">User Directory</h2>
            <span className="text-sm text-muted">{meta?.count ?? users.length} results</span>
          </div>
        </div>

        <div className="p-2 sm:p-3">
          <Table
            columns={columns}
            data={users}
            loading={isLoading}
            emptyTitle="No users found"
            emptyDescription={hasActiveFilters ? 'Try changing or clearing filters.' : 'Add your first user to get started.'}
            emptyIcon={Users}
          />
        </div>

        <div className="border-t border-border px-4 pb-4">
          <Pagination
            meta={meta}
            onLoadMore={handleNext}
            onPrev={handlePrev}
            cursors={cursorStack}
            loading={isLoading}
          />
        </div>
      </Card>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>
              {t('common.actions.delete')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          Are you sure you want to delete <strong className="text-heading">{deleteTarget?.fullName}</strong>? This
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

function getInitial(name) {
  if (!name) return 'U';
  return String(name).trim().charAt(0).toUpperCase();
}

function StatCard({ icon: Icon, label, value, tone = 'default' }) {
  const toneClass = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-heading';

  return (
    <div className="rounded-xl border border-border/80 bg-surface/90 px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
