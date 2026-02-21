import { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/utils/utils";

const cardTitleVariants = cva("flex items-center", {
  variants: {
    gap: {
      default: "gap-2.5",
    },
    textSize: {
      default: "text-[17px]",
    },
    fontWeight: {
      default: "font-semibold",
    },
    textColor: {
      default: "text-[var(--hig-text-primary)]",
    },
    lineHeight: {
      default: "leading-6",
    },
  },
  defaultVariants: {
    gap: "default",
    textSize: "default",
    fontWeight: "default",
    textColor: "default",
    lineHeight: "default",
  },
});

interface CardTitleProps extends VariantProps<typeof cardTitleVariants> {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function CardTitle({
  icon,
  children,
  className = "",
  gap,
  textSize,
  fontWeight,
  textColor,
  lineHeight,
}: CardTitleProps) {
  return (
    <div
      className={cn(
        cardTitleVariants({
          gap,
          textSize,
          fontWeight,
          textColor,
          lineHeight,
        }),
        className,
      )}
    >
      {icon}
      <span
        className={cn(
          cardTitleVariants({
            lineHeight,
            textSize,
            fontWeight,
            textColor,
          }),
          "flex items-center",
        )}
      >
        {children}
      </span>
    </div>
  );
}
