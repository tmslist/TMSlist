uniform float uTime;

varying float vFieldStrength;

// Blue → Cyan → Green → Yellow → Red heatmap
vec3 heatmapColor(float t) {
  // 5-stop gradient
  vec3 c0 = vec3(0.05, 0.05, 0.6);  // deep blue  — no field
  vec3 c1 = vec3(0.0,  0.85, 1.0);  // cyan
  vec3 c2 = vec3(0.1,  0.9,  0.3);  // green
  vec3 c3 = vec3(1.0,  0.75, 0.0);  // yellow
  vec3 c4 = vec3(1.0,  0.1,  0.05); // red-orange — peak field

  if (t < 0.25) return mix(c0, c1, t * 4.0);
  if (t < 0.50) return mix(c1, c2, (t - 0.25) * 4.0);
  if (t < 0.75) return mix(c2, c3, (t - 0.5) * 4.0);
  return mix(c3, c4, (t - 0.75) * 4.0);
}

void main() {
  float strength = vFieldStrength;

  // Fade edges smoothly
  float alpha = smoothstep(0.03, 0.18, strength) * 0.72;

  // Subtle pulse shimmer on active regions
  float shimmer = sin(uTime * 3.0 + strength * 10.0) * 0.04 * strength;
  strength = clamp(strength + shimmer, 0.0, 1.0);

  vec3 color = heatmapColor(strength);

  gl_FragColor = vec4(color, alpha);
}
