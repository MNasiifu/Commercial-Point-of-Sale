import { Stack, type StackProps } from "@mui/material";

/**
 * A Stack that switches from column (mobile) to row (desktop)
 * and stretches children to full width on mobile.
 */
export function ResponsiveStack(props: StackProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "stretch", sm: "flex-start" }}
      {...props}
    />
  );
}

/** Sx object to make a child fill width on mobile but shrink on desktop. */
export function responsiveWidth(
  minWidth?: number | string,
): Record<string, unknown> {
  return {
    width: { xs: "100%", sm: "auto" },
    ...(minWidth ? { minWidth: { sm: minWidth } } : {}),
  };
}
