import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError, mapFieldErrors } from '../../../api/errors';
import { useAuth } from '../../../auth/auth.hooks';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
} from '../../../constants/permissions';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TextArea from '../../../components/ui/TextArea';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Skeleton from '../../../components/ui/Skeleton';
import UserSearchSelect from '../../../components/UserSearchSelect';
import toast from 'react-hot-toast';
import { Save, ArrowRight, Upload, Plus, Trash2 } from 'lucide-react';

const genderOptions = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
  { value: 'other', label: 'آخر' },
];

const roleOptions = [
  { value: 'USER', label: 'مستخدم' },
  { value: 'ADMIN', label: 'مسؤول' },
  { value: 'SUPER_ADMIN', label: 'مدير النظام' },
];

const normalizePermissionArray = (value) =>
  [...new Set((Array.isArray(value) ? value : []).filter(Boolean))];

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [customDetailsRows, setCustomDetailsRows] = useState([{ id: 1, key: '', value: '' }]);
  const fileInputRef = useRef(null);
  const nextCustomDetailId = useRef(2);
  const customDetailsInitializedFor = useRef(null);
  const pendingLinkByPhoneRef = useRef([]);

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await usersApi.getById(id);
      return data.data;
    },
  });

  const { data: savedKeysRes } = useQuery({
    queryKey: ['users', 'custom-detail-keys'],
    queryFn: async () => {
      const { data } = await usersApi.getCustomDetailKeys();
      return data.data;
    },
  });
  const savedKeys = Array.isArray(savedKeysRes) ? savedKeysRes : [];

  const { data: familyNamesRes } = useQuery({
    queryKey: ['users', 'family-names'],
    queryFn: async () => {
      const res = await usersApi.getFamilyNames();
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
  });
  const familyNames = Array.isArray(familyNamesRes) ? familyNamesRes : [];
  const [familyNameDropdownOpen, setFamilyNameDropdownOpen] = useState(false);
  const familyNameInputRef = useRef(null);
  const { data: houseNamesRes } = useQuery({
    queryKey: ['users', 'house-names'],
    queryFn: async () => {
      const res = await usersApi.getHouseNames();
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
  });
  const houseNames = Array.isArray(houseNamesRes) ? houseNamesRes : [];
  const [houseNameDropdownOpen, setHouseNameDropdownOpen] = useState(false);
  const houseNameInputRef = useRef(null);

  const { data: relationRolesRes } = useQuery({
    queryKey: ['users', 'relation-roles'],
    queryFn: async () => {
      const { data } = await usersApi.getRelationRoles();
      return data?.data ?? data ?? [];
    },
  });
  const relationRoles = Array.isArray(relationRolesRes) ? relationRolesRes : [];
  const canManagePermissionOverrides = currentUser?.role === 'SUPER_ADMIN';
  const roleOptionsForEditor = useMemo(() => {
    const base =
      canManagePermissionOverrides
        ? [...roleOptions]
        : roleOptions.filter((option) => option.value !== 'SUPER_ADMIN');

    if (form?.role === 'SUPER_ADMIN' && !base.some((option) => option.value === 'SUPER_ADMIN')) {
      const superAdminOption = roleOptions.find((option) => option.value === 'SUPER_ADMIN');
      if (superAdminOption) base.push(superAdminOption);
    }

    return base;
  }, [canManagePermissionOverrides, form?.role]);

  const selectedRolePermissions = useMemo(() => {
    if (!form?.role) return [];
    if (form.role === 'SUPER_ADMIN') return [...PERMISSIONS];
    return ROLE_PERMISSIONS[form.role] || [];
  }, [form?.role]);

  const effectivePermissionsPreview = useMemo(() => {
    if (!form?.role) return [];
    if (form.role === 'SUPER_ADMIN') return [...PERMISSIONS];

    const effectiveSet = new Set([
      ...(ROLE_PERMISSIONS[form.role] || []),
      ...(form.extraPermissions || []),
    ]);
    (form.deniedPermissions || []).forEach((permission) => effectiveSet.delete(permission));
    return [...effectiveSet];
  }, [form?.role, form?.extraPermissions, form?.deniedPermissions]);

  const linkedUserIds = (form?.family || [])
    .map((r) => r.userId)
    .filter((uid) => uid);
  const uniqueLinkedIds = [...new Set(linkedUserIds)];
  const linkedUsersQueries = useQueries({
    queries: uniqueLinkedIds.map((uid) => ({
      queryKey: ['users', uid],
      queryFn: async () => {
        const { data } = await usersApi.getById(uid);
        return data?.data ?? data;
      },
      enabled: !!uid && !!form,
    })),
  });
  const linkedUsersMap = {};
  uniqueLinkedIds.forEach((uid, idx) => {
    const res = linkedUsersQueries[idx]?.data;
    if (res) linkedUsersMap[uid] = res;
  });

  const SLOT_DEFAULT_ROLE = { father: 'الأب', mother: 'الأم', spouse: 'الزوج/ة', sibling: 'أخ/أخت', child: 'ابن/بنت' };
  const flattenFamily = (u) => {
    const list = [];
    if (u?.father) list.push({ ...u.father, relationRole: u.father.relationRole?.trim() || SLOT_DEFAULT_ROLE.father });
    if (u?.mother) list.push({ ...u.mother, relationRole: u.mother.relationRole?.trim() || SLOT_DEFAULT_ROLE.mother });
    if (u?.spouse) list.push({ ...u.spouse, relationRole: u.spouse.relationRole?.trim() || SLOT_DEFAULT_ROLE.spouse });
    (u?.siblings || []).forEach((s) => list.push({ ...s, relationRole: s.relationRole?.trim() || SLOT_DEFAULT_ROLE.sibling }));
    (u?.children || []).forEach((c) => list.push({ ...c, relationRole: c.relationRole?.trim() || SLOT_DEFAULT_ROLE.child }));
    (u?.familyMembers || []).forEach((m) => list.push({ ...m, relationRole: m.relationRole?.trim() || 'آخر' }));
    return list.map((m) => ({
      userId: m.userId ? String(m.userId) : null,
      name: m.name || '',
      relationRole: m.relationRole || '',
      targetPhone: '',
      notes: m.notes || '',
    }));
  };

  useEffect(() => {
    if (user && !form) {
      setForm({
        fullName: user.fullName || '',
        phonePrimary: user.phonePrimary || '',
        email: user.email || '',
        birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
        gender: user.gender || 'male',
        nationalId: user.nationalId || '',
        notes: user.notes || '',
        phoneSecondary: user.phoneSecondary || '',
        whatsappNumber: user.whatsappNumber || '',
        familyName: user.familyName || '',
        houseName: user.houseName || '',
        role: user.role || 'USER',
        extraPermissions: normalizePermissionArray(user.extraPermissions),
        deniedPermissions: normalizePermissionArray(user.deniedPermissions),
        governorate: user.address?.governorate || '',
        city: user.address?.city || '',
        street: user.address?.street || '',
        details: user.address?.details || '',
        family: flattenFamily(user),
      });
    }
  }, [user, form]);

  useEffect(() => {
    const userId = user?._id ?? user?.id;
    const idStr = userId != null ? String(userId) : null;
    if (!user || idStr !== id) return;
    if (customDetailsInitializedFor.current === id) return;
    customDetailsInitializedFor.current = id;
    const cd = user.customDetails;
    if (cd && typeof cd === 'object' && Object.keys(cd).length > 0) {
      const rows = Object.entries(cd).map(([key, value], i) => ({ id: i + 1, key, value: value ?? '' }));
      setCustomDetailsRows(rows);
      nextCustomDetailId.current = rows.length + 2;
    } else {
      setCustomDetailsRows([{ id: 1, key: '', value: '' }]);
      nextCustomDetailId.current = 2;
    }
  }, [user, id]);

  useEffect(() => {
    customDetailsInitializedFor.current = null;
  }, [id]);

  const linkedUsersFetched = linkedUsersQueries.every((q) => !q.isLoading) && uniqueLinkedIds.length > 0;
  useEffect(() => {
    if (!form?.family || !linkedUsersFetched || uniqueLinkedIds.length === 0) return;
    setForm((prev) => {
      const family = [...(prev.family || [])];
      let changed = false;
      family.forEach((row, idx) => {
        if (!row.userId) return;
        const fetchedUser = linkedUsersMap[row.userId];
        if (fetchedUser?.phonePrimary && !(row.targetPhone || '').trim()) {
          family[idx] = { ...row, targetPhone: fetchedUser.phonePrimary };
          changed = true;
        }
      });
      return changed ? { ...prev, family } : prev;
    });
  }, [linkedUsersFetched, uniqueLinkedIds.length]);

  const mutation = useMutation({
    mutationFn: (data) => usersApi.update(id, data),
    onSuccess: async () => {
      const pending = pendingLinkByPhoneRef.current || [];
      pendingLinkByPhoneRef.current = [];
      if (pending.length > 0) {
        for (const m of pending) {
          try {
            const relation = relationRoles.find((r) => r.label === (m.relationRole || '').trim())?.relation || 'other';
            await usersApi.linkFamily(id, {
              relation,
              relationRole: (m.relationRole || '').trim(),
              targetPhone: (m.targetPhone || '').trim(),
              name: (m.name || '').trim() || undefined,
              notes: (m.notes || '').trim() || undefined,
            });
          } catch (err) {
            toast.error(normalizeApiError(err).message);
          }
        }
      }
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'family-names'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'house-names'] });
      navigate(`/dashboard/users/${id}`);
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      if (normalized.code === 'VALIDATION_ERROR') {
        setErrors(mapFieldErrors(normalized.details));
      }
      toast.error(normalized.message);
    },
  });

  const avatarMutation = useMutation({
    mutationFn: (file) => usersApi.uploadAvatar(id, file),
    onSuccess: () => {
      toast.success('تم رفع الصورة الشخصية بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      toast.error(normalizeApiError(err).message);
    },
  });

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'role' && value === 'SUPER_ADMIN') {
        next.extraPermissions = [];
        next.deniedPermissions = [];
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const setPermissionOverride = (permission, mode, checked) => {
    setForm((prev) => {
      if (!prev) return prev;

      const currentExtra = normalizePermissionArray(prev.extraPermissions);
      const currentDenied = normalizePermissionArray(prev.deniedPermissions);

      const nextExtra = [...currentExtra];
      const nextDenied = [...currentDenied];

      const removeFrom = (arr) => arr.filter((item) => item !== permission);
      const addTo = (arr) => (arr.includes(permission) ? arr : [...arr, permission]);

      if (mode === 'extra') {
        const updatedExtra = checked ? addTo(nextExtra) : removeFrom(nextExtra);
        const updatedDenied = checked ? removeFrom(nextDenied) : nextDenied;
        return { ...prev, extraPermissions: updatedExtra, deniedPermissions: updatedDenied };
      }

      const updatedDenied = checked ? addTo(nextDenied) : removeFrom(nextDenied);
      const updatedExtra = checked ? removeFrom(nextExtra) : nextExtra;
      return { ...prev, extraPermissions: updatedExtra, deniedPermissions: updatedDenied };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    if (!canManagePermissionOverrides && user.role === 'SUPER_ADMIN') {
      toast.error('فقط مدير النظام يمكنه تعديل حساب مدير النظام');
      return;
    }

    const payload = {};
    if (form.fullName !== user.fullName) payload.fullName = form.fullName;
    if (form.phonePrimary !== user.phonePrimary) payload.phonePrimary = form.phonePrimary;
    if (form.email !== (user.email || '')) payload.email = form.email || null;
    if (form.birthDate !== (user.birthDate?.split('T')[0] || '')) payload.birthDate = form.birthDate;
    if (form.gender !== user.gender) payload.gender = form.gender;
    if (form.nationalId !== (user.nationalId || '')) payload.nationalId = form.nationalId || null;
    if (form.notes !== (user.notes || '')) payload.notes = form.notes;
    if (form.phoneSecondary !== (user.phoneSecondary || '')) payload.phoneSecondary = form.phoneSecondary;
    if (form.whatsappNumber !== (user.whatsappNumber || '')) payload.whatsappNumber = form.whatsappNumber;
    if (form.familyName !== (user.familyName || '')) payload.familyName = form.familyName;
    if (form.houseName !== (user.houseName || '')) payload.houseName = form.houseName;
    if (form.role !== user.role) payload.role = form.role;
    if (canManagePermissionOverrides) {
      const nextExtraPermissions = normalizePermissionArray(form.extraPermissions);
      const nextDeniedPermissions = normalizePermissionArray(form.deniedPermissions);
      const oldExtraPermissions = normalizePermissionArray(user.extraPermissions);
      const oldDeniedPermissions = normalizePermissionArray(user.deniedPermissions);

      if (JSON.stringify(nextExtraPermissions) !== JSON.stringify(oldExtraPermissions)) {
        payload.extraPermissions = nextExtraPermissions;
      }
      if (JSON.stringify(nextDeniedPermissions) !== JSON.stringify(oldDeniedPermissions)) {
        payload.deniedPermissions = nextDeniedPermissions;
      }
    }

    const newAddress = {
      governorate: form.governorate || '',
      city: form.city || '',
      street: form.street || '',
      details: form.details || '',
    };
    const oldAddr = user.address || {};
    const oldAddrNormalized = {
      governorate: oldAddr.governorate || '',
      city: oldAddr.city || '',
      street: oldAddr.street || '',
      details: oldAddr.details || '',
    };
    if (JSON.stringify(newAddress) !== JSON.stringify(oldAddrNormalized)) {
      payload.address = newAddress;
    }

    const newCustomDetails = customDetailsRows
      .filter((r) => r.key.trim())
      .reduce((acc, r) => ({ ...acc, [r.key.trim()]: (r.value || '').trim() }), {});
    const oldCustomDetails = user.customDetails && typeof user.customDetails === 'object' ? user.customDetails : {};
    if (JSON.stringify(newCustomDetails) !== JSON.stringify(oldCustomDetails)) {
      payload.customDetails = newCustomDetails;
    }

    const toPayloadMember = (m) => {
      if (!m || (!m.name && !m.relationRole && !m.notes && !m.userId)) return null;
      return {
        userId: m.userId || undefined,
        name: (m.name || '').trim() || undefined,
        relationRole: (m.relationRole || '').trim() || undefined,
        notes: (m.notes || '').trim() || undefined,
      };
    };
    const unflattenFamily = (familyList) => {
      const result = { father: null, mother: null, spouse: null, siblings: [], children: [], familyMembers: [] };
      (familyList || []).forEach((m) => {
        const member = toPayloadMember(m);
        if (!member) return;
        const role = relationRoles.find((r) => r.label === (m.relationRole || '').trim())?.relation || 'other';
        if (role === 'father') result.father = member;
        else if (role === 'mother') result.mother = member;
        else if (role === 'spouse') result.spouse = member;
        else if (role === 'sibling') result.siblings.push(member);
        else if (role === 'child') result.children.push(member);
        else result.familyMembers.push(member);
      });
      return result;
    };
    const oldFlat = flattenFamily(user);
    const newFlat = (form.family || []).map((m) => ({
      ...m,
      relationRole: (m.relationRole || '').trim(),
      name: (m.name || '').trim(),
      notes: (m.notes || '').trim(),
    }));
    const familyChanged = JSON.stringify(newFlat.map((m) => ({ ...m, targetPhone: '' }))) !== JSON.stringify(oldFlat.map((m) => ({ ...m, targetPhone: '' })));
    const membersToLinkByPhone = (form.family || []).filter((m) => (m.targetPhone || '').trim());
    if (familyChanged || membersToLinkByPhone.length > 0) {
      const familyForPayload = (form.family || []).filter((m) => !(m.targetPhone || '').trim());
      const unflat = unflattenFamily(familyForPayload);
      payload.father = unflat.father;
      payload.mother = unflat.mother;
      payload.spouse = unflat.spouse;
      payload.siblings = unflat.siblings;
      payload.children = unflat.children;
      payload.familyMembers = unflat.familyMembers;
    }
    if (membersToLinkByPhone.length > 0) {
      pendingLinkByPhoneRef.current = membersToLinkByPhone;
    }

    if (membersToLinkByPhone.length > 0 && Object.keys(payload).length === 0) {
      (async () => {
        for (const m of membersToLinkByPhone) {
          try {
            const relation = relationRoles.find((r) => r.label === (m.relationRole || '').trim())?.relation || 'other';
            await usersApi.linkFamily(id, {
              relation,
              relationRole: (m.relationRole || '').trim(),
              targetPhone: (m.targetPhone || '').trim(),
              name: (m.name || '').trim() || undefined,
              notes: (m.notes || '').trim() || undefined,
            });
          } catch (err) {
            toast.error(normalizeApiError(err).message);
            return;
          }
        }
        toast.success('تم ربط أفراد العائلة بنجاح');
        queryClient.invalidateQueries({ queryKey: ['users', id] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        navigate(`/dashboard/users/${id}`);
      })();
      return;
    }

    if (Object.keys(payload).length === 0) {
      toast('لم يتم تغيير أي بيانات');
      return;
    }

    mutation.mutate(payload);
  };

  const addCustomDetailRow = () => {
    setCustomDetailsRows((prev) => [...prev, { id: nextCustomDetailId.current++, key: '', value: '' }]);
  };

  const updateCustomDetailRow = (id, field, value) => {
    setCustomDetailsRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const removeCustomDetailRow = (id) => {
    setCustomDetailsRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };

  const addFamilyMember = () => {
    setForm((prev) => ({
      ...prev,
      family: [...(prev.family || []), { userId: null, name: '', relationRole: '', targetPhone: '', notes: '' }],
    }));
  };
  const updateFamilyMember = (index, field, value) => {
    setForm((prev) => {
      const arr = [...(prev.family || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, family: arr };
    });
  };
  const removeFamilyMember = (index) => {
    setForm((prev) => ({ ...prev, family: (prev.family || []).filter((_, i) => i !== index) }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة (JPEG، PNG، GIF أو WEBP)');
      return;
    }
    avatarMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (isLoading || !form) {
    return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: 'لوحة التحكم', href: '/dashboard' },
        { label: 'المستخدمون', href: '/dashboard/users' },
        { label: user?.fullName, href: `/dashboard/users/${id}` },
        { label: 'تعديل' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-heading">تعديل المستخدم</h1>
        <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate(-1)}>رجوع</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="البيانات الأساسية" />
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-body">الصورة الشخصية</label>
              <div className="flex items-center gap-4 flex-wrap">
                {user?.avatar?.url ? (
                  <img
                    src={user.avatar.url}
                    alt={user.fullName}
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleAvatarChange}
                    disabled={avatarMutation.isPending}
                    className="hidden"
                    id="edit-user-avatar"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    icon={Upload}
                    loading={avatarMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {user?.avatar?.url ? 'تغيير الصورة' : 'رفع صورة'}
                  </Button>
                  <span className="text-xs text-muted-foreground">JPEG, PNG, GIF أو WEBP — حتى 5 ميجابايت</span>
                </div>
              </div>
            </div>
            <Input label="الاسم الكامل" required value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)} error={errors.fullName} />
            <Input label="رقم الهاتف الأساسي" required dir="ltr" className="text-left"
              value={form.phonePrimary} onChange={(e) => update('phonePrimary', e.target.value)} error={errors.phonePrimary} />
            <Input label="البريد الإلكتروني" type="email" dir="ltr" className="text-left"
              value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} />
            <Input label="تاريخ الميلاد" type="date" dir="ltr" className="text-left"
              value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} error={errors.birthDate} />
            <Select label="الجنس" options={genderOptions} value={form.gender}
              onChange={(e) => update('gender', e.target.value)} />
            <Input label="الرقم القومي" dir="ltr" className="text-left"
              value={form.nationalId} onChange={(e) => update('nationalId', e.target.value)} error={errors.nationalId} />
          </Card>

          <Card>
            <CardHeader title="معلومات إضافية" />
            <Input label="الهاتف الثانوي" dir="ltr" className="text-left"
              value={form.phoneSecondary} onChange={(e) => update('phoneSecondary', e.target.value)} />
            <Input label="رقم الواتساب" dir="ltr" className="text-left"
              value={form.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} />
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-base mb-1.5">اسم العائلة</label>
              <input
                ref={familyNameInputRef}
                type="text"
                value={form.familyName}
                onChange={(e) => {
                  update('familyName', e.target.value);
                  setFamilyNameDropdownOpen(true);
                }}
                onFocus={() => setFamilyNameDropdownOpen(true)}
                onBlur={() => setTimeout(() => setFamilyNameDropdownOpen(false), 200)}
                placeholder="ابحث أو اكتب اسم العائلة"
                className="input-base w-full"
              />
              {familyNameDropdownOpen && familyNames.length > 0 && (
                <ul
                  className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-md border border-border shadow-lg py-1"
                  style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
                  role="listbox"
                >
                  {familyNames
                    .filter((name) => !form.familyName || name.toLowerCase().includes(form.familyName.trim().toLowerCase()))
                    .slice(0, 20)
                    .map((name) => (
                      <li
                        key={name}
                        role="option"
                        aria-selected={form.familyName === name}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted focus:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          update('familyName', name);
                          setFamilyNameDropdownOpen(false);
                        }}
                      >
                        {name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-base mb-1.5">اسم البيت</label>
              <input
                ref={houseNameInputRef}
                type="text"
                value={form.houseName}
                onChange={(e) => {
                  update('houseName', e.target.value);
                  setHouseNameDropdownOpen(true);
                }}
                onFocus={() => setHouseNameDropdownOpen(true)}
                onBlur={() => setTimeout(() => setHouseNameDropdownOpen(false), 200)}
                placeholder="ابحث أو اكتب اسم البيت"
                className="input-base w-full"
              />
              {houseNameDropdownOpen && houseNames.length > 0 && (
                <ul
                  className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-md border border-border shadow-lg py-1"
                  style={{ backgroundColor: 'var(--color-surface, #ffffff)' }}
                  role="listbox"
                >
                  {houseNames
                    .filter((name) => !form.houseName || name.toLowerCase().includes(form.houseName.trim().toLowerCase()))
                    .slice(0, 20)
                    .map((name) => (
                      <li
                        key={name}
                        role="option"
                        aria-selected={form.houseName === name}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted focus:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          update('houseName', name);
                          setHouseNameDropdownOpen(false);
                        }}
                      >
                        {name}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <Select label="الدور" options={roleOptionsForEditor} value={form.role}
              onChange={(e) => update('role', e.target.value)} />
            <TextArea label="ملاحظات" value={form.notes}
              onChange={(e) => update('notes', e.target.value)} />
          </Card>

          {canManagePermissionOverrides && (
            <Card className="lg:col-span-2">
              <CardHeader
                title="إدارة الصلاحيات"
                subtitle="أضف صلاحيات إضافية أو اسحب صلاحيات محددة لهذا المستخدم"
              />

              {form.role === 'SUPER_ADMIN' ? (
                <div className="mb-4 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-body">
                  مدير النظام يمتلك جميع الصلاحيات دائمًا ولا يمكن تقييد صلاحياته.
                </div>
              ) : (
                <div className="mb-4 rounded-md border border-border bg-surface-alt/30 px-3 py-2 text-sm text-body">
                  الصلاحيات الأساسية للدور: <span className="font-semibold">{selectedRolePermissions.length}</span>
                  {' - '}
                  الصلاحيات الفعالة بعد التخصيص: <span className="font-semibold">{effectivePermissionsPreview.length}</span>
                </div>
              )}

              <div className="space-y-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.id} className="rounded-md border border-border p-3">
                    <h4 className="mb-2 text-sm font-semibold text-heading">{group.label}</h4>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {group.permissions.map((permission) => {
                        const roleHasPermission =
                          form.role === 'SUPER_ADMIN' || selectedRolePermissions.includes(permission);
                        const isExtra = (form.extraPermissions || []).includes(permission);
                        const isDenied = (form.deniedPermissions || []).includes(permission);

                        return (
                          <div key={permission} className="rounded-md border border-border/80 bg-surface px-3 py-2">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-heading">
                                {PERMISSION_LABELS[permission] || permission}
                              </span>
                              {roleHasPermission && !isDenied && (
                                <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success">أساسي</span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isExtra}
                                  disabled={form.role === 'SUPER_ADMIN'}
                                  onChange={(e) => setPermissionOverride(permission, 'extra', e.target.checked)}
                                />
                                <span>إضافة</span>
                              </label>

                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isDenied}
                                  disabled={form.role === 'SUPER_ADMIN'}
                                  onChange={(e) => setPermissionOverride(permission, 'denied', e.target.checked)}
                                />
                                <span>سحب</span>
                              </label>
                            </div>

                            <p className="mt-2 text-xs text-muted">
                              <code>{permission}</code>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="lg:col-span-2">
            <CardHeader title="تفاصيل مخصصة" />
            <p className="text-sm text-muted-foreground mb-3">أضف أو عدّل حقولاً مخصصة (مفتاح وقيمة). المفاتيح المستخدمة سابقاً تظهر كاقتراحات.</p>
            <div className="space-y-3">
              {customDetailsRows.map((row) => (
                <div key={row.id} className="flex flex-wrap items-center gap-2">
                  <input
                    list="edit-custom-detail-keys-list"
                    value={row.key}
                    onChange={(e) => updateCustomDetailRow(row.id, 'key', e.target.value)}
                    placeholder="المفتاح"
                    className="flex-1 min-w-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <datalist id="edit-custom-detail-keys-list">
                    {savedKeys.map((k) => (
                      <option key={k} value={k} />
                    ))}
                  </datalist>
                  <input
                    value={row.value}
                    onChange={(e) => updateCustomDetailRow(row.id, 'value', e.target.value)}
                    placeholder="القيمة"
                    className="flex-1 min-w-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCustomDetailRow(row.id)}
                    aria-label="حذف"
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addCustomDetailRow}>
                إضافة حقل
              </Button>
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader
              title="أفراد العائلة"
              action={
                <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addFamilyMember}>
                  إضافة فرد
                </Button>
              }
            />
            <p className="text-sm text-muted-foreground mb-4">
              اختر صلة القرابة ثم اربط بمستخدم مسجل (بالاسم أو رقم الهاتف) أو اكتب الاسم والهاتف يدوياً.
            </p>
            <div className="space-y-3">
              {(form.family || []).map((row, i) => {
                const roleLabels = relationRoles.map((r) => r.label);
                const relationRoleOptions = [
                  { value: '', label: '— اختر صلة القرابة —' },
                  ...relationRoles.map((r) => ({ value: r.label, label: r.label })),
                  ...(row.relationRole && !roleLabels.includes(row.relationRole)
                    ? [{ value: row.relationRole, label: row.relationRole }]
                    : []),
                ];
                const fetched = row.userId ? linkedUsersMap[row.userId] : null;
                const linkedUser = row.userId
                  ? {
                      _id: row.userId,
                      fullName: fetched?.fullName ?? row.name,
                      phonePrimary: fetched?.phonePrimary ?? row.targetPhone ?? '',
                    }
                  : null;
                return (
                  <div key={i} className="flex flex-col gap-3 p-3 rounded-lg border border-border bg-surface-alt/30">
                    <div className="flex flex-wrap items-end gap-2">
                      <Select
                        label="صلة القرابة"
                        options={relationRoleOptions}
                        value={row.relationRole}
                        onChange={(e) => updateFamilyMember(i, 'relationRole', e.target.value)}
                        containerClassName="mb-0 flex-1 min-w-[140px]"
                      />
                      <div className="flex-1 min-w-[200px]">
                        <UserSearchSelect
                          label="ربط بمستخدم مسجل"
                          value={linkedUser}
                          onChange={(u) => {
                            setForm((prev) => {
                              const arr = [...(prev.family || [])];
                              arr[i] = {
                                ...arr[i],
                                userId: u ? u._id : null,
                                name: u ? u.fullName : '',
                                targetPhone: u ? (u.phonePrimary || '') : '',
                              };
                              return { ...prev, family: arr };
                            });
                          }}
                          excludeUserId={id}
                          className="mb-0"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                      <Input
                        label="الاسم"
                        value={row.name}
                        onChange={(e) => updateFamilyMember(i, 'name', e.target.value)}
                        containerClassName="mb-0 flex-1 min-w-[140px]"
                      />
                      <Input
                        label="رقم الهاتف (لربط أو يدوياً)"
                        dir="ltr"
                        className="text-left"
                        value={fetched?.phonePrimary ?? row.targetPhone}
                        onChange={(e) => updateFamilyMember(i, 'targetPhone', e.target.value)}
                        containerClassName="mb-0 flex-1 min-w-[140px]"
                      />
                      <TextArea
                        label="ملاحظات"
                        value={row.notes}
                        onChange={(e) => updateFamilyMember(i, 'notes', e.target.value)}
                        containerClassName="mb-0 flex-1 min-w-[120px]"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFamilyMember(i)}
                        aria-label="حذف"
                        className="shrink-0 text-muted hover:text-danger mb-4"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="العنوان" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input label="المحافظة" value={form.governorate}
                onChange={(e) => update('governorate', e.target.value)} placeholder="المحافظة" />
              <Input label="المدينة" value={form.city}
                onChange={(e) => update('city', e.target.value)} placeholder="المدينة"/>
              <Input label="الشارع" value={form.street}
                onChange={(e) => update('street', e.target.value)} />
              <Input label="تفاصيل إضافية" value={form.details}
                onChange={(e) => update('details', e.target.value)} />
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>إلغاء</Button>
          <Button type="submit" icon={Save} loading={mutation.isPending}>حفظ التعديلات</Button>
        </div>
      </form>
    </div>
  );
}
