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
      {label && <label className='block mb-2 text-sm font-medium text-foreground'>
        {label}
      </label>}
      <div className="relative w-full">
        <input
          ref={ref}
          type={showPassword ? "text" : "password"}
          className="peer relative z-10 w-full h-12 px-4 py-3.5 pr-12 rounded-xl border-2 border-border bg-background/50 text-foreground placeholder:text-muted-foreground font-medium text-base outline-none shadow-sm transition-all duration-300 ease-in-out hover:border-primary/50 focus:border-transparent focus:ring-2 focus:ring-primary/50 focus:shadow-lg focus:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed [&:-webkit-autofill]:!bg-background [&:-webkit-autofill]:!shadow-[0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:!text-white [&:-webkit-autofill]:![-webkit-text-fill-color:#ffffff] transition-colors caret-foreground"
          placeholder={placeholder}
          {...rest}
        />
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-muted-foreground hover:text-primary transition-colors duration-200 p-1 rounded-lg hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
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
