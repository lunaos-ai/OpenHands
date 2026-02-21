# OpenHands vs OpenClaw Capability Gap Report

Generated: 2026-02-18T12:39:12.703421Z

## Scope
- OpenHands: `/Users/shaharsolomon/dev/projects/02_AI_AGENTS/lunaos-repos/OpenHands`
- OpenClaw: `/Users/shaharsolomon/openclaw/openclaw`

## Counts
- OpenHands skills: 25
- OpenHands agents: 6
- OpenHands enterprise integrations: 6
- OpenClaw channels: 27
- OpenClaw nodes: 7
- OpenClaw extensions: 36
- OpenClaw skills: 52

## Top Gaps
`skills_only_in_openclaw` (first 20):
- 1password
- apple-notes
- apple-reminders
- bear-notes
- blogwatcher
- blucli
- bluebubbles
- camsnap
- canvas
- clawhub
- coding-agent
- discord
- eightctl
- food-order
- gemini
- gifgrep
- gog
- goplaces
- healthcheck
- himalaya

`skills_only_in_openhands` (all):
- add_agent
- add_repo_inst
- address_pr_comments
- agent-builder
- agent_memory
- azure_devops
- bitbucket
- code-review
- codereview-roasted
- default-tools
- docker
- fix-py-line-too-long
- fix_test
- flarglebargle
- gitlab
- kubernetes
- npm
- onboarding
- pdflatex
- security
- ssh
- swift-linux
- update_pr_description
- update_test

`channel_style_integrations_missing_in_openhands` (first 20):
- bluebubbles
- broadcast-groups
- channel-routing
- discord
- feishu
- googlechat
- grammy
- group-messages
- groups
- imessage
- irc
- line
- location
- matrix
- mattermost
- msteams
- nextcloud-talk
- nostr
- pairing
- signal

`enterprise_integrations_missing_in_openclaw`:
- github
- gitlab
- jira
- jira_dc
- linear

## Notes
- Static repository capability audit, not runtime verification.
- OpenClaw is channel/node/extension heavy; OpenHands is agent/runtime/enterprise-integration heavy.
