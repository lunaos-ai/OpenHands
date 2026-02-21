import React from "react";
import { PrefetchPageLinks } from "react-router";
import { HomeHeader } from "#/components/features/home/home-header/home-header";
import { RepoConnector } from "#/components/features/home/repo-connector";
import { TaskSuggestions } from "#/components/features/home/tasks/task-suggestions";
import { GitRepository } from "#/types/git";
import { NewConversation } from "#/components/features/home/new-conversation/new-conversation";
import { RecentConversations } from "#/components/features/home/recent-conversations/recent-conversations";

<PrefetchPageLinks page="/conversations/:conversationId" />;

function HomeScreen() {
  const [selectedRepo, setSelectedRepo] = React.useState<GitRepository | null>(
    null,
  );

  return (
    <div
      data-testid="home-screen"
      className="bg-transparent h-full flex flex-col overflow-y-auto rounded-[18px] px-3 pt-5 pb-4 md:px-5 md:pt-7 lg:px-8 lg:pt-9 custom-scrollbar-always"
    >
      <HomeHeader />

      <div className="pt-7 flex justify-center">
        <div
          className="grid grid-cols-1 gap-5 w-full max-w-[860px] md:grid-cols-2"
          data-testid="home-screen-new-conversation-section"
        >
          <RepoConnector onRepoSelection={(repo) => setSelectedRepo(repo)} />
          <NewConversation />
        </div>
      </div>

      <div className="pt-5 flex justify-center">
        <div
          className="grid grid-cols-1 gap-5 w-full max-w-[860px] md:grid-cols-2"
          data-testid="home-screen-recent-conversations-section"
        >
          <RecentConversations />
          <TaskSuggestions filterFor={selectedRepo} />
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
