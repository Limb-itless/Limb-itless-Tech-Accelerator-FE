import { BodyRegion, InvolvementKind } from '../involvements/involvement.model';

export interface Point {
  x: number;
  y: number;
}

/** Anchor points on the front-facing silhouette in the SVG's own
 * `0 0 240 360` coordinate space. The figure is drawn "as if facing the
 * patient", so an anatomical *left* limb sits on the viewer's *right*.
 * `other` (and any region we don't recognise) has no anchor and is
 * listed beside the figure instead. */
export const REGION_ANCHORS: Record<BodyRegion, Point | null> = {
  upper_limb_left: { x: 172, y: 148 },
  upper_limb_right: { x: 68, y: 148 },
  lower_limb_left: { x: 133, y: 262 },
  lower_limb_right: { x: 107, y: 262 },
  spine: { x: 120, y: 150 },
  trunk: { x: 120, y: 96 },
  other: null,
};

export function regionAnchor(region: BodyRegion): Point | null {
  return REGION_ANCHORS[region] ?? null;
}

/** Marker colour by involvement kind (resolved involvements are drawn
 * faded by the component, not recoloured). */
const KIND_MARKER: Record<InvolvementKind, string> = {
  amputation: '#b91c1c',
  congenital_absence: '#b45309',
  orthotic_need: '#1a56db',
};

export function kindMarkerColor(kind: InvolvementKind): string {
  return KIND_MARKER[kind];
}
