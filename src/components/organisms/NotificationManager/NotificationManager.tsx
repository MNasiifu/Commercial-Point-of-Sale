import { Snackbar, Alert } from "@mui/material";
import { useNotificationStore } from "@/store/notificationStore";

export function NotificationManager() {
  const { notifications, remove } = useNotificationStore();

  return (
    <>
      {notifications.map((n) => (
        <Snackbar
          key={n.id}
          open
          autoHideDuration={n.duration ?? 4000}
          onClose={() => remove(n.id)}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          // sx={{ mt: { xs: 16 + idx * 64, sm: 24 + idx * 72 } }}
        >
          <Alert
            severity={n.severity}
            variant="filled"
            onClose={() => remove(n.id)}
            sx={{ minWidth: 280, borderRadius: 2 }}
          >
            {n.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
}
