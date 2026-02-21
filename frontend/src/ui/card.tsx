import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/utils/utils";

const cardVariants = cva(
  "w-full flex flex-col rounded-2xl p-5 border border-[var(--hig-border)] bg-[var(--hig-surface)] shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-xl relative",
  {
    variants: {
      gap: {
        default: "gap-3",
        large: "gap-6",
      },
      minHeight: {
        default: "min-h-[286px] md:min-h-auto",
        small: "min-h-[263.5px]",
      },
    },
    defaultVariants: {
      gap: "default",
      minHeight: "default",
    },
  },
);

interface CardProps extends VariantProps<typeof cardVariants> {
  children: ReactNode;
  className?: string;
  testId?: string;
}

export function Card({
  children,
  className = "",
  testId,
  gap,
  minHeight,
}: CardProps) {
  return (
    <div
      data-testid={testId}
      className={cn(cardVariants({ gap, minHeight }), className)}
    >
      {children}
    </div>
  );
}
