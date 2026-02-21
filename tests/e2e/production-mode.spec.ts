import { test, expect } from '@playwright/test';

/**
 * Production Mode Tests for OpenHands + MCPOverflow Integration
 *
 * Tests verify:
 * 1. Services are healthy and responding
 * 2. Connector generation works end-to-end
 * 3. Job queue system functions correctly
 * 4. Performance meets production requirements
 */

test.describe('Production Mode - Service Health', () => {
  test('OpenHands API health check', async ({ request }) => {
    const response = await request.get('http://localhost:8000/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.healthy).toBe(true);
    expect(body.version).toBe('1.1.0');
    expect(body.capabilities).toContain('analyze_api');
    expect(body.capabilities).toContain('generate_connector');
    expect(body.capabilities).toContain('generate_tests');
  });

  test('MCPOverflow Engine health check', async ({ request }) => {
    const response = await request.get('http://localhost:3001/health');

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('healthy');
    expect(body.openhands.healthy).toBe(true);
    expect(body.openhands.version).toBe('1.1.0');
  });

  test('Services respond within acceptable latency', async ({ request }) => {
    const start = Date.now();
    await request.get('http://localhost:8000/health');
    const openhandsLatency = Date.now() - start;

    const start2 = Date.now();
    await request.get('http://localhost:3001/health');
    const mcpoverflowLatency = Date.now() - start2;

    expect(openhandsLatency).toBeLessThan(100); // <100ms
    expect(mcpoverflowLatency).toBeLessThan(100); // <100ms
  });
});

test.describe('Production Mode - Connector Generation', () => {
  test('Generate connector synchronously', async ({ request }) => {
    const connectorSpec = {
      name: 'test-connector',
      specType: 'openapi',
      spec: {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/test': {
            get: {
              summary: 'Test endpoint',
              operationId: 'getTest',
              responses: {
                '200': { description: 'Success' }
              }
            }
          }
        }
      },
      language: 'typescript',
      runtime: 'cloudflare-workers'
    };

    const start = Date.now();
    const response = await request.post('http://localhost:3001/api/generate-connector', {
      data: connectorSpec,
      timeout: 60000 // 60 seconds
    });
    const duration = Date.now() - start;

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.id).toBeDefined();
    expect(body.name).toBe('test-connector');
    expect(body.code).toBeDefined();

    // Performance check
    expect(duration).toBeLessThan(35000); // <35 seconds

    console.log(`✅ Connector generated in ${duration}ms`);
  });

  test('Generate connector asynchronously', async ({ request }) => {
    const connectorSpec = {
      name: 'async-test-connector',
      specType: 'openapi',
      spec: {
        openapi: '3.0.0',
        info: { title: 'Async Test API', version: '1.0.0' },
        servers: [{ url: 'https://api.example.com' }],
        paths: {
          '/async-test': {
            get: {
              summary: 'Async test endpoint',
              operationId: 'getAsyncTest',
              responses: {
                '200': { description: 'Success' }
              }
            }
          }
        }
      },
      language: 'typescript',
      runtime: 'cloudflare-workers'
    };

    // Create async job
    const jobResponse = await request.post('http://localhost:3001/api/jobs/generate-connector', {
      data: connectorSpec
    });

    expect(jobResponse.ok()).toBeTruthy();

    const jobBody = await jobResponse.json();
    expect(jobBody.jobId).toBeDefined();
    expect(jobBody.status).toBe('queued');
    expect(jobBody.statusUrl).toBeDefined();

    console.log(`✅ Job created: ${jobBody.jobId}`);

    // Poll for completion
    const jobId = jobBody.jobId;
    let attempts = 0;
    const maxAttempts = 12; // 60 seconds (5s intervals)
    let completed = false;

    while (attempts < maxAttempts && !completed) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const statusResponse = await request.get(`http://localhost:3001/api/jobs/${jobId}`);
      const statusBody = await statusResponse.json();

      console.log(`Job status: ${statusBody.status}`);

      if (statusBody.status === 'completed') {
        completed = true;
        expect(statusBody.result).toBeDefined();
        expect(statusBody.duration).toBeLessThan(35000); // <35 seconds
        console.log(`✅ Job completed in ${statusBody.duration}ms`);
      } else if (statusBody.status === 'failed') {
        throw new Error(`Job failed: ${statusBody.error}`);
      }

      attempts++;
    }

    expect(completed).toBe(true);
  });
});

test.describe('Production Mode - Job Queue System', () => {
  test('List all jobs', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/jobs');

    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.jobs).toBeDefined();
    expect(Array.isArray(body.jobs)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(0);

    console.log(`✅ Found ${body.total} jobs in queue`);
  });

  test('Job status tracking', async ({ request }) => {
    // Get list of jobs
    const listResponse = await request.get('http://localhost:3001/api/jobs');
    const listBody = await listResponse.json();

    if (listBody.jobs.length > 0) {
      const jobId = listBody.jobs[0].id;

      // Get job status
      const statusResponse = await request.get(`http://localhost:3001/api/jobs/${jobId}`);
      expect(statusResponse.ok()).toBeTruthy();

      const statusBody = await statusResponse.json();
      expect(statusBody.id).toBe(jobId);
      expect(statusBody.status).toMatch(/^(queued|processing|completed|failed)$/);
      expect(statusBody.type).toBeDefined();
      expect(statusBody.createdAt).toBeDefined();

      console.log(`✅ Job ${jobId} status: ${statusBody.status}`);
    }
  });
});

test.describe('Production Mode - Performance', () => {
  test('Concurrent health checks', async ({ request }) => {
    const promises = Array(10).fill(null).map(() =>
      request.get('http://localhost:3001/health')
    );

    const start = Date.now();
    const responses = await Promise.all(promises);
    const duration = Date.now() - start;

    responses.forEach(response => {
      expect(response.ok()).toBeTruthy();
    });

    expect(duration).toBeLessThan(1000); // <1 second for 10 concurrent requests
    console.log(`✅ 10 concurrent requests handled in ${duration}ms`);
  });

  test('API response times are consistent', async ({ request }) => {
    const measurements = [];

    for (let i = 0; i < 5; i++) {
      const start = Date.now();
      await request.get('http://localhost:3001/health');
      measurements.push(Date.now() - start);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }

    const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
    const max = Math.max(...measurements);

    expect(avg).toBeLessThan(50); // Average <50ms
    expect(max).toBeLessThan(100); // Max <100ms

    console.log(`✅ Average latency: ${avg.toFixed(2)}ms, Max: ${max}ms`);
  });
});

test.describe('Production Mode - Error Handling', () => {
  test('Invalid connector spec returns proper error', async ({ request }) => {
    const invalidSpec = {
      name: 'invalid-connector',
      // Missing required fields
    };

    const response = await request.post('http://localhost:3001/api/generate-connector', {
      data: invalidSpec,
      failOnStatusCode: false
    });

    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);

    const body = await response.json();
    expect(body.error || body.message).toBeDefined();

    console.log(`✅ Error handling working: ${response.status()}`);
  });

  test('Non-existent job ID returns 404', async ({ request }) => {
    const fakeJobId = 'non-existent-job-id-12345';
    const response = await request.get(`http://localhost:3001/api/jobs/${fakeJobId}`, {
      failOnStatusCode: false
    });

    expect(response.status()).toBe(404);

    const body = await response.json();
    expect(body.error).toBeDefined();

    console.log(`✅ 404 handling working for invalid job ID`);
  });
});
