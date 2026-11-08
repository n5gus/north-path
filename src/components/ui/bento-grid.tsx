/**
 * Adapted from Magic UI Bento Grid.
 * Upstream: https://github.com/magicuidesign/magicui/blob/main/apps/www/registry/magicui/bento-grid.tsx
 * Docs: https://magicui.design/docs/components/bento-grid
 * Copyright (c) Magic UI. MIT License. See THIRD_PARTY/magicui-LICENSE.md.
 *
 * Local changes (North Path, November 7, 2026):
 * - Dropped the hover-only call to action. The link is always visible.
 * - Dropped Radix icons, the shadcn Button dependency, and the demo animations.
 * - Relaxed the fixed 22rem row height so the grid can sit in a sidebar.
 * Card shell, named slots, and grid composition follow the Magic UI component.
 */

import {
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";

export interface BentoGridProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export interface BentoCardProps extends ComponentPropsWithoutRef<"div"> {
  name: string;
  description: string;
  href: string;
  cta: string;
  Icon: React.ElementType;
  background?: ReactNode;
  emphasis?: boolean;
}

export function BentoGrid({ children, className = "", ...props }: BentoGridProps) {
  return (
    <div
      className={`grid w-full auto-rows-auto grid-cols-1 gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  description,
  href,
  cta,
  Icon,
  background,
  emphasis = false,
  className = "",
  ...props
}: BentoCardProps) {
  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border shadow-[0_1px_0_rgba(20,32,51,0.04),0_12px_28px_-20px_rgba(20,32,51,0.45)] ${
        emphasis
          ? "border-navy bg-navy text-[#f6f1e7]"
          : "border-line bg-card"
      } ${className}`}
      {...props}
    >
      {background ? <div className="pointer-events-none">{background}</div> : null}
      <div className="flex flex-col gap-3 p-4">
        <div className="flex items-start gap-3">
          <Icon
            className={`mt-0.5 h-5 w-5 shrink-0 ${emphasis ? "text-[#9fd9d4]" : "text-teal"}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h3 className={`font-display text-lg leading-tight ${emphasis ? "text-[#f6f1e7]" : "text-navy"}`}>
              {name}
            </h3>
            <p className={`mt-1 text-sm leading-relaxed ${emphasis ? "text-[#f3ecdf]" : "text-muted"}`}>
              {description}
            </p>
          </div>
        </div>
        <a
          href={href}
          className={`inline-flex w-fit items-center gap-1 text-sm font-semibold underline underline-offset-4 ${
            emphasis ? "text-[#9fd9d4] decoration-[#9fd9d4]/50" : "text-teal decoration-teal/40"
          }`}
        >
          {cta}
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </div>
  );
}
