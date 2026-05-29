import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function SoftOrb() {
  const mesh = useRef(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.55, 3), []);

  useFrame((state) => {
    if (!mesh.current) return;
    mesh.current.rotation.x = state.clock.elapsedTime * 0.12;
    mesh.current.rotation.y = state.clock.elapsedTime * 0.18;
  });

  return (
    <mesh ref={mesh} geometry={geometry}>
      <meshPhysicalMaterial
        clearcoat={0.8}
        color="#dbeafe"
        emissive="#0f172a"
        metalness={0.18}
        roughness={0.22}
        transmission={0.35}
        transparent
        opacity={0.82}
      />
    </mesh>
  );
}

export default function HeroOrbScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 42 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.9} />
      <directionalLight color="#ffffff" intensity={1.4} position={[3, 4, 5]} />
      <pointLight color="#22d3ee" intensity={1.5} position={[-3, 1, 2]} />
      <SoftOrb />
    </Canvas>
  );
}
