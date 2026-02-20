import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError, mapFieldErrors } from '../../../api/errors';
import Input from '../../../components/ui/Input';
import PhoneInput from '../../../components/ui/PhoneInput';
import Select from '../../../components/ui/Select';
import TextArea from '../../../components/ui/TextArea';
import Button from '../../../components/ui/Button';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import toast from 'react-hot-toast';
import { ArrowRight, Plus, Save, Trash2, Upload, Users, X } from 'lucide-react';

/* ── constants ───────────────────────────────────────────────────────────── */

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

/* ── primitives ──────────────────────────────────────────────────────────── */

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {children}
      </span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function StepBadge({ n }) {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
      {n}
    </div>
  );
}

/** Minimal combobox — reused for family name and house name */
function NameCombobox({ label, value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const filtered = options
    .filter((n) => !value || n.toLowerCase().includes(value.toLowerCase().trim()))
    .slice(0, 20);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-sm font-medium text-base">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className="input-base w-full"
      />
      {open && filtered.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-border bg-surface py-1 shadow-lg"
        >
          {filtered.map((name) => (
            <li
              key={name}
              role="option"
              aria-selected={value === name}
              onMouseDown={(e) => { e.preventDefault(); onChange(name); setOpen(false); }}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors
                ${value === name
                  ? 'bg-primary/8 font-semibold text-primary'
                  : 'text-heading hover:bg-primary/8 hover:text-primary'
                }`}
            >
              {name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────────────────── */

export default function UserCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    fullName: '', phonePrimary: '', email: '', birthDate: '',
    gender: 'male', nationalId: '', notes: '', phoneSecondary: '',
    whatsappNumber: '', familyName: '', houseName: '', role: 'USER', password: '',
    governorate: '', city: '', street: '', details: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [whatsappNumberTouched, setWhatsappNumberTouched] = useState(false);
  const [customDetailsRows, setCustomDetailsRows] = useState([{ id: 1, key: '', value: '' }]);
  const fileInputRef = useRef(null);
  const nextCustomDetailId = useRef(2);

  /* ── queries ── */
  const { data: savedKeysRes } = useQuery({
    queryKey: ['users', 'custom-detail-keys'],
    queryFn: async () => {
      const res = await usersApi.getCustomDetailKeys();
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
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

  const { data: houseNamesRes } = useQuery({
    queryKey: ['users', 'house-names'],
    queryFn: async () => {
      const res = await usersApi.getHouseNames();
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
  });
  const houseNames = Array.isArray(houseNamesRes) ? houseNamesRes : [];

  /* ── mutation ── */
  const mutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      toast.success('تم إنشاء المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'custom-detail-keys'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'family-names'] });
      queryClient.invalidateQueries({ queryKey: ['users', 'house-names'] });
      navigate('/dashboard/users');
    },
    onError: (err) => {
      const normalized = normalizeApiError(err);
      if (normalized.code === 'VALIDATION_ERROR') setErrors(mapFieldErrors(normalized.details));
      toast.error(normalized.message);
    },
  });

  /* ── helpers ── */
  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'phonePrimary' && !whatsappNumberTouched) next.whatsappNumber = value;
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === 'whatsappNumber') setWhatsappNumberTouched(true);
  };

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'الاسم الكامل مطلوب';
    if (!form.phonePrimary.trim()) e.phonePrimary = 'رقم الهاتف الأساسي مطلوب';
    if (!form.birthDate) e.birthDate = 'تاريخ الميلاد مطلوب';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }

    const payload = {
      fullName: form.fullName,
      phonePrimary: form.phonePrimary,
      birthDate: form.birthDate,
      gender: form.gender,
      role: form.role,
    };
    if (form.email) payload.email = form.email;
    if (form.nationalId) payload.nationalId = form.nationalId;
    if (form.notes) payload.notes = form.notes;
    if (form.phoneSecondary) payload.phoneSecondary = form.phoneSecondary;
    if (form.whatsappNumber) payload.whatsappNumber = form.whatsappNumber;
    if (form.familyName) payload.familyName = form.familyName;
    if (form.houseName) payload.houseName = form.houseName;
    if (form.password) payload.password = form.password;
    if (form.governorate || form.city || form.street || form.details) {
      payload.address = {};
      if (form.governorate) payload.address.governorate = form.governorate;
      if (form.city) payload.address.city = form.city;
      if (form.street) payload.address.street = form.street;
      if (form.details) payload.address.details = form.details;
    }
    if (avatar?.url && avatar?.publicId) payload.avatar = avatar;

    const customDetails = customDetailsRows
      .filter((r) => r.key && r.key.trim() && r.key !== '__new__')
      .reduce((acc, r) => ({ ...acc, [r.key.trim()]: (r.value || '').trim() }), {});
    if (Object.keys(customDetails).length > 0) payload.customDetails = customDetails;

    mutation.mutate(payload);
  };

  /* custom details helpers */
  const addCustomDetailRow = () => setCustomDetailsRows((prev) => [...prev, { id: nextCustomDetailId.current++, key: '', value: '' }]);
  const updateCustomDetailRow = (id, field, value) => setCustomDetailsRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  const removeCustomDetailRow = (id) => setCustomDetailsRows((prev) => prev.length > 1 ? prev.filter((r) => r.id !== id) : prev);

  /* avatar helpers */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('يرجى اختيار صورة (JPEG، PNG، GIF أو WEBP)'); return; }
    setAvatarUploading(true);
    try {
      const { data } = await usersApi.uploadAvatarImage(file);
      setAvatar(data.data);
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const clearAvatar = () => { setAvatar(null); if (fileInputRef.current) fileInputRef.current.value = ''; };

  /* ── render ── */
  return (
    <div className="animate-fade-in space-y-8 pb-10">

      <Breadcrumbs items={[
        { label: 'لوحة التحكم', href: '/dashboard' },
        { label: 'المستخدمون', href: '/dashboard/users' },
        { label: 'إضافة مستخدم' },
      ]} />

      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted">
            المستخدمون
          </p>
          <h1 className="mt-1.5 text-3xl font-bold tracking-tight text-heading">
            إضافة مستخدم جديد
          </h1>
        </div>
        <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate(-1)}>رجوع</Button>
      </div>

      {/* ══ FORM ════════════════════════════════════════════════════════ */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="mx-auto max-w-7xl space-y-8">

          {/* ── STEP 1 · الصورة والبيانات الأساسية ─────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <StepBadge n={1} />
              <SectionLabel>البيانات الأساسية</SectionLabel>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">

              {/* avatar upload */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">
                  الصورة الشخصية
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  {avatar?.url ? (
                    <div className="relative inline-block">
                      <img
                        src={avatar.url}
                        alt="معاينة"
                        className="h-20 w-20 rounded-2xl border-2 border-primary/20 object-cover shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={clearAvatar}
                        className="absolute -top-1.5 -left-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-sm hover:opacity-90"
                        aria-label="إزالة الصورة"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-surface-alt">
                      <Users className="h-8 w-8 text-muted" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading}
                      className="hidden"
                      id="create-user-avatar"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Upload}
                      loading={avatarUploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatar?.url ? 'تغيير الصورة' : 'رفع صورة'}
                    </Button>
                    <span className="text-xs text-muted">JPEG, PNG, GIF أو WEBP — حتى 5 ميجابايت</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="الاسم الكامل" required
                  value={form.fullName}
                  placeholder="اسم المستخدم"
                  onChange={(e) => update('fullName', e.target.value)}
                  error={errors.fullName}
                  autoFocus
                  containerClassName="!mb-0"
                />
                <Input
                  label="تاريخ الميلاد" type="date" required dir="ltr" className="text-left"
                  value={form.birthDate}
                  onChange={(e) => update('birthDate', e.target.value)}
                  error={errors.birthDate}
                  containerClassName="!mb-0"
                />
                <PhoneInput
                  label="رقم الهاتف الأساسي" required
                  placeholder="رقم الهاتف"
                  value={form.phonePrimary}
                  onChange={(e) => update('phonePrimary', e.target.value)}
                  error={errors.phonePrimary}
                  containerClassName="!mb-0"
                />
                <Select
                  label="الجنس"
                  options={genderOptions}
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  containerClassName="!mb-0"
                />
              </div>
            </div>
          </section>

          {/* ── STEP 2 · معلومات إضافية ──────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <StepBadge n={2} />
              <SectionLabel>معلومات إضافية</SectionLabel>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <PhoneInput
                  label="الهاتف الثانوي"
                  placeholder="رقم الهاتف الثانوي"
                  value={form.phoneSecondary}
                  onChange={(e) => update('phoneSecondary', e.target.value)}
                  containerClassName="!mb-0"
                />
                <PhoneInput
                  label="رقم الواتساب"
                  placeholder="رقم الواتساب"
                  value={form.whatsappNumber}
                  onChange={(e) => update('whatsappNumber', e.target.value)}
                  containerClassName="!mb-0"
                />
                <Input
                  label="البريد الإلكتروني" type="email" dir="ltr" className="text-left"
                  placeholder="البريد الإلكتروني"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  error={errors.email}
                  containerClassName="!mb-0"
                />
                <Input
                  label="الرقم القومي" dir="ltr" className="text-left"
                  placeholder="الرقم القومي"
                  value={form.nationalId}
                  onChange={(e) => update('nationalId', e.target.value)}
                  error={errors.nationalId}
                  containerClassName="!mb-0"
                />

                {/* family name combobox */}
                <NameCombobox
                  label="اسم العائلة"
                  value={form.familyName}
                  onChange={(val) => update('familyName', val)}
                  options={familyNames}
                  placeholder="ابحث أو اكتب اسم العائلة"
                />

                {/* house name combobox */}
                <NameCombobox
                  label="اسم البيت"
                  value={form.houseName}
                  onChange={(val) => update('houseName', val)}
                  options={houseNames}
                  placeholder="ابحث أو اكتب اسم البيت"
                />

                <Select
                  label="الدور"
                  options={roleOptions}
                  value={form.role}
                  onChange={(e) => update('role', e.target.value)}
                  containerClassName="!mb-0"
                />
                <Input
                  label="كلمة المرور" type="password" dir="ltr" className="text-left"
                  hint="اتركها فارغة إذا لم تريد إنشاء حساب دخول"
                  placeholder="كلمة المرور"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  error={errors.password}
                  containerClassName="!mb-0"
                />
              </div>

              <TextArea
                label="ملاحظات"
                value={form.notes}
                onChange={(e) => update('notes', e.target.value)}
                placeholder="اي ملاحظات إضافية"
                containerClassName="!mb-0"
              />
            </div>
          </section>

          {/* ── STEP 3 · العنوان ─────────────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <StepBadge n={3} />
              <SectionLabel>العنوان</SectionLabel>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="المحافظة"
                  placeholder="المحافظة"
                  value={form.governorate || 'المنيا'}
                  onChange={(e) => update('governorate', e.target.value)}
                  containerClassName="!mb-0"
                />
                <Input
                  label="المدينة"
                  placeholder="المدينة"
                  value={form.city || 'سمالوط'}
                  onChange={(e) => update('city', e.target.value)}
                  containerClassName="!mb-0"
                />
                <Input
                  label="الشارع"
                  placeholder="الشارع"
                  value={form.street}
                  onChange={(e) => update('street', e.target.value)}
                  containerClassName="!mb-0"
                />
                <Input
                  label="تفاصيل إضافية"
                  placeholder="اي تفاصيل إضافية"
                  value={form.details}
                  onChange={(e) => update('details', e.target.value)}
                  containerClassName="!mb-0"
                />
              </div>
            </div>
          </section>

          {/* ── STEP 4 · تفاصيل مخصصة ───────────────────────────────── */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <StepBadge n={4} />
              <SectionLabel>تفاصيل مخصصة</SectionLabel>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
              <p className="text-xs text-muted">
                أضف حقولاً مخصصة (مفتاح وقيمة). المفاتيح المستخدمة سابقاً تظهر كاقتراحات عند الإضافة.
              </p>

              <div className="space-y-2.5">
                {customDetailsRows.map((row) => {
                  const showCustomKeyInput =
                    savedKeys.length > 0 &&
                    (row.key === '__new__' || (row.key && !savedKeys.includes(row.key)));
                  const selectValue = savedKeys.includes(row.key) ? row.key : '';

                  return (
                    <div key={row.id} className="flex flex-wrap items-center gap-2">
                      {savedKeys.length > 0 && !showCustomKeyInput ? (
                        <Select
                          containerClassName="mb-0 flex-1 min-w-[140px]"
                          options={[
                            { value: '', label: 'اختر المفتاح' },
                            ...savedKeys.map((k) => ({ value: k, label: k })),
                            { value: '__new__', label: '+ مفتاح جديد' },
                          ]}
                          value={selectValue}
                          onChange={(e) => updateCustomDetailRow(row.id, 'key', e.target.value)}
                        />
                      ) : (
                        <input
                          value={row.key === '__new__' ? '' : row.key}
                          onChange={(e) => updateCustomDetailRow(row.id, 'key', e.target.value)}
                          placeholder={showCustomKeyInput ? 'المفتاح (جديد)' : 'المفتاح'}
                          className="input-base flex-1 min-w-[120px]"
                        />
                      )}

                      <input
                        value={row.value}
                        onChange={(e) => updateCustomDetailRow(row.id, 'value', e.target.value)}
                        placeholder="القيمة"
                        className="input-base flex-1 min-w-[120px]"
                      />

                      <button
                        type="button"
                        onClick={() => removeCustomDetailRow(row.id)}
                        aria-label="حذف"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:border-danger/30 hover:bg-danger-light hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addCustomDetailRow}>
                إضافة حقل
              </Button>
            </div>
          </section>

          {/* ── ACTIONS ───────────────────────────────────────────────── */}
          <div className="flex gap-2">
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>إلغاء</Button>
            <Button type="submit" icon={Save} loading={mutation.isPending}>حفظ المستخدم</Button>
          </div>

        </div>
      </form>
    </div>
  );
}