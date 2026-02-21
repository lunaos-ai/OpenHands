/**
 * Cloudflare Worker - GitHub Webhook Handler
 * Receives PR events and queues reviews
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { verifyGitHubSignature } from './utils/verify';
import type { Env, GitHubWebhookEvent, ReviewJob } from './types';

const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'code-review-webhook-handler'
  });
});

// GitHub webhook endpoint
app.post('/webhooks/github', async (c) => {
  try {
    // 1. Verify GitHub signature
    const signature = c.req.header('X-Hub-Signature-256');
    const payload = await c.req.text();

    if (!signature || !verifyGitHubSignature(payload, signature, c.env.GITHUB_WEBHOOK_SECRET)) {
      console.error('Invalid webhook signature');
      return c.json({ error: 'Invalid signature' }, 401);
    }

    // 2. Parse event
    const event: GitHubWebhookEvent = JSON.parse(payload);
    const eventType = c.req.header('X-GitHub-Event');

    console.log(`Received GitHub event: ${eventType}, action: ${event.action}`);

    // 3. Handle pull_request events
    if (eventType === 'pull_request') {
      const { action, pull_request, repository, installation } = event;

      // Only review on: opened, synchronize (new commits), reopened
      if (['opened', 'synchronize', 'reopened'].includes(action)) {
        const reviewJob: ReviewJob = {
          id: crypto.randomUUID(),
          type: 'PR_REVIEW',
          prNumber: pull_request.number,
          prTitle: pull_request.title,
          prUrl: pull_request.html_url,
          repoOwner: repository.owner.login,
          repoName: repository.name,
          repoUrl: repository.clone_url,
          prAuthor: pull_request.user.login,
          baseBranch: pull_request.base.ref,
          headBranch: pull_request.head.ref,
          headSha: pull_request.head.sha,
          installationId: installation.id,
          createdAt: new Date().toISOString()
        };

        // 4. Queue review job
        await c.env.REVIEW_QUEUE.send(reviewJob);

        // 5. Post initial comment
        await postPendingComment(reviewJob, c.env);

        console.log(`Queued review job: ${reviewJob.id} for PR #${reviewJob.prNumber}`);

        return c.json({
          message: 'Review queued successfully',
          reviewId: reviewJob.id,
          pr: {
            number: reviewJob.prNumber,
            title: reviewJob.prTitle,
            url: reviewJob.prUrl
          }
        });
      }
    }

    // 4. Handle pull_request_review_comment events (user responds to AI)
    if (eventType === 'pull_request_review_comment') {
      const { action, comment, pull_request } = event;

      if (action === 'created' && comment.body.includes('@codereview-ai')) {
        // User is asking AI to re-review or explain something
        const reReviewJob: ReviewJob = {
          id: crypto.randomUUID(),
          type: 'RE_REVIEW',
          prNumber: pull_request.number,
          // ... rest of fields
          userQuestion: comment.body.replace('@codereview-ai', '').trim()
        };

        await c.env.REVIEW_QUEUE.send(reReviewJob);

        return c.json({
          message: 'Re-review requested',
          reviewId: reReviewJob.id
        });
      }
    }

    return c.json({ message: 'Event processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Queue consumer (processes review jobs)
async function handleReviewJob(batch: MessageBatch<ReviewJob>, env: Env): Promise<void> {
  for (const message of batch.messages) {
    try {
      const job = message.body;
      console.log(`Processing review job: ${job.id}`);

      // Call OpenHands agent service
      const response = await fetch(`${env.OPENHANDS_API_URL}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENHANDS_API_KEY}`
        },
        body: JSON.stringify(job)
      });

      if (!response.ok) {
        throw new Error(`OpenHands API error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Review completed: ${result.reviewId}`);

      message.ack();
    } catch (error) {
      console.error(`Failed to process job ${message.body.id}:`, error);
      message.retry({ delaySeconds: 60 }); // Retry after 1 minute
    }
  }
}

async function postPendingComment(job: ReviewJob, env: Env): Promise<void> {
  // Post a comment that review is in progress
  const comment = `
## 🤖 AI Code Review in Progress...

I'm analyzing this pull request. This usually takes 2-3 minutes.

**What I'm checking:**
- 🔒 Security vulnerabilities
- ✅ Compliance with coding standards
- 🧠 Logic errors and code quality
- 📚 Best practices

I'll post my findings shortly!

---
*Powered by [CodeReviewAI](https://codereview.ai)*
  `.trim();

  // TODO: Post comment via GitHub API
  console.log(`Would post pending comment to PR #${job.prNumber}`);
}

export default {
  fetch: app.fetch,
  queue: handleReviewJob
};
