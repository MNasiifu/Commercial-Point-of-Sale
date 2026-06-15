import { Box, useTheme, useMediaQuery } from "@mui/material";
import Grid from "@mui/material/Grid2";
import type { ReactNode } from "react";
import { Logo } from "@/components/atoms/Logo/Logo";

interface Props {
  children: ReactNode;
}

/**
 * Refactored AuthTemplate
 *
 * Key Improvements:
 * 1. Replaced flex layout with MUI Grid for true 12-column responsive architecture
 * 2. Left branding panel = 7/12 columns on desktop (md+)
 * 3. Right form panel = 5/12 columns on desktop (md+)
 * 4. Mobile = Right panel takes full width, branding hidden
 * 5. Better scalability for future layout adjustments
 * 6. Cleaner separation of responsive logic from layout logic
 */
export function AuthTemplate({ children }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Grid container sx={{ minHeight: "100vh" }}>
        {/* LEFT BRANDING PANEL — 7 Columns Desktop */}
        {!isMobile && (
          <Grid
            size={{ md: 7 }}
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
              background:
                "linear-gradient(150deg, #0D47A1 0%, #1565C0 40%, #00796B 100%)",
              px: { md: 6, lg: 10 },
            }}
          >
            {/* Decorative circles */}
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  width: 400,
                  height: 400,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  top: -100,
                  right: -100,
                },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.04)",
                  bottom: -80,
                  left: -80,
                },
              }}
            />

            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              gap={4}
              zIndex={1}
            >
              <Logo size="lg" variant="white" />

              <Box maxWidth={420} textAlign="center" color="white">
                {/* Main description */}
                <Box
                  component="p"
                  sx={{
                    fontSize: "1.125rem",
                    lineHeight: 1.8,
                    opacity: 0.92,
                    mb: 4,
                  }}
                >
                  Your trusted Point of Sale solution for Ugandan medical drug
                  shops. Fast, compliant, and built for professionals.
                </Box>

                {/* Feature highlights */}
                <Box>
                  {[
                    "✓ Uganda VAT & EFRIS compliant",
                    "✓ FEFO batch-tracked inventory",
                    "✓ Real-time analytics dashboard",
                    "✓ Works offline automatically",
                  ].map((feature) => (
                    <Box
                      key={feature}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 1.5,
                        fontSize: "0.95rem",
                        opacity: 0.88,
                      }}
                    >
                      {feature}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>

            {/* Footer business info */}
            <Box
              sx={{
                position: "absolute",
                bottom: 24,
                width: "100%",
                textAlign: "center",
                color: "rgba(255,255,255,0.55)",
                fontSize: "0.75rem",
                zIndex: 1,
              }}
            >
             Nakasero · Kampala, Uganda
            </Box>
          </Grid>
        )}

        {/* RIGHT FORM PANEL — 5 Columns Desktop / 12 Columns Mobile */}
        <Grid
          size={{ xs: 12, md: 5 }}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            px: { xs: 3, sm: 5, md: 6 },
            py: { xs: 4, md: 0 },
          }}
        >
          <Box
            width="100%"
            maxWidth={520}
            display="flex"
            flexDirection="column"
            justifyContent="center"
          >
            {/* Mobile Logo */}
            {isMobile && (
              <Box mb={4} display="flex" justifyContent="center">
                <Logo size="lg" />
              </Box>
            )}

            {children}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}