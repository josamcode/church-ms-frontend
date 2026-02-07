import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../../../api/endpoints';
import { normalizeApiError, mapFieldErrors } from '../../../api/errors';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import TextArea from '../../../components/ui/TextArea';
import Button from '../../../components/ui/Button';
import Card, { CardHeader } from '../../../components/ui/Card';
import Breadcrumbs from '../../../components/ui/Breadcrumbs';
import Skeleton from '../../../components/ui/Skeleton';
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

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});

  const { data: user, isLoading } = useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await usersApi.getById(id);
      return data.data;
    },
  });

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
        role: user.role || 'USER',
        governorate: user.address?.governorate || '',
        city: user.address?.city || '',
        street: user.address?.street || '',
        details: user.address?.details || '',
      });
    }
  }, [user, form]);

  const mutation = useMutation({
    mutationFn: (data) => usersApi.update(id, data),
    onSuccess: () => {
      toast.success('تم تحديث بيانات المستخدم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['users', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
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

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

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
    if (form.role !== user.role) payload.role = form.role;

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

    if (Object.keys(payload).length === 0) {
      toast('لم يتم تغيير أي بيانات');
      return;
    }

    mutation.mutate(payload);
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
          <Button type="submit" icon={Save} loading={mutation.isPending}>حفظ التعديلات</Button>
        </div>
      </form>
    </div>
  );
}
