import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { getErrorMessage } from '@/services/api';
import { DEMO_USERS, ROLE_LABELS } from '@/lib/constants';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const { user, isLoading: sessionLoading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  if (sessionLoading) return null;
  if (user) return <Navigate to={(location.state as { from?: Location })?.from?.pathname ?? '/'} replace />;

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      await login(values.email, values.password);
      navigate((location.state as { from?: Location })?.from?.pathname ?? '/', { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err, 'Invalid email or password.'));
    }
  };

  const fillDemo = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary">
            <Building2 className="size-6 text-white" aria-hidden />
          </div>
          <h1 className="text-lg font-semibold text-foreground">GovInfra Gujarat</h1>
          <p className="text-sm text-muted-foreground">Government Infrastructure Lifecycle & Workflow Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm" noValidate>
          {serverError && (
            <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-danger">
              {serverError}
            </p>
          )}
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="username" placeholder="you@department.gov.in" aria-invalid={!!errors.email} {...register('email')} />
          </FormField>
          <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" aria-invalid={!!errors.password} {...register('password')} />
          </FormField>
          <Button type="submit" loading={isSubmitting} className="mt-1 w-full">
            {isSubmitting && <Loader2 className="hidden" />}
            Sign in
          </Button>
        </form>

        <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Demo accounts</p>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => fillDemo(u.email, u.password)}
                className="flex items-center justify-between rounded-md border border-border bg-card px-2.5 py-1.5 text-left text-xs hover:bg-muted"
              >
                <span className="font-medium text-foreground">{ROLE_LABELS[u.role]}</span>
                <span className="text-muted-foreground">{u.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
