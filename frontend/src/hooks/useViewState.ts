import { useCallback } from 'react';
import { useMapStore } from '../store/mapStore';
import type { ViewState } from '../types';

/**
 * Hook wrapping the Zustand view-state slice.
 * Returns current viewState and a stable onViewStateChange handler.
 */
export function useViewState() {
  const viewState = useMapStore((s) => s.viewState);
  const setViewState = useMapStore((s) => s.setViewState);

  const onViewStateChange = useCallback(
    ({ viewState: vs }: { viewState: ViewState }) => {
      setViewState(vs);
    },
    [setViewState],
  );

  return { viewState, onViewStateChange };
}
