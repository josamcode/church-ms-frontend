export function normalizeApiError(error) {
  if (!error.response) {
    return {
      message: 'خطأ في الاتصال بالخادم. تأكد من اتصالك بالإنترنت',
      code: 'NETWORK_ERROR',
      statusCode: 0,
      details: null,
      requestId: null,
    };
  }

  const data = error.response.data;
  return {
    message: data?.message || 'حدث خطأ غير متوقع',
    code: data?.error?.code || 'UNKNOWN_ERROR',
    statusCode: error.response.status,
    details: data?.error?.details || null,
    requestId: data?.requestId || null,
  };
}

export function mapFieldErrors(details) {
  if (!details || !Array.isArray(details)) return {};
  const errors = {};
  details.forEach((d) => {
    const field = d.field?.replace('body.', '').replace('query.', '').replace('params.', '');
    if (field) {
      errors[field] = d.message;
    }
  });
  return errors;
}

export const ERROR_MESSAGES = {
  AUTH_INVALID_CREDENTIALS: 'رقم الهاتف أو كلمة المرور غير صحيحة',
  AUTH_ACCOUNT_LOCKED: 'الحساب مغلق. يرجى التواصل مع المسؤول',
  AUTH_NO_LOGIN_ACCESS: 'هذا الحساب لا يملك صلاحية تسجيل الدخول',
  AUTH_TOKEN_EXPIRED: 'انتهت صلاحية الجلسة',
  AUTH_UNAUTHORIZED: 'يجب تسجيل الدخول أولاً',
  PERMISSION_DENIED: 'ليس لديك صلاحية لتنفيذ هذا الإجراء',
  RESOURCE_NOT_FOUND: 'المورد المطلوب غير موجود',
  USER_NOT_FOUND: 'المستخدم غير موجود',
  VALIDATION_ERROR: 'خطأ في البيانات المدخلة',
  DUPLICATE_PHONE: 'رقم الهاتف مسجل مسبقاً',
  DUPLICATE_EMAIL: 'البريد الإلكتروني مسجل مسبقاً',
  DUPLICATE_NATIONAL_ID: 'الرقم القومي مسجل مسبقاً',
  RATE_LIMITED: 'تم تجاوز الحد المسموح من الطلبات. يرجى الانتظار',
  UPLOAD_FAILED: 'فشل رفع الملف',
  UPLOAD_FILE_TOO_LARGE: 'حجم الملف يتجاوز الحد المسموح',
  UPLOAD_INVALID_TYPE: 'نوع الملف غير مسموح به',
  INTERNAL_ERROR: 'خطأ داخلي في الخادم',
  NETWORK_ERROR: 'خطأ في الاتصال بالخادم',
};
