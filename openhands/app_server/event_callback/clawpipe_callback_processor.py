import hashlib
import os
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse
from uuid import UUID

import httpx
from pydantic import Field, field_validator

from openhands.app_server.event_callback.event_callback_models import (
    EventCallback,
    EventCallbackProcessor,
)
from openhands.app_server.event_callback.event_callback_result_models import (
    EventCallbackResult,
    EventCallbackResultStatus,
)
from openhands.sdk import Event
from openhands.sdk.event import ConversationStateUpdateEvent


def _mapping(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if hasattr(value, 'model_dump'):
        dumped = value.model_dump()
        return dumped if isinstance(dumped, dict) else {}
    return {}


def _number(value: Any) -> float:
    return float(value) if isinstance(value, int | float) and value >= 0 else 0.0


def _attribute(key: str, value: str | int | float) -> dict[str, Any]:
    if isinstance(value, str):
        encoded = {'stringValue': value}
    elif isinstance(value, int):
        encoded = {'intValue': str(value)}
    else:
        encoded = {'doubleValue': value}
    return {'key': key, 'value': encoded}


class ClawPipeCallbackProcessor(EventCallbackProcessor):
    """Export content-free V1 usage deltas to a ClawPipe OTLP endpoint."""

    endpoint: str = Field(default='https://api.clawpipe.ai/v1/traces')
    api_key_env: str = Field(default='CLAWPIPE_API_KEY')
    model_name: str | None = None
    previous_prompt_tokens: int = 0
    previous_completion_tokens: int = 0
    previous_cache_read_tokens: int = 0
    previous_cost: float = 0.0

    @field_validator('endpoint')
    @classmethod
    def validate_endpoint(cls, value: str) -> str:
        parsed = urlparse(value)
        local = parsed.hostname in {'localhost', '127.0.0.1', '::1'}
        if parsed.scheme != 'https' and not (parsed.scheme == 'http' and local):
            raise ValueError('ClawPipe endpoint must use HTTPS or loopback HTTP')
        if not parsed.netloc or parsed.path.rstrip('/') != '/v1/traces':
            raise ValueError('ClawPipe endpoint must end in /v1/traces')
        return value

    def build_otlp_request(
        self, conversation_id: UUID, event: ConversationStateUpdateEvent
    ) -> dict[str, Any]:
        stats = _mapping(event.value)
        agent = _mapping(_mapping(stats.get('usage_to_metrics')).get('agent'))
        usage = _mapping(agent.get('accumulated_token_usage'))
        prompt = int(_number(usage.get('prompt_tokens')))
        completion = int(_number(usage.get('completion_tokens')))
        cache_read = int(_number(usage.get('cache_read_tokens')))
        cost = _number(agent.get('accumulated_cost'))
        deltas = {
            'prompt': max(0, prompt - self.previous_prompt_tokens),
            'completion': max(0, completion - self.previous_completion_tokens),
            'cache_read': max(0, cache_read - self.previous_cache_read_tokens),
            'cost': max(0.0, cost - self.previous_cost),
        }
        self.previous_prompt_tokens = max(self.previous_prompt_tokens, prompt)
        self.previous_completion_tokens = max(
            self.previous_completion_tokens, completion
        )
        self.previous_cache_read_tokens = max(
            self.previous_cache_read_tokens, cache_read
        )
        self.previous_cost = max(self.previous_cost, cost)
        attributes = [
            _attribute('gen_ai.operation.name', 'create_agent'),
            _attribute('gen_ai.provider.name', 'openhands'),
            _attribute('gen_ai.usage.input_tokens', deltas['prompt']),
            _attribute('gen_ai.usage.output_tokens', deltas['completion']),
            _attribute('gen_ai.usage.cache_read.input_tokens', deltas['cache_read']),
            _attribute('clawpipe.activity.task_id', str(conversation_id)),
            _attribute('clawpipe.activity.result_status', 'succeeded'),
            _attribute('clawpipe.activity.estimated_cost', deltas['cost']),
            _attribute('clawpipe.activity.currency', 'USD'),
            _attribute('clawpipe.activity.cost_confidence_grade', 'D'),
        ]
        if self.model_name:
            attributes.append(_attribute('gen_ai.request.model', self.model_name))
        now_nanos = str(int(datetime.now(timezone.utc).timestamp() * 1_000_000_000))
        event_id = str(event.id)
        span_id = hashlib.sha256(event_id.encode()).hexdigest()[:16]
        span = {
            'traceId': conversation_id.hex,
            'spanId': span_id,
            'name': 'openhands agent usage',
            'startTimeUnixNano': now_nanos,
            'endTimeUnixNano': now_nanos,
            'status': {'code': 1},
            'attributes': attributes,
        }
        return {
            'resourceSpans': [{
                'resource': {'attributes': [
                    _attribute('service.name', 'openhands'),
                ]},
                'scopeSpans': [{
                    'scope': {'name': 'openhands.clawpipe', 'version': '1.0'},
                    'spans': [span],
                }],
            }]
        }

    async def _post(self, payload: dict[str, Any], api_key: str) -> None:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                self.endpoint,
                json=payload,
                headers={'Authorization': f'Bearer {api_key}'},
            )
            response.raise_for_status()

    async def __call__(
        self, conversation_id: UUID, callback: EventCallback, event: Event
    ) -> EventCallbackResult | None:
        if not isinstance(event, ConversationStateUpdateEvent) or event.key != 'stats':
            return None
        api_key = os.environ.get(self.api_key_env)
        if not api_key:
            raise RuntimeError(f'{self.api_key_env} is not configured')
        await self._post(self.build_otlp_request(conversation_id, event), api_key)
        return EventCallbackResult(
            status=EventCallbackResultStatus.SUCCESS,
            event_callback_id=callback.id,
            event_id=event.id,
            conversation_id=conversation_id,
            detail='ClawPipe activity exported',
        )
