import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError, mapFieldErrors } from '../../../api/errors';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TextArea from '../../../components/ui/TextArea';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import toast from 'react-hot-toast';
import { Save, ArrowRight } from 'lucide-react';

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
    whatsappNumber: '', familyName: '', role: 'USER', password: '',
    governorate: '', city: '', street: '', details: '',
  });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: (data) => usersApi.create(data),
    onSuccess: () => {
      toast.success('تم إنشاء المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users'] });
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
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
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
    if (form.password) payload.password = form.password;
    if (form.governorate || form.city || form.street || form.details) {
      payload.address = {};
      if (form.governorate) payload.address.governorate = form.governorate;
      if (form.city) payload.address.city = form.city;
      if (form.street) payload.address.street = form.street;
      if (form.details) payload.address.details = form.details;
    }

    mutation.mutate(payload);
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
            <Input label="الاسم الكامل" required value={form.fullName}
              onChange={(e) => update('fullName', e.target.value)} error={errors.fullName} />
            <Input label="رقم الهاتف الأساسي" required dir="ltr" className="text-left"
              value={form.phonePrimary} onChange={(e) => update('phonePrimary', e.target.value)} error={errors.phonePrimary} />
            <Input label="البريد الإلكتروني" type="email" dir="ltr" className="text-left"
              value={form.email} onChange={(e) => update('email', e.target.value)} error={errors.email} />
            <Input label="تاريخ الميلاد" type="date" required dir="ltr" className="text-left"
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
            <Input label="اسم العائلة" value={form.familyName}
              onChange={(e) => update('familyName', e.target.value)} />
            <Select label="الدور" options={roleOptions} value={form.role}
              onChange={(e) => update('role', e.target.value)} />
            <Input label="كلمة المرور" type="password" dir="ltr" className="text-left"
              hint="اتركها فارغة إذا لم تريد إنشاء حساب دخول"
              value={form.password} onChange={(e) => update('password', e.target.value)} error={errors.password} />
            <TextArea label="ملاحظات" value={form.notes}
              onChange={(e) => update('notes', e.target.value)} />
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader title="العنوان" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <Input label="المحافظة" value={form.governorate}
                onChange={(e) => update('governorate', e.target.value)} />
              <Input label="المدينة" value={form.city}
                onChange={(e) => update('city', e.target.value)} />
              <Input label="الشارع" value={form.street}
                onChange={(e) => update('street', e.target.value)} />
              <Input label="تفاصيل إضافية" value={form.details}
                onChange={(e) => update('details', e.target.value)} />
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
