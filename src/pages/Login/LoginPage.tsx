import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthTemplate } from "@/components/templates/AuthTemplate/AuthTemplate";
import { FormTextField } from "@/components/molecules/FormField/FormField";
import { useAuth } from "@/hooks/auth/useAuth";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const profile = await signIn(values.email, values.password);
      if (profile?.must_change_password) {
        navigate("/change-password", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      // User-friendly Supabase error messages
      if (msg.includes("Invalid login credentials")) {
        setServerError("Incorrect email or password. Please try again.");
      } else if (msg.includes("Email not confirmed")) {
        setServerError("Account not verified. Contact your administrator.");
      } else {
        setServerError(msg);
      }
    }
  };

  return (
    <AuthTemplate>
      <Box>
        {/* Heading */}
        <Typography variant="h4" fontWeight={700} mb={0.75}>
          Sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Enter your credentials to access DAS POS
        </Typography>

        {serverError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {serverError}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          display="flex"
          flexDirection="column"
          gap={2.5}
        >
          <FormTextField
            name="email"
            control={control}
            label="Email address"
            type="email"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />

          <FormTextField
            name="password"
            control={control}
            label="Password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            disabled={isSubmitting}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <VisibilityOffIcon fontSize="small" />
                    ) : (
                      <VisibilityIcon fontSize="small" />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting}
            sx={{ mt: 1, height: 48 }}
          >
            {isSubmitting ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Sign in"
            )}
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography
          variant="caption"
          color="text.secondary"
          display="block"
          textAlign="center"
        >
          Accounts are created by your administrator.
        </Typography>
      </Box>
    </AuthTemplate>
  );
}
