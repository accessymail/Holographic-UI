# RC3 — Spatial Interaction & Privacy Hardening

RC3 introduces a production-oriented local gesture boundary and stronger screen-understanding privacy controls.

## Gesture security model

- Camera access is isolated in `LocalCameraGestureAdapter`.
- The detector is injected; the adapter does not upload frames.
- `HandGestureMapper` applies confidence thresholds, smoothing, hysteresis and cooldowns.
- `GestureSession` defaults to explicit activation and emits UI-only commands.
- Gesture commands cannot directly invoke native execution.
- Applications should stop the adapter when the UI is backgrounded or permission is revoked.

## Screen privacy model

- Screen analysis requires explicit session/one-shot consent.
- Remote analysis remains opt-in/policy controlled.
- Remote analysis requires a redaction adapter when redaction is enabled.
- Frames are downscaled to the configured pixel budget before analysis.
- Raw frames are cleared after analysis.
- Sensitive semantic result fields are redacted before returning to the UI.
- Frame persistence remains prohibited by policy.

## Integration requirement

Applications must treat camera and screen permissions as user-controlled resources. Do not persist raw frames, send them to third parties without explicit consent, or use gesture events as authorization for privileged operations.
