import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = forwardRef(
  ({ label, hint, error, required, options = [], placeholder, className = '', containerClassName = '', ...props }, ref) => {
    return (
      <div className={`mb-4 ${containerClassName}`.trim()}>
        {label && (
          <label className="block text-sm font-medium text-base mb-1.5">
            {label}
            {required && <span className="text-danger mr-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`input-base appearance-none pl-10 ${error ? 'border-danger' : ''} ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
        </div>
        {hint && !error && <p className="text-xs text-muted mt-1">{hint}</p>}
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
