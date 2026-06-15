import { Box, Typography } from "@mui/material";
import logoSrc from "@/assets/images/logo.png";
import FaviconImage from "@/assets/images/favicon.png";

interface LogoProps {
  collapsed?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "white";
  height?: number;
  showText?: boolean;
}

const sizes = {
  sm: { logoHeight: 100, title: "subtitle2" as const },
  md: { logoHeight: 120, title: "h6" as const },
  lg: { logoHeight: 120, title: "h5" as const },
};

export function Logo({
  collapsed = false,
  size = "md",
  variant = "default",
  height,
  showText = true,
}: LogoProps) {
  const s = sizes[size];
  const textColor = variant === "white" ? "#ffffff" : "text.primary";
  const subColor =
    variant === "white" ? "rgba(255,255,255,0.7)" : "text.secondary";

  return (
    <Box display="flex" alignItems="center" gap={1.25}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor:
            variant === "white" ? "rgba(255,255,255,0.1)" : "#1566c01f",
          borderRadius: 1,
          p: 0.5,
        }}
      >
        <Box
          component="img"
          src={collapsed ? FaviconImage : logoSrc}
          alt="DAS"
          sx={{
            height: height ?? { xs: 50, sm: 100, md: 100 },
            width: "auto",
            objectFit: "contain",
            flexShrink: 0,
            display: "block",
            filter: variant === "white" ? "brightness(0) invert(1)" : "none",
            userSelect: "none",
            pointerEvents: "none",
          }}
        />
      </Box>

      {!collapsed && showText && (
        <Box>
          <Typography
            variant={s.title}
            fontWeight={700}
            color={textColor}
            lineHeight={1.1}
            noWrap
          >
            DAS
          </Typography>
          <Typography
            variant="caption"
            color={subColor}
            lineHeight={1.2}
            display="block"
          >
            Point of Sale
          </Typography>
        </Box>
      )}
    </Box>
  );
}
