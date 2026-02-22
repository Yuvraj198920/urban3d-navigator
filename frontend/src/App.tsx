import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Map3D from './components/Map3D';
import Controls from './components/Controls';
import HeightLegend from './components/HeightLegend';
import TypeLegend from './components/TypeLegend';
import PerfOverlay from './components/PerfOverlay';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ width: '100vw', height: '100vh', margin: 0, overflow: 'hidden' }}>
        <Map3D />
        <Controls />
        <HeightLegend />
        <TypeLegend />
        <PerfOverlay />
      </div>
    </QueryClientProvider>
  );
}

