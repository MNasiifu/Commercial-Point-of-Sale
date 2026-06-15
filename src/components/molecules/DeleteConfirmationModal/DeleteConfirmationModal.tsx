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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

interface DeleteConfirmationModalProps {
  open: boolean;
  title: string;
  itemName: string;
  description?: string;
  warningMessage?: string;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  confirmButtonText?: string;
}

/**
 * Generic delete confirmation modal component
 * Provides a consistent UX for delete operations across the application
 *
 * @example
 * <DeleteConfirmationModal
 *   open={deleteConfirm !== null}
 *   title="Delete product?"
 *   itemName={deleteConfirm?.name}
 *   description="You are about to permanently delete this product."
 *   warningMessage="This action cannot be undone. All associated data will be lost."
 *   isPending={deleteMutation.isPending}
 *   onConfirm={() => {
 *     deleteMutation.mutate(deleteConfirm!.id);
 *     setDeleteConfirm(null);
 *   }}
 *   onClose={() => setDeleteConfirm(null)}
 * />
 */
export function DeleteConfirmationModal({
  open,
  title,
  itemName,
  description,
  warningMessage,
  isPending,
  onConfirm,
  onClose,
  confirmButtonText = "Delete",
}: DeleteConfirmationModalProps) {
  return (
    <Dialog
      open={open}
      onClose={isPending ? undefined : onClose} // block backdrop-click while pending
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          elevation: 4,
          sx: { borderRadius: 3 },
        },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────── */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          pb: 1,
          pt: 2.5,
          px: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "error.lighter",
            flexShrink: 0,
          }}
        >
          <DeleteOutlineIcon color="error" fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
          {title}
        </Typography>
      </DialogTitle>

      <Divider />

      {/* ── Body ───────────────────────────────────────────────── */}
      <DialogContent sx={{ px: 3, pt: 2.5, pb: 1.5 }}>
        {description && (
          <DialogContentText
            component="div"
            sx={{ color: "text.primary", fontSize: "0.9rem" }}
          >
            {description}{" "}
            <Typography
              component="span"
              fontWeight={700}
              color="text.primary"
              fontSize="inherit"
            >
              {itemName}
            </Typography>
            .
          </DialogContentText>
        )}

        {warningMessage && (
          <DialogContentText
            sx={{
              mt: description ? 1.5 : 0,
              p: 1.5,
              bgcolor: "error.lighter",
              borderRadius: 2,
              color: "error.dark",
              fontSize: "0.82rem",
              fontWeight: 500,
            }}
          >
            ⚠️ {warningMessage}
          </DialogContentText>
        )}
      </DialogContent>

      {/* ── Actions ────────────────────────────────────────────── */}
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
          color="error"
          onClick={onConfirm}
          disabled={isPending}
          startIcon={
            isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DeleteOutlineIcon />
            )
          }
          sx={{ flex: 1, borderRadius: 2, fontWeight: 600 }}
        >
          {isPending ? `${confirmButtonText}…` : confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
