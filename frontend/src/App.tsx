import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Map3D from './components/Map3D';
import Controls from './components/Controls';

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
      </div>
    </QueryClientProvider>
  );
}

