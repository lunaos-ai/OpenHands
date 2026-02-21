import json

from fastapi.testclient import TestClient

from openhands_shared import bridge_api


def test_health_endpoint_is_available():
    client = TestClient(bridge_api.app)
    response = client.get('/health')

    assert response.status_code == 200
    payload = response.json()
    assert payload['healthy'] is True
    assert 'version' in payload


def test_analyze_endpoint_uses_execute_task_result(monkeypatch):
    async def fake_execute_task(request):  # noqa: ANN001
        return bridge_api.ExecuteTaskResponse(
            success=True,
            data={
                'result': json.dumps(
                    {
                        'purpose': 'test',
                        'domain': 'test',
                        'authMethods': [],
                    }
                )
            },
            metadata={'duration': 0.01},
        )

    monkeypatch.setattr(bridge_api, 'execute_task', fake_execute_task)

    client = TestClient(bridge_api.app)
    response = client.post(
        '/api/analyze',
        json={
            'specType': 'openapi',
            'spec': {'openapi': '3.0.0', 'info': {'title': 'T', 'version': '1'}},
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload['success'] is True
    assert payload['analysis']['purpose'] == 'test'
