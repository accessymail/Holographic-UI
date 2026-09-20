# Gesture Integration

Gesture recognition is an input adapter, not an authorization layer.

The adapter should emit normalized gesture events with:

- gesture type
- confidence
- timestamp
- normalized position/delta/scale where applicable
- adapter/source identifier

Use confidence thresholds, debounce/hysteresis and a non-gesture fallback. Do not map low-confidence gestures directly to privileged side effects.
