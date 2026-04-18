uniform vec3 uCoilPosition;
uniform float uIntensity; // normalized 0–1

varying float vFieldStrength;

void main() {
  // uCoilPosition is in brain-local space (same space as vertex positions)
  // Measure distance directly between vertex and coil in local space
  vec3 pos = normalize(position);
  vec3 coil = normalize(uCoilPosition);
  float dist = distance(pos, coil);

  // Inverse-square falloff with a small epsilon to prevent division by zero
  // The coil is outside the brain, so dist ranges from ~0.2 (near side) to ~2 (far side)
  float eps = 0.3;
  float field = uIntensity / (dist * dist + eps);

  // Normalize to 0–1 range — empirical clamp for typical distances
  // At coil surface (~0.3 dist) field ≈ 1.1, at opposite brain (~1.8 dist) field ≈ 0.03
  vFieldStrength = clamp(field * 0.85, 0.0, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
