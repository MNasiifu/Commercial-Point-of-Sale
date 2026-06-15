import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Button,
  CircularProgress,
  Box,
  Typography,
  Divider,
} from "@mui/material";
import ToggleOnIcon  from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import type { UserWithBranch } from "@/services/userService";

interface ToggleUserModalProps {
  open:      boolean;
  user:      UserWithBranch | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose:   () => void;
}

export function ToggleUserModal({
  open,
  user,
  isPending,
  onConfirm,
  onClose,
}: ToggleUserModalProps) {
  if (!user) return null;

  const isActivating = !user.is_active;

  const intent = isActivating
    ? {
        verb:      "Activate",
        verbing:   "Activating",
        color:     "success" as const,
        Icon:      ToggleOnIcon,
        iconBg:    "success.lighter",
        iconColor: "success" as const,
        body:      "This user will be able to log in and access the system.",
        warningBg:    "success.lighter",
        warningColor: "success.dark",
      }
    : {
        verb:      "Deactivate",
        verbing:   "Deactivating",
        color:     "warning" as const,
        Icon:      ToggleOffIcon,
        iconBg:    "warning.lighter",
        iconColor: "warning" as const,
        body:      "This user will no longer be able to log in or access the system.",
        warningBg:    "warning.lighter",
        warningColor: "warning.dark",
      };

  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          elevation: 4,
          sx: { borderRadius: 3 },
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          display:    "flex",
          alignItems: "center",
          gap:  1.5,
          pb:   1,
          pt:   2.5,
          px:   3,
        }}
      >
        <Box
          sx={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            width:          36,
            height:         36,
            borderRadius:   "50%",
            bgcolor:        intent.iconBg,
            flexShrink:     0,
          }}
        >
          <intent.Icon color={intent.iconColor} fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
          {intent.verb} user?
        </Typography>
      </DialogTitle>

      <Divider />

      {/* ── Body ───────────────────────────────────────────── */}
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        <DialogContentText
          component="div"
          sx={{ color: "text.primary", fontSize: "0.9rem" }}
        >
          You are about to {intent.verb.toLowerCase()}{" "}
          <Typography
            component="span"
            fontWeight={700}
            color="text.primary"
            fontSize="inherit"
          >
            {user.full_name}
          </Typography>
          {user.email && (
            <>
              {" "}
              <Typography
                component="span"
                color="text.secondary"
                fontSize="0.82rem"
              >
                ({user.email})
              </Typography>
            </>
          )}
          .
        </DialogContentText>

        <DialogContentText
          sx={{
            mt:         1.5,
            p:          1.5,
            bgcolor:    intent.warningBg,
            borderRadius: 2,
            color:      intent.warningColor,
            fontSize:   "0.82rem",
            fontWeight: 500,
          }}
        >
          {intent.body}
        </DialogContentText>
      </DialogContent>

      {/* ── Actions ────────────────────────────────────────── */}
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={isPending}
          sx={{ flex: 1, borderRadius: 2 }}
        >
          Cancel
        </Button>

        <Button
          variant="contained"
          color={intent.color}
          onClick={onConfirm}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <intent.Icon />
            )
          }
          sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}
        >
          {isPending ? `${intent.verbing}…` : intent.verb}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
