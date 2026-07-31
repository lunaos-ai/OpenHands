from unittest.mock import AsyncMock, patch
from uuid import uuid4

import pytest

from openhands.app_server.event_callback.clawpipe_callback_processor import (
    ClawPipeCallbackProcessor,
)
from openhands.app_server.event_callback.event_callback_models import EventCallback
from openhands.app_server.event_callback.event_callback_result_models import (
    EventCallbackResultStatus,
)
from openhands.sdk.event import ConversationStateUpdateEvent


@pytest.fixture
def processor():
    return ClawPipeCallbackProcessor(
        endpoint='https://customer.clawpipe.ai/v1/traces', model_name='claude-sonnet'
    )


def callback(processor):
    return EventCallback(
        conversation_id=uuid4(),
        processor=processor,
        event_kind='ConversationStateUpdateEvent',
    )


def stats_event(prompt=120, completion=40, cache=20, cost=0.08):
    return ConversationStateUpdateEvent(
        key='stats',
        value={
            'usage_to_metrics': {
                'agent': {
                    'accumulated_cost': cost,
                    'accumulated_token_usage': {
                        'prompt_tokens': prompt,
                        'completion_tokens': completion,
                        'cache_read_tokens': cache,
                    },
                }
            }
        },
    )


def attributes(payload):
    span = payload['resourceSpans'][0]['scopeSpans'][0]['spans'][0]
    return {
        item['key']: next(iter(item['value'].values())) for item in span['attributes']
    }


def test_builds_content_free_otlp_delta(processor):
    conversation_id = uuid4()
    event = stats_event()

    first = processor.build_otlp_request(conversation_id, event)
    first_attributes = attributes(first)
    assert first_attributes['clawpipe.activity.task_id'] == str(conversation_id)
    assert first_attributes['gen_ai.provider.name'] == 'openhands'
    assert first_attributes['gen_ai.request.model'] == 'claude-sonnet'
    assert first_attributes['gen_ai.usage.input_tokens'] == '120'
    assert first_attributes['gen_ai.usage.output_tokens'] == '40'
    assert first_attributes['gen_ai.usage.cache_read.input_tokens'] == '20'
    assert first_attributes['clawpipe.activity.estimated_cost'] == 0.08
    assert first_attributes['clawpipe.activity.cost_confidence_grade'] == 'D'
    assert 'prompt' not in str(first).lower()
    assert 'response' not in str(first).lower()

    second = processor.build_otlp_request(
        conversation_id, stats_event(prompt=150, completion=55, cache=25, cost=0.10)
    )
    second_attributes = attributes(second)
    assert second_attributes['gen_ai.usage.input_tokens'] == '30'
    assert second_attributes['gen_ai.usage.output_tokens'] == '15'
    assert second_attributes['gen_ai.usage.cache_read.input_tokens'] == '5'
    assert second_attributes['clawpipe.activity.estimated_cost'] == pytest.approx(0.02)


@pytest.mark.asyncio
async def test_exports_stats_using_vault_resolved_api_key(processor, monkeypatch):
    monkeypatch.setenv('CLAWPIPE_API_KEY', 'vault-resolved-key')
    event = stats_event()
    event_callback = callback(processor)

    with patch.object(processor, '_post', new=AsyncMock()) as post:
        result = await processor(uuid4(), event_callback, event)

    assert result.status == EventCallbackResultStatus.SUCCESS
    post.assert_awaited_once()
    assert post.await_args.args[1] == 'vault-resolved-key'


@pytest.mark.asyncio
async def test_ignores_non_stats_events_and_requires_secret(processor, monkeypatch):
    event_callback = callback(processor)
    ignored = ConversationStateUpdateEvent(key='execution_status', value='running')
    assert await processor(uuid4(), event_callback, ignored) is None

    monkeypatch.delenv('CLAWPIPE_API_KEY', raising=False)
    with pytest.raises(RuntimeError, match='CLAWPIPE_API_KEY'):
        await processor(uuid4(), event_callback, stats_event())


def test_rejects_non_https_remote_endpoint():
    with pytest.raises(ValueError):
        ClawPipeCallbackProcessor(endpoint='http://metadata.internal/v1/traces')
