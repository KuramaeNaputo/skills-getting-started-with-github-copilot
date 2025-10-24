import importlib.util
from pathlib import Path
from fastapi.testclient import TestClient
import pytest


def load_app_module():
    """Load a fresh copy of the src/app.py module so tests don't share in-memory state."""
    path = Path(__file__).parent.parent / "src" / "app.py"
    spec = importlib.util.spec_from_file_location("app_module", str(path))
    app_mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(app_mod)
    return app_mod


def test_get_activities():
    app_mod = load_app_module()
    client = TestClient(app_mod.app)
    r = client.get("/activities")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_success():
    app_mod = load_app_module()
    client = TestClient(app_mod.app)

    email = "newstudent@mergington.edu"
    r = client.post("/activities/Chess Club/signup", params={"email": email})
    assert r.status_code == 200
    assert email in r.json().get("message", "")

    # verify participant was added
    r2 = client.get("/activities")
    assert email in r2.json()["Chess Club"]["participants"]


def test_signup_already_signed_up():
    app_mod = load_app_module()
    client = TestClient(app_mod.app)

    # michael@mergington.edu is already in Chess Club per src/app.py
    r = client.post("/activities/Chess Club/signup", params={"email": "michael@mergington.edu"})
    assert r.status_code == 400


def test_remove_participant_success():
    app_mod = load_app_module()
    client = TestClient(app_mod.app)

    email = "tempremove@mergington.edu"
    # sign up then remove
    resp1 = client.post("/activities/Chess Club/signup", params={"email": email})
    assert resp1.status_code == 200

    resp2 = client.delete("/activities/Chess Club/participants", params={"email": email})
    assert resp2.status_code == 200
    assert "Unregistered" in resp2.json().get("message", "")


def test_remove_participant_not_found():
    app_mod = load_app_module()
    client = TestClient(app_mod.app)

    resp = client.delete("/activities/Chess Club/participants", params={"email": "noone@nowhere"})
    assert resp.status_code == 404
