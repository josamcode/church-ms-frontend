import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Phone, Lock } from 'lucide-react';
import { useAuth } from '../../auth/auth.hooks';
import { normalizeApiError, mapFieldErrors } from '../../api/errors';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [locked, setLocked] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!identifier.trim()) errs.identifier = 'رقم الهاتف أو البريد الإلكتروني مطلوب';
    if (!password) errs.password = 'كلمة المرور مطلوبة';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLocked(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      await login(identifier, password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate(from, { replace: true });
    } catch (err) {
      const normalized = normalizeApiError(err);

      if (normalized.code === 'VALIDATION_ERROR') {
        setErrors(mapFieldErrors(normalized.details));
      } else if (normalized.code === 'AUTH_ACCOUNT_LOCKED') {
        setLocked(normalized.message);
      } else {
        toast.error(normalized.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-heading">تسجيل الدخول</h2>
        <p className="text-sm text-muted mt-1">أدخل بياناتك للوصول إلى لوحة التحكم</p>
      </div>

      {locked && (
        <div className="bg-danger-light border border-danger/20 rounded-lg p-4 mb-4 text-sm text-danger">
          <p className="font-semibold mb-1">الحساب مغلق</p>
          <p>{locked}</p>
          <p className="mt-2 text-xs">يرجى التواصل مع مسؤول النظام لإعادة تفعيل حسابك.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="رقم الهاتف أو البريد الإلكتروني"
          placeholder="01xxxxxxxxx"
          icon={Phone}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          error={errors.identifier}
          required
          autoFocus
          dir="ltr"
          className="text-left"
        />

        <Input
          label="كلمة المرور"
          type="password"
          placeholder="كلمة المرور"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required
          dir="ltr"
          className="text-left"
        />

        <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
          تسجيل الدخول
        </Button>
      </form>
    </div>
  );
}
