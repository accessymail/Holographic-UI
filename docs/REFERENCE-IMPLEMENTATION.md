# Reference Integration

`examples/mock-gateway` is development-only. It exists to validate connector behavior and protocol shape.

It is deliberately not a production authorization service. A real deployment should replace it with a gateway that owns identity, session issuance, authorization, capabilities, HITL approval, audit and secure execution.
