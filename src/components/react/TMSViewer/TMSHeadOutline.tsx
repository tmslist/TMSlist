'use client';

export function TMSHeadOutline() {
  return (
    <group>
      {/* Wireframe head shell — slightly larger than brain, subtle */}
      <mesh scale={[1.25, 1.0, 1.15]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color="#6366f1" transparent opacity={0.06} wireframe />
      </mesh>
      {/* Inner glow ring at equator */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.004, 8, 128]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
