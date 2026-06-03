import type { ComponentPropsWithoutRef, ElementType } from "react";

type Variant =
  | "headline-1"
  | "headline-2"
  | "headline-3"
  | "headline-4"
  | "headline-5"
  | "title-1"
  | "title-2"
  | "title-3"
  | "title-4"
  | "label-1"
  | "label-2"
  | "label-3"
  | "label-4"
  | "body-1"
  | "body-2"
  | "body-3"
  | "body-4";

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

type TypographyVariant = Variant | Partial<Record<Breakpoint | "base", Variant>>;

type TypographyProps<T extends ElementType = "p"> = Omit<ComponentPropsWithoutRef<T>, "as"> & {
  variant: TypographyVariant;
  color?: string;
  as?: T;
  underline?: boolean;
};

const variantClasses: Record<Variant, string> = {
  "headline-1": "text-headline-1",
  "headline-2": "text-headline-2",
  "headline-3": "text-headline-3",
  "headline-4": "text-headline-4",
  "headline-5": "text-headline-5",
  "title-1": "text-title-1",
  "title-2": "text-title-2",
  "title-3": "text-title-3",
  "title-4": "text-title-4",
  "label-1": "text-label-1",
  "label-2": "text-label-2",
  "label-3": "text-label-3",
  "label-4": "text-label-4",
  "body-1": "text-body-1",
  "body-2": "text-body-2",
  "body-3": "text-body-3",
  "body-4": "text-body-4",
};

function buildVariantClasses(variant: TypographyVariant): string {
  if (typeof variant === "string") {
    return variantClasses[variant];
  }

  const breakpointOrder: Array<"base" | Breakpoint> = ["base", "sm", "md", "lg", "xl", "2xl"];

  return breakpointOrder
    .map((breakpoint) => {
      const value = variant[breakpoint];
      if (!value) return "";
      return breakpoint === "base"
        ? variantClasses[value]
        : `${breakpoint}:${variantClasses[value]}`;
    })
    .filter(Boolean)
    .join(" ");
}

function joinClasses(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

export default function Typography<T extends ElementType = "p">({
  variant,
  color = "black",
  as,
  className,
  children,
  underline = false,
  ...props
}: TypographyProps<T>) {
  const Tag = as || "p";
  const textColor = color.startsWith("text-") ? color : `text-${color}`;

  return (
    <Tag
      className={joinClasses(
        buildVariantClasses(variant),
        textColor,
        underline && "underline",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
