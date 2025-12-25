import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const PasswordInput = forwardRef((props, ref) => {
  const { label, placeholder, ...rest } = props;
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full min-w-[200px] relative">
      {label && <label className='block mb-2 text-sm font-medium text-[var(--color-text-primary)]'>
        {label}
      </label>}
      <div className="relative w-full">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className="peer relative z-10 w-full h-12 px-4 py-3.5 pr-12 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] font-medium text-base outline-none shadow-sm transition-all duration-300 ease-in-out hover:border-purple-400/50 dark:hover:border-purple-500/50 focus:border-transparent focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 focus:shadow-lg focus:shadow-purple-500/20 dark:focus:shadow-purple-400/20 focus:bg-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
          placeholder={placeholder}
          {...rest}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)] hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200 p-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/20 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
});

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
