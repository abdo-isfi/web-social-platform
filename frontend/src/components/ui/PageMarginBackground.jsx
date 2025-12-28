import React from 'react';

/**
 * Futuristic background decoration for page margins.
 * Displays animated floating shapes and gradients in the empty space
 * outside the main content area.
 * 
 * @param {'left' | 'right'} position - Which side of the page
 */
export function PageMarginBackground({ position = 'left' }) {
  const isRight = position === 'right';
  
  return (
    <div 
      className={`
        fixed top-0 bottom-0 pointer-events-none z-0
        hidden lg:block
        ${isRight ? 'right-0 w-[10vw] xl:w-[17.5vw]' : 'left-0 w-[10vw] xl:w-[17.5vw]'}
      `}
    >
      {/* Gradient base layer */}
      <div className={`
        absolute inset-0
        bg-gradient-to-${isRight ? 'l' : 'r'} 
        from-transparent via-primary/[0.03] to-primary/[0.08]
        dark:via-primary/[0.05] dark:to-primary/[0.12]
      `} />

      {/* Large floating orb */}
      <div 
        className={`
          absolute w-96 h-96 rounded-full blur-[100px]
          bg-gradient-to-br from-blue-500/30 via-purple-500/25 to-pink-500/30
          dark:from-blue-600/25 dark:via-purple-600/30 dark:to-cyan-500/25
          animate-float-slow
          motion-reduce:animate-none
        `}
        style={{
          top: '5%',
          [isRight ? 'right' : 'left']: '-20%',
          animationDelay: isRight ? '-7s' : '0s',
        }}
      />

      {/* Medium floating orb */}
      <div 
        className={`
          absolute w-72 h-72 rounded-full blur-[80px]
          bg-gradient-to-tr from-indigo-500/35 via-violet-500/30 to-fuchsia-500/25
          dark:from-indigo-600/30 dark:via-violet-600/35 dark:to-blue-600/30
          animate-float-medium
          motion-reduce:animate-none
        `}
        style={{
          top: '40%',
          [isRight ? 'right' : 'left']: '-10%',
          animationDelay: isRight ? '-12s' : '-4s',
        }}
      />

      {/* Small fast orb */}
      <div 
        className={`
          absolute w-48 h-48 rounded-full blur-[60px]
          bg-gradient-to-bl from-cyan-500/30 via-teal-500/25 to-emerald-500/30
          dark:from-cyan-600/35 dark:via-teal-600/30 dark:to-blue-600/25
          animate-float-fast
          motion-reduce:animate-none
        `}
        style={{
          top: '70%',
          [isRight ? 'right' : 'left']: '-5%',
          animationDelay: isRight ? '-2s' : '-8s',
        }}
      />

      {/* Accent orb near bottom */}
      <div 
        className={`
          absolute w-64 h-64 rounded-full blur-[70px]
          bg-gradient-to-t from-rose-500/20 via-orange-500/15 to-amber-500/20
          dark:from-rose-600/25 dark:via-orange-600/20 dark:to-pink-600/25
          animate-pulse-glow
          motion-reduce:animate-none
        `}
        style={{
          bottom: '10%',
          [isRight ? 'right' : 'left']: '-15%',
          animationDelay: isRight ? '-5s' : '-2s',
        }}
      />

      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.8) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
