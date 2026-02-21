import { ConnectToProviderMessage } from "./connect-to-provider-message";
import { RepositorySelectionForm } from "./repo-selection-form";
import { useUserProviders } from "#/hooks/use-user-providers";
import { GitRepository } from "#/types/git";

interface RepoConnectorProps {
  onRepoSelection: (repo: GitRepository | null) => void;
}

export function RepoConnector({ onRepoSelection }: RepoConnectorProps) {
  const { providers, isLoadingSettings } = useUserProviders();

  const providersAreSet = providers.length > 0;

  return (
    <section
      data-testid="repo-connector"
      className="w-full flex flex-col gap-6 rounded-2xl p-5 border border-[var(--hig-border)] bg-[var(--hig-surface)] shadow-[0_20px_50px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] min-h-[263.5px] relative backdrop-blur-xl"
    >
      {!providersAreSet && <ConnectToProviderMessage />}
      {providersAreSet && (
        <RepositorySelectionForm
          onRepoSelection={onRepoSelection}
          isLoadingSettings={isLoadingSettings}
        />
      )}
    </section>
  );
}
