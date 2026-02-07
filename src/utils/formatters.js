export function formatDate(dateStr) {
  if (!dateStr) return '---';
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '---';
  try {
    return new Date(dateStr).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

export function formatPhone(phone) {
  if (!phone) return '---';
  return phone;
}

export const GENDER_LABELS = {
  male: 'ذكر',
  female: 'أنثى',
  other: 'آخر',
};

export const ROLE_LABELS = {
  SUPER_ADMIN: 'مدير النظام',
  ADMIN: 'مسؤول',
  USER: 'مستخدم',
};

export const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-primary text-white',
  ADMIN: 'bg-accent text-white',
  USER: 'bg-surface-alt text-base',
};

export const AGE_GROUPS = ['طفل', 'مراهق', 'شاب', 'متوسط العمر', 'كبير سن'];

export const LOCK_REASONS = [
  'قرار إداري',
  'اختراق أمني',
  'سلوك غير لائق',
  'عدم نشاط',
  'محاولات دخول فاشلة متعددة',
  'مشاكل في سلامة البيانات',
  'سبب آخر',
];
