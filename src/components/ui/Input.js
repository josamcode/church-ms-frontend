import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(
  (
    {
      label,
      hint,
      error,
      icon: Icon,
      type = 'text',
      className = '',
      containerClassName = '',
      required = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={`mb-4 ${containerClassName}`}>
        {label && (
          <label className="block text-sm font-medium text-base mb-1.5">
            {label}
            {required && <span className="text-danger mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
              <Icon className="w-4 h-4" />
            </span>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`
              input-base
              ${Icon ? 'pr-10' : ''}
              ${isPassword ? 'pl-10' : ''}
              ${error ? 'border-danger focus:border-danger focus:ring-danger' : ''}
              ${className}
            `}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-base transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
