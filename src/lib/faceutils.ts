//src/lib/faceutils.ts
export function calculateDescriptorDistance(
  d1: number[],
  d2: number[]
): number {
  if (d1.length !== d2.length) {
    throw new Error('Descriptor lengths do not match');
  }
  let sum = 0;
  for (let i = 0; i < d1.length; i++) {
    const diff = d1[i] - d2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function eyeAspectRatio(eye: { x: number; y: number }[]): number {
  const euclid = (p1: any, p2: any) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
  const A = euclid(eye[1], eye[5]);
  const B = euclid(eye[2], eye[4]);
  const C = euclid(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

export function compareDescriptors(d1: number[], d2: number[]) {
  const distance = calculateDescriptorDistance(d1, d2);
  return { distance, match: distance < 0.7 };
}