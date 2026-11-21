import os

import anthropic
from flask import Flask, jsonify, request

app = Flask(__name__)
client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment
MODEL = os.environ["CALC_MODEL"]

SYSTEM_PROMPT = (
    "Convert the user's math question into a single Python expression. "
    "Reply with the expression only."
)


@app.post("/api/calculate")
def calculate():
    question = request.get_json(force=True)["question"]
    response = client.messages.create(
        model=MODEL,
        max_tokens=128,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": question}],
    )
    expression = response.content[0].text.strip()
    result = eval(expression)
    return jsonify({"expression": expression, "result": result})
