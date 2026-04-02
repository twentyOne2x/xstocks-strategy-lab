import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
  markerStart,
}: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      {/* BaseEdge handles the interaction path (click/hover) + visible stroke */}
      <BaseEdge
        id={id}
        path={edgePath}
        interactionWidth={40}
        markerEnd={markerEnd}
        markerStart={markerStart}
        style={{
          stroke: selected ? "#E8652C" : "#333333",
          strokeWidth: selected ? 2.5 : 2,
          strokeDasharray: selected ? "0" : "6 4",
        }}
      />
      {/* Glow when selected */}
      {selected && (
        <path
          d={edgePath}
          stroke="#E8652C"
          strokeWidth={6}
          fill="none"
          strokeOpacity={0.2}
          style={{ pointerEvents: "none" }}
        />
      )}
      {/* Animated dot */}
      <circle r="3" fill="#E8652C" style={{ pointerEvents: "none" }}>
        <animateMotion dur="1.5s" repeatCount="indefinite">
          <mpath href={`#${id}`} />
        </animateMotion>
      </circle>
    </>
  );
}
