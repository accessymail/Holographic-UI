# Screen Understanding

Screen understanding is an opt-in sensitive-data path.

Default policy:

- user/policy controlled display capture
- no frame persistence by HUI
- remote analysis disabled unless explicitly permitted
- remote analysis with redaction enabled requires a `ScreenFrameRedactor`
- result-level sanitization is defense-in-depth, not pixel redaction

For enterprise use, prefer local preprocessing/OCR/accessibility extraction and transmit only the minimum structured context required for the task.
