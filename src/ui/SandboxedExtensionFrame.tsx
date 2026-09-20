import { useEffect, useRef } from 'react';

export interface SandboxedExtensionFrameProps {
  src: string;
  allowedOrigin: string;
  title: string;
  onMessage?: (data: unknown) => void;
}

/**
 * Untrusted extension boundary. Deliberately does not grant same-origin, forms,
 * popups, top-navigation, downloads or native APIs through iframe permissions.
 */
export function SandboxedExtensionFrame({ src, allowedOrigin, title, onMessage }: SandboxedExtensionFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let origin: string;
    try { origin = new URL(src).origin; } catch { return; }
    if (!src.startsWith('https://') || origin !== allowedOrigin || !allowedOrigin.startsWith('https://')) return;
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== allowedOrigin) return;
      onMessage?.(event.data);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [src, allowedOrigin, onMessage]);

  return <iframe
    ref={frame}
    title={title}
    src={src}
    sandbox="allow-scripts"
    referrerPolicy="no-referrer"
    loading="lazy"
    style={{ width: '100%', height: '100%', border: 0 }}
  />;
}
