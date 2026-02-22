import type { HoverInfo, BuildingProperties, RoadProperties, PoiProperties } from '../types';
import { LAYER_IDS, POI_CATEGORY_EMOJI } from '../utils/constants';

interface TooltipProps {
  info: HoverInfo;
}

export default function Tooltip({ info }: TooltipProps) {
  if (!info.object) return null;

  const { x, y, object, layer } = info;
  const layerId = layer?.id ?? '';
  const isBuilding = layerId === LAYER_IDS.BUILDINGS_SOLID;
  const isPoi = layerId === 'pois';

  return (
    <div
      style={{
        position: 'absolute',
        left: x + 12,
        top: y + 12,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        pointerEvents: 'none',
        maxWidth: 260,
        lineHeight: 1.5,
        zIndex: 10,
      }}
    >
      {isBuilding ? (
        <BuildingTooltip props={object.properties as BuildingProperties} />
      ) : isPoi ? (
        <PoiTooltip props={object.properties as PoiProperties} />
      ) : (
        <RoadTooltip props={object.properties as RoadProperties} />
      )}
    </div>
  );
}

function BuildingTooltip({ props }: { props: BuildingProperties }) {
  return (
    <>
      {props.name && <div><strong>{props.name}</strong></div>}
      {props.height != null && <div>Height: {props.height.toFixed(1)} m</div>}
      <div>Source: {props.height_source}</div>
      {props.building_type && <div>Type: {props.building_type}</div>}
    </>
  );
}

function RoadTooltip({ props }: { props: RoadProperties }) {
  return (
    <>
      {props.name && <div><strong>{props.name}</strong></div>}
      <div>Class: {props.road_class}</div>
      {props.width != null && <div>Width: {props.width.toFixed(1)} m</div>}
    </>
  );
}

function PoiTooltip({ props }: { props: PoiProperties }) {
  const emoji = POI_CATEGORY_EMOJI[props.category] ?? '📌';
  const typeLabel = props.amenity_tag.replace(/_/g, ' ');
  return (
    <>
      <div style={{ marginBottom: 2 }}>
        <strong>{emoji} {props.name || typeLabel}</strong>
      </div>
      <div style={{ opacity: 0.75, fontSize: 11, textTransform: 'capitalize' }}>
        {props.category} · {typeLabel}
      </div>
      <div style={{ opacity: 0.5, fontSize: 10, marginTop: 2 }}>Click for details</div>
    </>
  );
}
