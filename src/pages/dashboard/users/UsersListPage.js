import { useState, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Eye, Edit, Lock, Unlock, Trash2, Users } from 'lucide-react';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import Button from '../../../components/ui/Button';
import Table, { RowActions } from '../../../components/ui/Table';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import Pagination from '../../../components/ui/Pagination';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Badge from '../../../components/ui/Badge';
import Modal from '../../../components/ui/Modal';
import toast from 'react-hot-toast';
import { ROLE_LABELS, GENDER_LABELS, AGE_GROUPS } from '../../../utils/formatters';

export default function UsersListPage() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ fullName: '', ageGroup: '', gender: '', role: '' });
  const [cursor, setCursor] = useState(null);
  const [cursorStack, setCursorStack] = useState([null]);
  const [limit] = useState(20);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const abortRef = useRef(null);

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
    queryFn: async ({ signal }) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const { data } = await usersApi.list(queryParams);
      return data;
    },
    staleTime: 30000,
    keepPreviousData: true,
  });

  const users = data?.data || [];
  const meta = data?.meta || null;

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCursor(null);
    setCursorStack([null]);
  }, []);

  const handleNext = () => {
    if (meta?.nextCursor) {
      setCursorStack((prev) => [...prev, meta.nextCursor]);
      setCursor(meta.nextCursor);
    }
  };

  const handlePrev = () => {
    setCursorStack((prev) => {
      const newStack = prev.slice(0, -1);
      setCursor(newStack[newStack.length - 1] || null);
      return newStack;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.remove(deleteTarget._id);
      toast.success('تم حذف المستخدم بنجاح');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'fullName',
      label: 'الاسم',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.avatar?.url ? (
            <img src={row.avatar.url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="font-medium text-heading">{row.fullName}</span>
        </div>
      ),
      // onClick to navigate to user details page
      onClick: (row) => navigate(`/dashboard/users/${row._id}`),
      cellClassName: 'cursor-pointer',
    },
    {
      key: 'phonePrimary',
      label: 'الهاتف',
      render: (row) => <span dir="ltr" className="text-left">{row.phonePrimary}</span>,
    },
    {
      key: 'role',
      label: 'الدور',
      render: (row) => <Badge variant="primary">{ROLE_LABELS[row.role] || row.role}</Badge>,
    },
    {
      key: 'ageGroup',
      label: 'الفئة العمرية',
      render: (row) => row.ageGroup || '---',
    },
    {
      key: 'gender',
      label: 'الجنس',
      render: (row) => GENDER_LABELS[row.gender] || '---',
    },
    {
      key: 'isLocked',
      label: 'الحالة',
      render: (row) => (
        <Badge variant={row.isLocked ? 'danger' : 'success'}>
          {row.isLocked ? 'مغلق' : 'نشط'}
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
            { label: 'عرض', icon: Eye, onClick: () => navigate(`/dashboard/users/${row._id}`) },
            ...(hasPermission('USERS_UPDATE')
              ? [{ label: 'تعديل', icon: Edit, onClick: () => navigate(`/dashboard/users/${row._id}/edit`) }]
              : []),
            ...(hasPermission('USERS_LOCK') && !row.isLocked
              ? [{ label: 'قفل', icon: Lock, onClick: () => navigate(`/dashboard/users/${row._id}/lock`) }]
              : []),
            ...(hasPermission('USERS_UNLOCK') && row.isLocked
              ? [{ label: 'فتح', icon: Unlock, onClick: () => navigate(`/dashboard/users/${row._id}/unlock`) }]
              : []),
            ...(hasPermission('USERS_DELETE')
              ? [{ divider: true }, { label: 'حذف', icon: Trash2, danger: true, onClick: () => setDeleteTarget(row) }]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[{ label: 'لوحة التحكم', href: '/dashboard' }, { label: 'المستخدمون' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-xl font-bold text-heading">المستخدمون</h1>
        {hasPermission('USERS_CREATE') && (
          <Link to="/dashboard/users/new">
            <Button icon={Plus}>إضافة مستخدم</Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SearchInput
          value={filters.fullName}
          onChange={(v) => handleFilterChange('fullName', v)}
          placeholder="بحث بالاسم..."
        />
        <Select
          options={AGE_GROUPS.map((g) => ({ value: g, label: g }))}
          value={filters.ageGroup}
          onChange={(e) => handleFilterChange('ageGroup', e.target.value)}
          placeholder="الفئة العمرية"
          containerClassName="!mb-0"
        />
        <Select
          options={[
            { value: 'male', label: 'ذكر' },
            { value: 'female', label: 'أنثى' },
          ]}
          value={filters.gender}
          onChange={(e) => handleFilterChange('gender', e.target.value)}
          placeholder="الجنس"
          containerClassName="!mb-0"
        />
        <Select
          options={[
            { value: 'SUPER_ADMIN', label: 'مدير النظام' },
            { value: 'ADMIN', label: 'مسؤول' },
            { value: 'USER', label: 'مستخدم' },
          ]}
          value={filters.role}
          onChange={(e) => handleFilterChange('role', e.target.value)}
          placeholder="الدور"
          containerClassName="!mb-0"
        />
      </div>

      <Table columns={columns} data={users} loading={isLoading} emptyTitle="لا يوجد مستخدمون" />

      <Pagination
        meta={meta}
        onLoadMore={handleNext}
        onPrev={handlePrev}
        cursors={cursorStack}
        loading={isLoading}
      />

      {/* Delete Confirm */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="تأكيد الحذف"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}>حذف</Button>
          </>
        }
      >
        <p className="text-sm text-muted">
          هل أنت متأكد من حذف المستخدم <strong className="text-heading">{deleteTarget?.fullName}</strong>؟
          سيتم تعليم الحساب كمحذوف.
        </p>
      </Modal>
    </div>
  );
}
