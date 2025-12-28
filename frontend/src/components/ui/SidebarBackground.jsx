import React from 'react';

/**
 * Animated background for sidebar areas with floating shapes and gradients.
 * Creates a futuristic, modern aesthetic with subtle motion.
 * 
 * @param {Object} props
 * @param {'left' | 'right'} props.position - Which sidebar this is for (affects animation direction)
 */
export function SidebarBackground({ position = 'left' }) {
  const isRight = position === 'right';
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base gradient layer */}
      <div className={`
        absolute inset-0 
        bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent
        dark:from-transparent dark:via-primary/[0.05] dark:to-transparent
      `} />

      {/* Floating Orb 1 - Large, slow */}
      <div 
        className={`
          absolute w-64 h-64 rounded-full blur-3xl
          bg-gradient-to-br from-blue-400/20 via-purple-400/15 to-pink-400/20
          dark:from-blue-500/15 dark:via-purple-500/20 dark:to-cyan-500/15
          animate-float-slow
          motion-reduce:animate-none motion-reduce:opacity-50
        `}
        style={{
          top: '10%',
          [isRight ? 'right' : 'left']: '-30%',
          animationDelay: isRight ? '-5s' : '0s',
        }}
      />

      {/* Floating Orb 2 - Medium, medium speed */}
      <div 
        className={`
          absolute w-48 h-48 rounded-full blur-2xl
          bg-gradient-to-tr from-indigo-400/25 via-violet-400/20 to-fuchsia-400/15
          dark:from-indigo-500/20 dark:via-violet-500/25 dark:to-blue-500/20
          animate-float-medium
          motion-reduce:animate-none motion-reduce:opacity-50
        `}
        style={{
          top: '45%',
          [isRight ? 'right' : 'left']: '-20%',
          animationDelay: isRight ? '-8s' : '-3s',
        }}
      />

      {/* Floating Orb 3 - Small, faster */}
      <div 
        className={`
          absolute w-32 h-32 rounded-full blur-xl
          bg-gradient-to-bl from-cyan-400/20 via-teal-400/15 to-emerald-400/20
          dark:from-cyan-500/25 dark:via-teal-500/20 dark:to-blue-500/15
          animate-float-fast
          motion-reduce:animate-none motion-reduce:opacity-50
        `}
        style={{
          top: '75%',
          [isRight ? 'right' : 'left']: '-15%',
          animationDelay: isRight ? '-2s' : '-6s',
        }}
      />

      {/* Subtle grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radial glow from edge */}
      <div 
        className={`
          absolute inset-y-0 w-1/2
          ${isRight ? 'left-0' : 'right-0'}
          bg-gradient-to-${isRight ? 'r' : 'l'} from-transparent to-primary/[0.02]
          dark:to-primary/[0.04]
        `}
      />
    </div>
  );
}
