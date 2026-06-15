import { Button, Tooltip } from "@mui/material";
import InstallMobileIcon from "@mui/icons-material/InstallMobile";
import { useInstallPrompt } from "@/hooks/app/useInstallPrompt";

export function InstallPrompt() {
  const { canInstall, triggerInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <Tooltip title="Install DAS POS as an app" arrow>
      <Button
        size="small"
        variant="outlined"
        startIcon={<InstallMobileIcon fontSize="small" />}
        onClick={triggerInstall}
        sx={{ mr: 1, fontSize: "0.75rem", py: 0.5 }}
      >
        Install app
      </Button>
    </Tooltip>
  );
}
