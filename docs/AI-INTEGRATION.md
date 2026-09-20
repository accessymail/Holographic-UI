# AI / Agent Integration

The AI runtime is outside HUI's trust boundary.

Recommended flow:

```text
AI / Agent / VLM
       ↓
Structured intent
       ↓
Trusted backend policy gateway
       ↓
Authorized HUI command
       ↓
HUI visualization
```

Do not expose unrestricted tools, cloud credentials, shells or database connections to the frontend. An AI response is data, not authorization.

AI-generated operations that can create side effects should carry a backend-issued capability/session context and be re-authorized immediately before execution.
