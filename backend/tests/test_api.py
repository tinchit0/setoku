from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_puzzles_empty():
    response = client.get("/api/puzzles")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
