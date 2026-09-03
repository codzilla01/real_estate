import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <FileQuestion className="h-20 w-20 text-gold/60" aria-hidden="true" />
      <h1 className="text-4xl font-black">404</h1>
      <p className="text-lg font-bold">{t("title")}</p>
      <p className="max-w-md text-sm text-muted-foreground">{t("desc")}</p>
      <Link href="/">
        <Button variant="gold">{t("backHome")}</Button>
      </Link>
    </div>
  );
}
