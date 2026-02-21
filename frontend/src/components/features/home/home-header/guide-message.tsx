import { useTranslation } from "react-i18next";

export function GuideMessage() {
  const { t } = useTranslation();

  return (
    <div className="hig-surface-muted w-fit flex flex-col md:flex-row items-start md:items-center justify-center gap-1.5 rounded-full leading-5 text-[14px] md:text-[15px] text-[var(--hig-text-secondary)] font-medium m-1 px-4 py-1.5 md:px-4 md:py-1">
      <span>{t("HOME$GUIDE_MESSAGE_TITLE")}</span>
      <a
        href="https://docs.all-hands.dev/usage/getting-started"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[var(--hig-accent)] underline underline-offset-2 hover:text-white transition-colors"
      >
        <span>{t("COMMON$CLICK_HERE")}</span>
      </a>
    </div>
  );
}
