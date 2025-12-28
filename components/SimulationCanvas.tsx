
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PlanetData, ViewMode, Building, BuildingType } from '../types';

interface SimulationCanvasProps {
  planet: PlanetData;
  hyperdrive: boolean;
  viewOffset: { x: number, y: number };
  buildings: Building[];
  viewMode: ViewMode;
  onPlanetClick: () => void;
  onPlaceBuilding: (pos: [number, number, number]) => void;
  isPlacing: BuildingType | null;
  isStarted: boolean;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ 
  planet, 
  hyperdrive,
  viewOffset,
  buildings,
  viewMode,
  onPlanetClick,
  onPlaceBuilding,
  isPlacing,
  isStarted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  
  // Interaction State
  const isDragging = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  // Animation Refs
  const currentSpin = useRef(0.001);
  const targetSpin = useRef(0.001);
  const planetScale = useRef(1);
  const expansionScale = useRef(0.1); // Start slightly visible
  const hoverPos = useRef<THREE.Vector3 | null>(null);

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    planetMesh: THREE.Mesh;
    planetGroup: THREE.Group;
    atmo: THREE.Mesh;
    stars: THREE.Points;
    buildingGroup: THREE.Group;
    hoverMarker: THREE.Group;
  } | null>(null);

  // Initialize Scene once
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010409);
    
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const sunLight = new THREE.DirectionalLight(0xffffff, 4);
    sunLight.position.set(2000, 1500, 1500);
    scene.add(sunLight);

    // Stars
    const starCount = 15000;
    const starGeometry = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 12000;
      starPos[i*3+1] = (Math.random() - 0.5) * 12000;
      starPos[i*3+2] = (Math.random() - 0.5) * 12000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    // Planet Group
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 128),
      new THREE.MeshStandardMaterial({ color: planet.baseColor, roughness: 0.7, metalness: 0.3 })
    );
    planetMesh.scale.setScalar(planet.radius * 2.5);
    planetGroup.add(planetMesh);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 128, 128),
      new THREE.MeshBasicMaterial({ color: planet.atmosphereColor, transparent: true, opacity: 0.2, side: THREE.BackSide })
    );
    atmo.scale.setScalar(planet.radius * 2.5);
    planetGroup.add(atmo);

    const buildingGroup = new THREE.Group();
    planetMesh.add(buildingGroup);

    // Hover Marker for building
    const hoverMarker = new THREE.Group();
    hoverMarker.add(new THREE.Mesh(new THREE.RingGeometry(0.04, 0.05, 32), new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.8, side: THREE.DoubleSide })));
    hoverMarker.visible = false;
    planetMesh.add(hoverMarker);

    sceneRef.current = { scene, camera, renderer, planetMesh, planetGroup, atmo, stars, buildingGroup, hoverMarker };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Frame Loop
  useEffect(() => {
    let frame: number;
    const animate = () => {
      if (!sceneRef.current) return;
      // Added 'scene' to the destructuring below to fix the "Cannot find name 'scene'" error.
      const { scene, stars, planetMesh, planetGroup, camera, atmo, renderer, hoverMarker } = sceneRef.current;

      // Smoothly expand when started, or stay slightly visible
      const targetExpansion = isStarted ? 1.0 : 0.85;
      expansionScale.current += (targetExpansion - expansionScale.current) * 0.035;

      targetSpin.current = planet.rotationSpeed;
      currentSpin.current += (targetSpin.current - currentSpin.current) * 0.05;
      
      if (!isDragging.current) {
        planetMesh.rotation.y += currentSpin.current;
        atmo.rotation.y += currentSpin.current * 0.85;
        rotationVelocity.current.x *= 0.96;
        rotationVelocity.current.y *= 0.96;
        planetMesh.rotation.y += rotationVelocity.current.x;
        planetMesh.rotation.x += rotationVelocity.current.y;
      }

      // Star Field Hyperdrive Effect
      const sBase = hyperdrive ? 150 : 0.4;
      const starPositions = stars.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < (starPositions.length / 3); i++) {
        starPositions[i*3+2] += sBase;
        if (starPositions[i*3+2] > 6000) starPositions[i*3+2] = -6000;
      }
      stars.geometry.attributes.position.needsUpdate = true;

      // Camera Handling
      const tZ = viewMode === 'surface' ? planet.radius * 3.5 : 900;
      camera.position.z += (tZ - camera.position.z) * 0.05;
      
      const aTarget = viewMode === 'surface' ? 0.45 : 0.25;
      (atmo.material as THREE.MeshBasicMaterial).opacity += (aTarget - (atmo.material as THREE.MeshBasicMaterial).opacity) * 0.05;

      if (viewMode === 'orbit') {
        planetGroup.position.x += (-viewOffset.x * 250 - planetGroup.position.x) * 0.05;
        planetGroup.position.y += (-viewOffset.y * 250 - planetGroup.position.y) * 0.05;
        camera.rotation.z += (viewOffset.x * 0.08 - camera.rotation.z) * 0.05;
      } else {
        planetGroup.position.x *= 0.8;
        planetGroup.position.y *= 0.8;
        camera.rotation.z *= 0.8;
      }

      // Marker logic
      if (isPlacing && hoverPos.current) {
        hoverMarker.visible = true;
        hoverMarker.position.copy(hoverPos.current);
        hoverMarker.lookAt(0,0,0);
      } else {
        hoverMarker.visible = false;
      }

      planetScale.current += (1 - planetScale.current) * 0.15;
      const finalScale = planet.radius * 2.5 * planetScale.current * expansionScale.current;
      planetMesh.scale.setScalar(finalScale);
      atmo.scale.setScalar(finalScale * 1.05);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [viewMode, planet.radius, isStarted, isPlacing, hyperdrive, viewOffset, planet.rotationSpeed]);

  // Interaction handlers
  useEffect(() => {
    if (!sceneRef.current) return;
    const { renderer, planetMesh, camera } = sceneRef.current;

    const getRaycast = (x: number, y: number) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.current.x = ((x - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((y - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      return raycaster.current.intersectObject(planetMesh);
    };

    const start = (x: number, y: number) => { isDragging.current = true; previousPointerPosition.current = { x, y }; };
    const move = (x: number, y: number) => {
      if (!isDragging.current || !sceneRef.current) return;
      const delta = { x: x - previousPointerPosition.current.x, y: y - previousPointerPosition.current.y };
      rotationVelocity.current = { x: delta.x * 0.004, y: delta.y * 0.004 };
      sceneRef.current.planetMesh.rotation.y += rotationVelocity.current.x;
      sceneRef.current.planetMesh.rotation.x += rotationVelocity.current.y;
      previousPointerPosition.current = { x, y };
      
      const intersects = getRaycast(x, y);
      if (intersects.length > 0) hoverPos.current = sceneRef.current.planetMesh.worldToLocal(intersects[0].point.clone()).normalize();
    };
    const end = (x: number, y: number) => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const intersects = getRaycast(x, y);
      if (intersects.length > 0) {
        if (viewMode === 'orbit') onPlanetClick();
        else if (isPlacing && hoverPos.current) onPlaceBuilding([hoverPos.current.x, hoverPos.current.y, hoverPos.current.z]);
      }
    };

    const md = (e: MouseEvent) => start(e.clientX, e.clientY);
    const mm = (e: MouseEvent) => move(e.clientX, e.clientY);
    const mu = (e: MouseEvent) => end(e.clientX, e.clientY);
    const ts = (e: TouchEvent) => e.touches.length > 0 && start(e.touches[0].clientX, e.touches[0].clientY);
    const tm = (e: TouchEvent) => { if(isDragging.current) e.preventDefault(); if(e.touches.length > 0) move(e.touches[0].clientX, e.touches[0].clientY); };
    const te = (e: TouchEvent) => e.changedTouches.length > 0 && end(e.changedTouches[0].clientX, e.changedTouches[0].clientY);

    window.addEventListener('mousedown', md);
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchstart', ts, { passive: false });
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', te);

    return () => {
      window.removeEventListener('mousedown', md);
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchstart', ts);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', te);
    };
  }, [viewMode, onPlanetClick, isPlacing, onPlaceBuilding]);

  // Sync building geometry and colors
  useEffect(() => {
    if (!sceneRef.current) return;
    const { buildingGroup, planetMesh, atmo } = sceneRef.current;
    (planetMesh.material as THREE.MeshStandardMaterial).color.set(planet.baseColor);
    (atmo.material as THREE.MeshBasicMaterial).color.set(planet.atmosphereColor);

    while(buildingGroup.children.length > 0) {
      const child = buildingGroup.children[0];
      buildingGroup.remove(child);
    }
    
    buildings.forEach(b => {
      const color = b.type === 'extractor' ? 0xffcc00 : b.type === 'solar' ? 0x00ffcc : b.type === 'lab' ? 0xcc00ff : 0x3b82f6;
      const wrap = new THREE.Group();
      wrap.position.set(...b.position);
      wrap.lookAt(0,0,0);
      buildingGroup.add(wrap);
      
      const geo = b.type === 'habitat' ? new THREE.BoxGeometry(0.06, 0.05, 0.06) : new THREE.CylinderGeometry(0.03, 0.04, 0.07, 8);
      const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xeeeeee, metalness: 0.6 }));
      if (b.type !== 'habitat') mesh.rotation.x = Math.PI / 2;
      mesh.position.z = 0.03;
      wrap.add(mesh);
      
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.012), new THREE.MeshBasicMaterial({ color }));
      beacon.position.z = 0.08;
      wrap.add(beacon);
    });
  }, [buildings, planet]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-black cursor-grab active:cursor-grabbing touch-none" />;
};

export default SimulationCanvas;
