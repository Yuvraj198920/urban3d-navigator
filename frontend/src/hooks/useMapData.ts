import { useQuery } from '@tanstack/react-query';
import type { GeoJsonFeatureCollection, BuildingProperties, RoadProperties, PipelineMetadata } from '../types';
import { BUILDINGS_URL, ROADS_URL, METADATA_URL } from '../utils/constants';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

/** Fetch buildings GeoJSON */
export function useBuildingsData() {
  return useQuery<GeoJsonFeatureCollection<BuildingProperties>>({
    queryKey: ['buildings'],
    queryFn: () => fetchJson(BUILDINGS_URL),
    staleTime: Infinity, // static data — never refetch
    retry: 2,
  });
}

/** Fetch roads GeoJSON */
export function useRoadsData() {
  return useQuery<GeoJsonFeatureCollection<RoadProperties>>({
    queryKey: ['roads'],
    queryFn: () => fetchJson(ROADS_URL),
    staleTime: Infinity,
    retry: 2,
  });
}

/** Fetch pipeline metadata */
export function useMetadata() {
  return useQuery<PipelineMetadata>({
    queryKey: ['metadata'],
    queryFn: () => fetchJson(METADATA_URL),
    staleTime: Infinity,
    retry: 1,
  });
}
