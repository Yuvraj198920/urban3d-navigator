import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: React StrictMode is intentionally omitted here.
// deck.gl 9 / luma.gl 4 use a ResizeObserver that fires between StrictMode's
// double-invoke teardown and re-init, reading `maxTextureDimension2D` off an
// undefined WebGL device and crashing the 3D canvas.
// Tracked upstream: https://github.com/visgl/deck.gl/issues/8880
createRoot(document.getElementById('root')!).render(
  <App />
)
