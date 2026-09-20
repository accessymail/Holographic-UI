# Extensions

Cards are declarative by default. Untrusted third-party UI must use a sandboxed extension boundary and an explicit HTTPS origin.

Extension manifests should declare identity, version, requested capabilities and host requirements. Do not grant native permissions through a card extension. Future signed-extension support should add verification and revocation before an extension is trusted.
