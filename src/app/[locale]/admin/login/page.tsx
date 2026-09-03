"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, LogIn, KeyRound, Mail } from "lucide-react";
import { loginSchema, type LoginFormValues } from "@/schemas";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { adminService } from "@/lib/admin-service";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const locale = useLocale() as "ar" | "en";
  const t = useTranslations("auth");
  const { signIn } = useAuth();
  const router = useRouter();
  const [demoFilling, setDemoFilling] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await signIn(values.email, values.password);
      toast.success(t("welcomeBack"));
      router.push(`/${locale}/admin/dashboard`);
      router.refresh();
    } catch {
      toast.error(t("invalidCredentials"));
    }
  };

  const fillDemo = async () => {
    setDemoFilling(true);
    setValue("email", "demo@almaktab.ae");
    setValue("password", "demo1234");
    await new Promise((r) => setTimeout(r, 300));
    setDemoFilling(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(212_175_55/0.12),transparent_55%)]"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md">
        <Card className="glass border-gold/20 shadow-luxury">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold-gradient shadow-gold-glow">
              <Building2 className="h-7 w-7 text-black" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">{t("title")}</CardTitle>
            <CardDescription>{t("subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">{t("emailLabel")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" aria-hidden="true" />
                  <Input
                    id="login-email"
                    type="email"
                    dir="ltr"
                    placeholder="demo@almaktab.ae"
                    className={cn("pl-9 rtl:pl-3 rtl:pr-9", errors.email && "border-destructive")}
                    {...register("email")}
                  />
                </div>
                {errors.email && <p className="text-xs text-destructive">{t("invalidCredentials")}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">{t("passwordLabel")}</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:left-auto rtl:right-3" aria-hidden="true" />
                  <Input
                    id="login-password"
                    type="password"
                    dir="ltr"
                    placeholder="••••••••"
                    className={cn("pl-9 rtl:pl-3 rtl:pr-9", errors.password && "border-destructive")}
                    {...register("password")}
                  />
                </div>
                {errors.password && <p className="text-xs text-destructive">{t("invalidCredentials")}</p>}
              </div>

              <Button type="submit" variant="gold" className="w-full" disabled={isSubmitting}>
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {isSubmitting ? t("signingIn") : t("signIn")}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-3 text-xs text-muted-foreground">{t("demoAccess")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={fillDemo}
                disabled={demoFilling}
              >
                {demoFilling ? t("signingIn") : t("demoAccess")}
              </Button>
              {adminService.mode === "demo" && (
                <p className="text-center text-[11px] text-muted-foreground">{t("demoHint")}</p>
              )}
              <div className="flex justify-center gap-2 pt-1">
                <Badge variant="muted" className="font-mono text-[10px]" dir="ltr">
                  demo@almaktab.ae / demo1234
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
