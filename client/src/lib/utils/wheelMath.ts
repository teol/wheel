/**
 * Computes the canvas rotation (degrees) that places the pointer at the
 * midpoint of targetIndex after at least 5 full extra rotations.
 *
 * getIndexFromRotation logic: index = floor((360 - R%360)%360 / sliceAngle)
 * We want R%360 = (360 - (targetIndex + 0.5) * sliceAngle + 360) % 360
 */
export function computeTargetRotation(
  curRotation: number,
  targetIndex: number,
  totalSegments: number
): number {
  const sliceAngle = 360 / totalSegments;
  const targetMod = (360 - (targetIndex + 0.5) * sliceAngle + 360) % 360;
  const minRotation = curRotation + 1800;
  const fullTurns = Math.ceil((minRotation - targetMod) / 360);
  const newRotation = fullTurns * 360 + targetMod;
  return newRotation > minRotation ? newRotation : newRotation + 360;
}

export function getIndexFromRotation(rotationDegrees: number, totalSegments: number): number {
  if (totalSegments === 0) return -1;
  const sliceAngleDeg = 360 / totalSegments;
  const normalizedRotation = rotationDegrees % 360;
  const pointerAngle = (360 - normalizedRotation) % 360;
  return Math.floor(pointerAngle / sliceAngleDeg);
}
