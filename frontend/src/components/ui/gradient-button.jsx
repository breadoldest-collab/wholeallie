import React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { Link } from 'react-router-dom';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * GradientButton — Inspired by @prestige/gradient-button (Prestige UI)
 * Features continuous multi-stop animated gradient motion, soft ambient glow,
 * and seamless harmonization with Allié's neo-brutalist design tokens.
 */
const gradientButtonVariants = cva(
  'group relative inline-flex items-center justify-center gap-2.5 overflow-hidden font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:translate-y-0.5',
  {
    variants: {
      variant: {
        // Sunset Rose & Amber Radiant - 100% Purple-Free!
        default:
          'text-white border-[3px] border-[#252b3a] shadow-[5px_5px_0_0_#252b3a] hover:shadow-[7px_7px_0_0_#252b3a] hover:-translate-y-0.5',
        // Radiant sunset neon glow
        glow:
          'text-white border-[3px] border-[#252b3a] shadow-[5px_5px_0_0_#252b3a] hover:shadow-[0_0_24px_rgba(255,120,197,0.55),6px_6px_0_0_#252b3a] hover:-translate-y-0.5',
        // Minimal softer gradient for secondary actions
        subtle:
          'text-[#252b3a] border-[2.5px] border-[#252b3a] shadow-[3px_3px_0_0_#252b3a] hover:shadow-[5px_5px_0_0_#252b3a] hover:-translate-y-0.5',
      },
      size: {
        sm: 'h-9 px-4 text-[11px] rounded-full uppercase tracking-[0.14em]',
        default: 'h-11 px-6 text-[12px] rounded-full uppercase tracking-[0.16em]',
        lg: 'h-14 px-8 text-[14px] rounded-full uppercase tracking-[0.18em]',
        icon: 'h-11 w-11 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const GradientButton = React.forwardRef(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      to,
      animate = true,
      children,
      gradientColors,
      style,
      ...props
    },
    ref
  ) => {
    const Comp = to ? Link : (asChild ? Slot : 'button');

    // Sunset Neon & Amber Rose Palette (100% Purple-Free)
    // Blends vibrant coral (#ff4365), Allié pink (#ff78c5), warm tangerine (#ff9057), and golden amber (#ffd05b)
    const defaultGradient =
      'linear-gradient(115deg, #ff4365 0%, #ff78c5 28%, #ff9057 62%, #ffd05b 88%, #ff4365 100%)';
    const bgGradient = gradientColors ? `linear-gradient(115deg, ${gradientColors.join(', ')})` : defaultGradient;

    const extraProps = to ? { to } : {};

    return (
      <Comp
        ref={ref}
        className={cn(gradientButtonVariants({ variant, size, className }))}
        style={{
          background: bgGradient,
          backgroundSize: '250% 100%',
          animation: animate ? 'prestigeGradientShift 5s ease infinite alternate' : 'none',
          ...style,
        }}
        {...extraProps}
        {...props}
      >
        {/* Soft radial shimmer overlay */}
        <span
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.35) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <Slottable>
          {children}
        </Slottable>
      </Comp>
    );
  }
);

GradientButton.displayName = 'GradientButton';

export default GradientButton;

