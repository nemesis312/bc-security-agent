import base64
import pickle

from flask import request


def load_cart():
    raw = request.cookies.get("cart")
    if not raw:
        return []
    return pickle.loads(base64.b64decode(raw))
