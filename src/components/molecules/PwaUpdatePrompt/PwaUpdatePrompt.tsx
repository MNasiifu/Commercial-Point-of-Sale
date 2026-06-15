import { useState } from "react";
import { Alert, Button, Collapse } from "@mui/material";
import SystemUpdateIcon from "@mui/icons-material/SystemUpdate";
import { useRegisterSW } from "virtual:pwa-register/react";

export function PwaUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Poll for updates every 60 minutes
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
    },
  });

  const handleUpdate = () => updateServiceWorker(true);

  return (
    <Collapse in={needRefresh && !dismissed} unmountOnExit>
      <Alert
        severity="info"
        icon={<SystemUpdateIcon fontSize="small" />}
        action={
          <>
            <Button
              size="small"
              color="inherit"
              onClick={handleUpdate}
              sx={{ mr: 0.5 }}
            >
              Update now
            </Button>
            <Button
              size="small"
              color="inherit"
              onClick={() => setDismissed(true)}
            >
              Later
            </Button>
          </>
        }
        sx={{
          borderRadius: 0,
          py: 0.5,
          "& .MuiAlert-message": { fontSize: "0.8rem" },
        }}
      >
        A new version of DAS POS is available.
      </Alert>
    </Collapse>
  );
}
