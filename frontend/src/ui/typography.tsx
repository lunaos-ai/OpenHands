import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "#/utils/utils";

const typographyVariants = cva("", {
  variants: {
    variant: {
      h1: "text-[32px] md:text-[40px] text-[var(--hig-text-primary)] font-semibold leading-[1.08] tracking-[-0.03em]",
      h2: "text-[22px] font-semibold leading-7 tracking-[-0.02em] text-[var(--hig-text-primary)]",
      h3: "text-sm font-semibold text-[var(--hig-text-secondary)]",
      span: "text-[15px] font-normal text-[var(--hig-text-secondary)] leading-6",
      codeBlock:
        "font-mono text-sm leading-relaxed text-[var(--hig-text-secondary)] whitespace-pre-wrap",
    },
  },
  defaultVariants: {
    variant: "h1",
  },
});

interface TypographyProps extends VariantProps<typeof typographyVariants> {
  className?: string;
  testId?: string;
  children: React.ReactNode;
}

export function Typography({
  variant,
  className,
  testId,
  children,
}: TypographyProps) {
  const Tag = variant as keyof React.JSX.IntrinsicElements;

  return (
    <Tag
      data-testid={testId}
      className={cn(typographyVariants({ variant }), className)}
    >
      {children}
    </Tag>
  );
}

export function H1({
  className,
  testId,
  children,
}: Omit<TypographyProps, "variant">) {
  return (
    <Typography variant="h1" className={className} testId={testId}>
      {children}
    </Typography>
  );
}

export function H2({
  className,
  testId,
  children,
}: Omit<TypographyProps, "variant">) {
  return (
    <Typography variant="h2" className={className} testId={testId}>
      {children}
    </Typography>
  );
}

export function H3({
  className,
  testId,
  children,
}: Omit<TypographyProps, "variant">) {
  return (
    <Typography variant="h3" className={className} testId={testId}>
      {children}
    </Typography>
  );
}

export function Text({
  className,
  testId,
  children,
}: Omit<TypographyProps, "variant">) {
  return (
    <Typography variant="span" className={className} testId={testId}>
      {children}
    </Typography>
  );
}

export function CodeBlock({
  className,
  testId,
  children,
}: Omit<TypographyProps, "variant">) {
  return (
    <Typography variant="codeBlock" className={className} testId={testId}>
      {children}
    </Typography>
  );
}

Typography.H1 = H1;
Typography.H2 = H2;
Typography.H3 = H3;
Typography.Text = Text;
Typography.CodeBlock = CodeBlock;
