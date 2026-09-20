# Privacy Model

Holographic UI is a presentation layer and should minimize the data it handles.

## Defaults

- Screen capture: user consent required.
- Remote screen analysis: opt-in.
- Frame persistence: disabled.
- Credentials and secrets: never intentionally stored by the HUI runtime.
- Tokens: keep in memory; never put authentication secrets in `VITE_*` variables or localStorage.
- Cards receive only the data needed to render them.

## Screen understanding

The recommended pipeline is:

`Screen → local preprocessing/redaction → optional local VLM/OCR → minimal structured context → backend policy`

Raw frames should not be sent remotely unless the user's policy explicitly permits it.

## Enterprise integration

The host platform should provide its own data-retention, DLP, regional-processing, access-control and audit policy. HUI exposes boundaries for those controls but does not replace the host organization's legal or compliance obligations.

## Remote screen analysis

When remote analysis is enabled while `redactSensitiveRegions` is true, the pipeline requires a `ScreenFrameRedactor`. The redactor must remove sensitive pixels before the frame is sent to a remote analyzer. Result-level redaction is an additional defense and is not a substitute for pixel redaction.
