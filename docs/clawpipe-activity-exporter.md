# ClawPipe activity exporter

OpenHands V1 can export content-free agent usage to ClawPipe through its event
callback system. The exporter converts cumulative `stats` events into OTLP/HTTP
JSON deltas and sends them to ClawPipe's authenticated `/v1/traces` endpoint.

It exports only:

- conversation and event identifiers;
- model name when explicitly configured;
- input, output, and cache-read token counts;
- the OpenHands cost estimate in USD, marked evidence grade D; and
- an operational result status.

It never serializes messages, prompts, responses, actions, observations, tool
arguments, source code, file names, repository paths, URLs, or user identity.

## Secret and endpoint setup

Place `CLAWPIPE_API_KEY` in the customer deployment's vault or PushCI-managed
runtime environment. Do not put it in an OpenHands callback object, config file,
repository environment file, or API request. The processor stores only the name
of the environment variable.

Remote endpoints must use HTTPS and end with `/v1/traces`. Loopback HTTP is
accepted for local testing. A customer-private ClawPipe collector can therefore
receive outbound events without exposing an inbound OpenHands endpoint.

## Conversation configuration

Add the processor when starting a V1 conversation:

```json
{
  "processors": [
    {
      "kind": "ClawPipeCallbackProcessor",
      "endpoint": "https://customer.clawpipe.ai/v1/traces",
      "api_key_env": "CLAWPIPE_API_KEY",
      "model_name": "claude-sonnet"
    }
  ]
}
```

The callback is retry-visible: transport or ClawPipe rejection is recorded as
an OpenHands callback error. ClawPipe deduplicates a replay by OTLP trace and
span identifiers.
