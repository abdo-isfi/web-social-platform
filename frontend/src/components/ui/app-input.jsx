import React from 'react';

const AppInput = (props) => {
  const { label, placeholder, icon, ...rest } = props;

  return (
    <div className="w-full min-w-[200px] relative">
      {label && <label className='block mb-2 text-sm font-medium text-[var(--color-text-primary)]'>
        {label}
      </label>}
      <div className="relative w-full">
        <input
          type="text"
          className={`peer relative z-10 w-full h-12 px-4 py-3.5 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] font-medium text-base outline-none shadow-sm transition-all duration-300 ease-in-out hover:border-purple-400/50 dark:hover:border-purple-500/50 focus:border-transparent focus:ring-2 focus:ring-purple-500/50 dark:focus:ring-purple-400/50 focus:shadow-lg focus:shadow-purple-500/20 dark:focus:shadow-purple-400/20 focus:bg-[var(--color-bg)] disabled:opacity-50 disabled:cursor-not-allowed ${icon ? 'pr-12' : ''}`}
          placeholder={placeholder}
          {...rest}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-[var(--color-text-secondary)]">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export { AppInput };
