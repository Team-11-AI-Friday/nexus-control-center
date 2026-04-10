import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

function Globe() {
  const globeRef = useRef<THREE.Mesh>(null);
  const arcsGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
    if (arcsGroupRef.current) {
      arcsGroupRef.current.rotation.y = clock.getElapsedTime() * 0.1;
    }
  });

  const arcs = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const curve = new THREE.EllipseCurve(
        0, 0,
        2.2 + Math.random() * 0.3,
        2.2 + Math.random() * 0.3,
        0, Math.PI * (0.3 + Math.random() * 0.7),
        false, Math.random() * Math.PI * 2
      );
      const pts = curve.getPoints(50);
      const positions = new Float32Array(pts.length * 3);
      pts.forEach((p, idx) => {
        positions[idx * 3] = p.x;
        positions[idx * 3 + 1] = p.y;
        positions[idx * 3 + 2] = 0;
      });
      return {
        positions,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI] as [number, number, number],
        key: i,
      };
    });
  }, []);

  return (
    <>
      <Sphere ref={globeRef} args={[2, 32, 32]}>
        <meshPhongMaterial
          color="#0a0a2e"
          emissive="#00d4ff"
          emissiveIntensity={0.05}
          wireframe
          transparent
          opacity={0.3}
        />
      </Sphere>
      <Sphere args={[1.98, 32, 32]}>
        <meshPhongMaterial color="#0a0a1a" transparent opacity={0.8} />
      </Sphere>
      <group ref={arcsGroupRef}>
        {arcs.map(({ positions, rotation, key }) => (
          <group key={key} rotation={rotation}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[positions, 3]}
                  count={positions.length / 3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#00d4ff" transparent opacity={0.4} />
            </line>
          </group>
        ))}
      </group>
    </>
  );
}

export function GlobeScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={0.5} color="#00d4ff" />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#7c3aed" />
        <Globe />
      </Canvas>
    </div>
  );
}
