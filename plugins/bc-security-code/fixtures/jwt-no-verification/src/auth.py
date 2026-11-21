import jwt
from flask import request, abort, g


def current_user():
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        abort(401)
    token = header.removeprefix("Bearer ")
    claims = jwt.decode(token, options={"verify_signature": False, "verify_exp": False})
    g.user_id = claims["sub"]
    g.role = claims.get("role", "user")
    return g.user_id
