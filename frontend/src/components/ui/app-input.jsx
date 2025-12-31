import React from 'react';

const AppInput = React.forwardRef((props, ref) => {
  const { label, placeholder, icon, ...rest } = props;

  return (
    <div className="w-full min-w-[200px] relative">
      {label && <label className='block mb-2 text-sm font-medium text-foreground'>
        {label}
      </label>}
      <div className="relative w-full">
        <input
          ref={ref}
          type="text"
          className={`peer relative z-10 w-full h-12 px-4 py-3.5 rounded-xl border-2 border-border bg-background/50 text-foreground placeholder:text-muted-foreground font-medium text-base outline-none shadow-sm transition-all duration-300 ease-in-out hover:border-primary/50 focus:border-transparent focus:ring-2 focus:ring-primary/50 focus:shadow-lg focus:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed ${icon ? 'pr-12' : ''} [&:-webkit-autofill]:!bg-background [&:-webkit-autofill]:!shadow-[0_0_0_1000px_hsl(var(--background))_inset] [&:-webkit-autofill]:!text-white [&:-webkit-autofill]:![-webkit-text-fill-color:#ffffff] transition-colors caret-foreground`}
          placeholder={placeholder}
          {...rest}
        />
        {icon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
});

AppInput.displayName = "AppInput";

export { AppInput };
