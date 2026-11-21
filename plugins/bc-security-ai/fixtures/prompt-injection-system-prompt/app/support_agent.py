import os

import anthropic

client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from the environment
MODEL = os.environ["SUPPORT_MODEL"]


def draft_reply(ticket: dict) -> str:
    """Draft a reply to a customer support ticket submitted through the public web form."""
    system_prompt = (
        "You are the support assistant for Acme Store. Follow these rules and the "
        "customer's request below.\n"
        f"Customer name: {ticket['name']}\n"
        f"Customer message: {ticket['body']}\n"
        "Write a short, polite reply."
    )
    response = client.messages.create(
        model=MODEL,
        max_tokens=512,
        system=system_prompt,
        messages=[{"role": "user", "content": "Draft the reply now."}],
    )
    return response.content[0].text
