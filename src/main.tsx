import './styles/global.css';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { HolographicRuntime } from './runtime/HolographicRuntime';
import { MockConnector } from './connectors/mock';
import { WebSocketConnector } from './connectors/websocket';

const root = document.getElementById('root');
if (!root) throw new Error('hui_root_missing');

const runtime = new HolographicRuntime();
const connector = import.meta.env.VITE_HUI_WS_URL
  ? new WebSocketConnector({ url: import.meta.env.VITE_HUI_WS_URL, allowInsecureLocalhost: import.meta.env.VITE_HUI_ALLOW_INSECURE_LOCALHOST === 'true' })
  : new MockConnector();

createRoot(root).render(<App runtime={runtime} />);
void runtime.connect(connector).catch(() => runtime.store.setConnected(false));
