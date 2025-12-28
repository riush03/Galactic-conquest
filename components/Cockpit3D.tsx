
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface Cockpit3DProps {
  tilt: { x: number, y: number }; // -1 to 1 range
  isHyperdrive: boolean;
}

const Cockpit3D: React.FC<Cockpit3DProps> = ({ tilt, isHyperdrive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Setup Scene
    const scene = new THREE.Scene();
    
    // Adjusted FOV and clipping planes for internal view
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    // Position the "pilot's eyes"
    camera.position.set(0, 0.1, 0.8); 
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Enhanced Lighting
    // Ambient fill
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Natural top-down lighting
    const hemiLight = new THREE.HemisphereLight(0x3b82f6, 0x020617, 1);
    scene.add(hemiLight);

    // Front-facing directional light to define shapes
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(0, 5, 5);
    scene.add(dirLight);

    // Internal cockpit glow
    const cockpitPointLight = new THREE.PointLight(0x3b82f6, 10, 5);
    cockpitPointLight.position.set(0, 0, 0);
    scene.add(cockpitPointLight);

    // Load Model
    const loader = new GLTFLoader();
    const modelUrl = 'https://raw.githubusercontent.com/riush03/Galactic-conquest/main/models/spaceship_cockpit.glb';
    
    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      
      // Reset scale to 1 or 1.5 depending on model dimensions
      model.scale.set(1.5, 1.5, 1.5);
      // Position model so camera is inside/behind the dash
      model.position.set(0, -1.0, 0.2); 
      // Rotate to face the window
      model.rotation.y = Math.PI; 
      
      scene.add(model);
      modelRef.current = model;
      
      // Traverse to ensure textures are vivid
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
             (mesh.material as THREE.MeshStandardMaterial).envMapIntensity = 1.5;
             (mesh.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
          }
        }
      });
      console.log("Cockpit model loaded and added to scene");
    }, (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, (error) => {
      console.error('An error happened loading the cockpit:', error);
    });

    // Animation Loop
    let animationId: number;
    const animate = () => {
      if (modelRef.current) {
        // Smooth rotation/tilt based on steering (subtle)
        const targetRotZ = tilt.x * -0.05;
        const targetRotX = tilt.y * 0.03;
        const targetRotY = Math.PI + (tilt.x * 0.02);

        modelRef.current.rotation.z += (targetRotZ - modelRef.current.rotation.z) * 0.1;
        modelRef.current.rotation.x += (targetRotX - modelRef.current.rotation.x) * 0.1;
        modelRef.current.rotation.y += (targetRotY - modelRef.current.rotation.y) * 0.1;

        // Visual feedback for hyperdrive (vibration)
        if (isHyperdrive) {
          modelRef.current.position.x = (Math.random() - 0.5) * 0.01;
          modelRef.current.position.y = -1.0 + (Math.random() - 0.5) * 0.01;
        } else {
          modelRef.current.position.x = 0;
          modelRef.current.position.y = -1.0;
        }
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!rendererRef.current) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none" />;
};

export default Cockpit3D;
