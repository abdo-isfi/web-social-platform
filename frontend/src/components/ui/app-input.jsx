import React from 'react';

const AppInput = (props) => {
  const { label, placeholder, icon, ...rest } = props;

  return (
    <div className="w-full min-w-[200px] relative">
      {label && <label className='block mb-2 text-sm font-medium text-foreground'>
        {label}
      </label>}
      <div className="relative w-full">
        <input
          type="text"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
};

export { AppInput };
