from openhands_shared import bridge_api


def test_run_server_invokes_uvicorn(monkeypatch):
    called = {}

    def fake_run(app, host, port, log_level):  # noqa: ANN001
        called['app'] = app
        called['host'] = host
        called['port'] = port
        called['log_level'] = log_level

    monkeypatch.setattr(bridge_api.uvicorn, 'run', fake_run)

    bridge_api.run_server(host='127.0.0.1', port=9999, log_level='warning')

    assert called['app'] is bridge_api.app
    assert called['host'] == '127.0.0.1'
    assert called['port'] == 9999
    assert called['log_level'] == 'warning'
