import { useTranslation } from "react-i18next";
import { Typography } from "#/ui/typography";

export function HomeHeaderTitle() {
  const { t } = useTranslation();

  return (
    <div className="min-h-[88px] flex items-center justify-center text-center px-2">
      <Typography.H1>{t("HOME$LETS_START_BUILDING")}</Typography.H1>
    </div>
  );
}
