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
import Card, { CardHeader } from '../../../components/ui/Card';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import toast from 'react-hot-toast';
import { Save, ArrowRight, Upload, X, Plus, Trash2 } from 'lucide-react';

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
      if (normalized.code === 'VALIDATION_ERROR') {
        setErrors(mapFieldErrors(normalized.details));
      }
      toast.error(normalized.message);
    },
  });

  const update = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'phonePrimary' && !whatsappNumberTouched) {
        next.whatsappNumber = value;
      }
      return next;
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (field === 'whatsappNumber') setWhatsappNumberTouched(true);
  };

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = 'الاسم الكامل مطلوب';
    if (!form.phonePrimary.trim()) errs.phonePrimary = 'رقم الهاتف الأساسي مطلوب';
    if (!form.birthDate) errs.birthDate = 'تاريخ الميلاد مطلوب';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

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

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار صورة (JPEG، PNG، GIF أو WEBP)');
      return;
    }
    setAvatarUploading(true);
    try {
      const { data } = await usersApi.uploadAvatarImage(file);
      setAvatar(data.data);
      toast.success('تم رفع الصورة بنجاح');
    } catch (err) {
      const normalized = normalizeApiError(err);
      toast.error(normalized.message);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumbs items={[
        { label: 'لوحة التحكم', href: '/dashboard' },
        { label: 'المستخدمون', href: '/dashboard/users' },
        { label: 'إضافة مستخدم' },
      ]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-heading">إضافة مستخدم جديد</h1>
        <Button variant="ghost" size="sm" icon={ArrowRight} onClick={() => navigate(-1)}>رجوع</Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="البيانات الأساسية" />
            <div className="space-y-2 mb-4">
              <label className="block text-sm font-medium text-body">الصورة الشخصية</label>
              <div className="flex items-center gap-4 flex-wrap">
                {avatar?.url ? (
                  <div className="relative inline-block">
                    <img
                      src={avatar.url}
                      alt="معاينة"
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                    />
                    <button
                      type="button"
                      onClick={clearAvatar}
                      className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-error text-white flex items-center justify-center hover:opacity-90"
                      aria-label="إزالة الصورة"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                  <span className="text-xs text-muted-foreground">JPEG, PNG, GIF أو WEBP — حتى 5 ميجابايت</span>
                </div>
              </div>
            </div>
            <Input label="الاسم الكامل" required value={form.fullName} placeholder="اسم المستخدم"
              onChange={(e) => update('fullName', e.target.value)} error={errors.fullName} autoFocus />
            <PhoneInput label="رقم الهاتف الأساسي" required placeholder="رقم الهاتف"
              value={form.phonePrimary} onChange={(e) => update('phonePrimary', e.target.value)} error={errors.phonePrimary} />
            <Input label="تاريخ الميلاد" type="date" required dir="ltr" className="text-left" placeholder="تاريخ الميلاد"
              value={form.birthDate} onChange={(e) => update('birthDate', e.target.value)} error={errors.birthDate} />
            <Select label="الجنس" options={genderOptions} value={form.gender}
              onChange={(e) => update('gender', e.target.value)} />
          </Card>

          <Card>
            <CardHeader title="معلومات إضافية" />
            <PhoneInput label="الهاتف الثانوي"
              value={form.phoneSecondary} onChange={(e) => update('phoneSecondary', e.target.value)} placeholder="رقم الهاتف الثانوي" />
            <PhoneInput label="رقم الواتساب"
              value={form.whatsappNumber} onChange={(e) => update('whatsappNumber', e.target.value)} placeholder="رقم الواتساب" />
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
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted focus:bg-muted hover:text-white"
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
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted focus:bg-muted hover:text-white"
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
            <Input label="البريد الإلكتروني" type="email" dir="ltr" className="text-left"
              value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} placeholder="البريد الإلكتروني" />
            <Input label="الرقم القومي" dir="ltr" className="text-left"
              value={form.nationalId} onChange={(e) => update('nationalId', e.target.value)} error={errors.nationalId} placeholder="الرقم القومي" />
            <Select label="الدور" options={roleOptions} value={form.role}
              onChange={(e) => update('role', e.target.value)} />
            <Input label="كلمة المرور" type="password" dir="ltr" className="text-left"
              hint="اتركها فارغة إذا لم تريد إنشاء حساب دخول"
              value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} placeholder="كلمة المرور" />
            <TextArea label="ملاحظات" value={form.notes}
              onChange={(e) => update('notes', e.target.value)} placeholder="اي ملاحظات إضافية" />
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="العنوان" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input label="المحافظة" value={form.governorate || 'المنيا'}
                onChange={(e) => update('governorate', e.target.value)} placeholder="المحافظة" />
              <Input label="المدينة" value={form.city || 'سمالوط'}
                onChange={(e) => update('city', e.target.value)} placeholder="المدينة" />
              <Input label="الشارع" value={form.street}
                onChange={(e) => update('street', e.target.value)} placeholder="الشارع" />
              <Input label="تفاصيل إضافية" value={form.details} placeholder="اي تفاصيل إضافية"
                onChange={(e) => update('details', e.target.value)} />
            </div>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="تفاصيل مخصصة" />
            <p className="text-sm text-muted-foreground mb-3">أضف حقولاً مخصصة (مفتاح وقيمة). المفاتيح المستخدمة سابقاً تظهر كاقتراحات عند الإضافة.</p>
            <div className="space-y-3">
              {customDetailsRows.map((row) => {
                const showCustomKeyInput = savedKeys.length > 0 && (row.key === '__new__' || (row.key && !savedKeys.includes(row.key)));
                const selectValue = savedKeys.includes(row.key) ? row.key : (row.key === '__new__' ? '' : '');
                return (
                  <div key={row.id} className="flex flex-wrap items-center gap-2">
                    {savedKeys.length > 0 && !showCustomKeyInput ? (
                      <div className="flex-1 min-w-[140px] flex items-center">
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
                      </div>
                    ) : showCustomKeyInput ? (
                      <input
                        value={row.key === '__new__' ? '' : row.key}
                        onChange={(e) => updateCustomDetailRow(row.id, 'key', e.target.value)}
                        placeholder="المفتاح (جديد)"
                        className="flex-1 min-w-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    ) : (
                      <input
                        value={row.key}
                        onChange={(e) => updateCustomDetailRow(row.id, 'key', e.target.value)}
                        placeholder="المفتاح"
                        className="flex-1 min-w-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                    )}
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
                );
              })}
              <Button type="button" variant="outline" size="sm" icon={Plus} onClick={addCustomDetailRow}>
                إضافة حقل
              </Button>
            </div>
          </Card>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>إلغاء</Button>
          <Button type="submit" icon={Save} loading={mutation.isPending}>حفظ المستخدم</Button>
        </div>
      </form>
    </div>
  );
}
