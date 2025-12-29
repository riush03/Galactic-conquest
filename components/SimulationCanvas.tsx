
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PlanetData, ViewMode, Building, BuildingType } from '../types';
import { spaceAudio } from '../services/audioService';

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
  onLandComplete: () => void;
  onAscendComplete: () => void;
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
  onLandComplete,
  onAscendComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const targetRotation = useRef({ x: 0, y: 0 });
  const currentRotation = useRef({ x: 0, y: 0 });

  const viewOffsetRef = useRef(viewOffset);
  const hyperdriveRef = useRef(hyperdrive);
  const planetRef = useRef(planet);
  const viewModeRef = useRef(viewMode);
  const isPlacingRef = useRef(isPlacing);
  const onPlaceBuildingRef = useRef(onPlaceBuilding);
  const onPlanetClickRef = useRef(onPlanetClick);

  useEffect(() => { viewOffsetRef.current = viewOffset; }, [viewOffset]);
  useEffect(() => { hyperdriveRef.current = hyperdrive; }, [hyperdrive]);
  useEffect(() => { planetRef.current = planet; }, [planet]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { isPlacingRef.current = isPlacing; }, [isPlacing]);
  useEffect(() => { onPlaceBuildingRef.current = onPlaceBuilding; }, [onPlaceBuilding]);
  useEffect(() => { onPlanetClickRef.current = onPlanetClick; }, [onPlanetClick]);

  const ghostRef = useRef<THREE.Group | null>(null);
  const placementRingRef = useRef<THREE.Mesh | null>(null);
  const vfxGroupRef = useRef<THREE.Group>(new THREE.Group());

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    planetMesh: THREE.Mesh;
    planetGroup: THREE.Group;
    atmo: THREE.Mesh;
    stars: THREE.Points;
    buildingGroup: THREE.Group;
    shipGroup: THREE.Group;
    engineGlows: THREE.Mesh[];
  } | null>(null);

  const createBuildingModel = (type: BuildingType, isGhost = false) => {
    const group = new THREE.Group();
    group.name = `building-${type}`;
    const opacity = isGhost ? 0.5 : 1.0;
    const getMat = (color: number, emissive = 0x000000) => new THREE.MeshStandardMaterial({ 
      color: isGhost ? 0x00ffff : color, transparent: isGhost, opacity, metalness: 0.7, roughness: 0.2,
      emissive: isGhost ? 0x00ffff : emissive, emissiveIntensity: isGhost ? 0.8 : 0.4
    });

    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(25, 28, 5, 12), getMat(0x1e293b));
    basePlate.position.y = -2.5;
    group.add(basePlate);

    if (type === 'extractor') {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(15, 45, 15), getMat(0xeab308, 0x713f12));
      tower.position.y = 22.5;
      const drill = new THREE.Mesh(new THREE.ConeGeometry(8, 20, 8), getMat(0x64748b));
      drill.name = "drill";
      drill.position.y = -10;
      drill.rotation.x = Math.PI;
      tower.add(drill);
      group.add(tower);
    } else if (type === 'solar') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 45), getMat(0x94a3b8));
      pole.position.y = 22.5;
      const panelGroup = new THREE.Group();
      panelGroup.position.y = 45;
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(80, 2, 30), getMat(0x0284c7, 0x0c4a6e));
      p1.rotation.z = 0.4;
      panelGroup.add(p1);
      group.add(pole, panelGroup);
    } else if (type === 'lab') {
      const body = new THREE.Mesh(new THREE.SphereGeometry(25, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), getMat(0xffffff, 0x475569));
      const dish = new THREE.Mesh(new THREE.SphereGeometry(12, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), getMat(0x64748b, 0x334155));
      dish.name = "dish";
      dish.position.y = 30;
      dish.rotation.x = -0.5;
      group.add(body, dish);
    } else if (type === 'plants') {
      const glass = new THREE.Mesh(new THREE.SphereGeometry(32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), 
        new THREE.MeshStandardMaterial({ color: 0xccffcc, transparent: true, opacity: isGhost ? 0.2 : 0.4, metalness: 0.9, roughness: 0.1 }));
      const plants = new THREE.Mesh(new THREE.TorusKnotGeometry(12, 4, 64, 8), getMat(0x22c55e, 0x14532d));
      plants.position.y = 15;
      group.add(glass, plants);
    } else if (type === 'habitat') {
      const main = new THREE.Mesh(new THREE.CapsuleGeometry(15, 20, 4, 12), getMat(0x38bdf8, 0x0c4a6e));
      main.position.y = 15;
      group.add(main);
    } else if (type === 'rover') {
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 30), getMat(0x94a3b8, 0x1e293b));
      chassis.position.y = 10;
      const wheelGeo = new THREE.CylinderGeometry(5, 5, 4, 12);
      const wheelMat = getMat(0x111827);
      for(let i=0; i<4; i++) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(i < 2 ? -12 : 12, 8, i % 2 === 0 ? -10 : 10);
        chassis.add(w);
      }
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 20), getMat(0x00ffff));
      ant.position.set(0, 15, -10);
      chassis.add(ant);
      group.add(chassis);
    }

    // MEDIUM SCALE REFINED: 1.8
    group.scale.setScalar(1.8);
    return group;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 100000); 
    camera.position.z = 2500;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 4.0);
    sun.position.set(5000, 2000, 1000);
    scene.add(sun);

    const starCount = 10000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 80000;
      starPos[i*3+1] = (Math.random() - 0.5) * 80000;
      starPos[i*3+2] = (Math.random() - 0.5) * 80000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 5, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const pRadius = (planetRef.current?.radius || 120) * 4.5;
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(pRadius, 128, 128), 
      new THREE.MeshStandardMaterial({ color: planetRef.current.baseColor, roughness: 0.8, metalness: 0.2 })
    );
    planetGroup.add(planetMesh);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(pRadius * 1.06, 64, 64), 
      new THREE.MeshBasicMaterial({ color: planetRef.current.atmosphereColor, transparent: true, opacity: 0.2, side: THREE.BackSide })
    );
    planetGroup.add(atmo);

    const buildingGroup = new THREE.Group();
    planetMesh.add(buildingGroup);

    scene.add(vfxGroupRef.current);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(60, 65, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    scene.add(ring);
    placementRingRef.current = ring;

    const shipGroup = new THREE.Group();
    shipGroup.position.set(0, -150, 800);
    scene.add(shipGroup);
    
    const shipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const shipBody = new THREE.Mesh(new THREE.BoxGeometry(60, 24, 160), shipMat);
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.7 }));
    cockpit.position.set(0, 12, -40); cockpit.rotation.x = Math.PI / 2;
    shipGroup.add(shipBody, cockpit);

    const engineGlows: THREE.Mesh[] = [];
    [[-45, -6, 80], [45, -6, 80]].forEach(pos => {
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(5, 15, 60, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }));
      glow.position.set(pos[0], pos[1], pos[2] + 30); glow.rotation.x = Math.PI / 2;
      shipGroup.add(glow); engineGlows.push(glow);
    });

    sceneRef.current = { scene, camera, renderer, planetMesh, planetGroup, atmo, stars, buildingGroup, shipGroup, engineGlows };

    const handleInput = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      mouse.current.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(clientY / window.innerHeight) * 2 + 1;

      if (e.type === 'mousedown' || e.type === 'touchstart') {
        isDragging.current = true;
        previousMouse.current = { x: clientX, y: clientY };
      } else if (e.type === 'mouseup' || e.type === 'touchend') {
        if (isPlacingRef.current && sceneRef.current) {
          raycaster.current.setFromCamera(mouse.current, sceneRef.current.camera);
          const intersects = raycaster.current.intersectObject(sceneRef.current.planetMesh);
          if (intersects.length > 0) {
            const point = intersects[0].point.clone();
            const localPoint = sceneRef.current.planetMesh.worldToLocal(point);
            onPlaceBuildingRef.current([localPoint.x, localPoint.y, localPoint.z]);
          }
        } else if (!isPlacingRef.current && viewModeRef.current === 'orbit') {
          raycaster.current.setFromCamera(mouse.current, sceneRef.current.camera);
          const intersects = raycaster.current.intersectObject(sceneRef.current.planetMesh);
          if (intersects.length > 0) onPlanetClickRef.current();
        }
        isDragging.current = false;
      }
    };

    window.addEventListener('mousedown', handleInput);
    window.addEventListener('mousemove', (e) => {
       const clientX = e.clientX;
       const clientY = e.clientY;
       mouse.current.x = (clientX / window.innerWidth) * 2 - 1;
       mouse.current.y = -(clientY / window.innerHeight) * 2 + 1;
       if (isDragging.current && viewModeRef.current === 'surface' && !isPlacingRef.current) {
         const deltaX = clientX - previousMouse.current.x;
         const deltaY = clientY - previousMouse.current.y;
         targetRotation.current.x += deltaY * 0.005;
         targetRotation.current.y += deltaX * 0.005;
         previousMouse.current = { x: clientX, y: clientY };
       }
    });
    window.addEventListener('mouseup', handleInput);
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => renderer.dispose();
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;
    if (ghostRef.current) scene.remove(ghostRef.current);
    if (isPlacing) {
      const g = createBuildingModel(isPlacing, true);
      scene.add(g);
      ghostRef.current = g;
    } else {
      ghostRef.current = null;
    }
  }, [isPlacing]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { buildingGroup } = sceneRef.current;
    buildingGroup.clear();
    buildings.forEach(b => {
      const model = createBuildingModel(b.type);
      model.position.set(b.position[0], b.position[1], b.position[2]);
      const normal = new THREE.Vector3().copy(model.position).normalize();
      model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      
      // Keep track of rover movement data
      if (b.type === 'rover') {
        model.userData.wanderOffset = Math.random() * 1000;
      }
      
      buildingGroup.add(model);
    });
  }, [buildings]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { planetMesh, atmo, planetGroup } = sceneRef.current;
    const p = planetRef.current;
    const rad = p.radius * 4.5;
    planetMesh.geometry = new THREE.SphereGeometry(rad, 128, 128);
    (planetMesh.material as THREE.MeshStandardMaterial).color.set(p.baseColor);
    atmo.geometry = new THREE.SphereGeometry(rad * 1.06, 64, 64);
    (atmo.material as THREE.MeshBasicMaterial).color.set(p.atmosphereColor);
    
    planetGroup.children.filter(c => c.name === 'rings').forEach(c => planetGroup.remove(c));
    if (p.hasRings) {
      const r = new THREE.Mesh(
        new THREE.RingGeometry(rad * 1.4, rad * 2.2, 64),
        new THREE.MeshStandardMaterial({ color: p.ringColor || 0xaaaaaa, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
      );
      r.rotation.x = Math.PI / 2.5; r.name = 'rings';
      planetGroup.add(r);
    }
  }, [planet]);

  useEffect(() => {
    let frame: number;
    const animate = (time: number) => {
      if (!sceneRef.current) return;
      const { renderer, scene, camera, planetMesh, stars, shipGroup, engineGlows, planetGroup, buildingGroup } = sceneRef.current;
      const curH = hyperdriveRef.current;
      const curO = viewOffsetRef.current;
      const curM = viewModeRef.current;
      const curP = planetRef.current;
      const curPlacing = isPlacingRef.current;

      planetGroup.visible = !curH;

      if (curM === 'orbit') {
        planetMesh.rotation.y += curP.rotationSpeed;
      } else if (curM === 'surface') {
        currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.1;
        currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.1;
        planetMesh.rotation.x = currentRotation.current.x;
        planetMesh.rotation.y = currentRotation.current.y;
      }

      // Animate building sub-parts
      buildingGroup.children.forEach((b: any) => {
        if (b.name === 'building-extractor') {
          const drill = b.getObjectByName('drill');
          if (drill) drill.rotation.y += 0.2;
        } else if (b.name === 'building-lab') {
          const dish = b.getObjectByName('dish');
          if (dish) dish.rotation.y += 0.02;
        } else if (b.name === 'building-rover') {
          // Movement Logic for Rovers
          const offset = b.userData.wanderOffset || 0;
          const speed = 0.0005;
          const t = (time + offset) * speed;
          
          // Move rover slightly along a circular path relative to its original point
          // Since it's a child of the planet mesh, we can rotate its group around the center
          b.rotation.y += 0.002;
          // Jitter wheels
          b.children[1]?.children.forEach((w: any) => w.rotation.x += 0.1);
        }
      });

      if (curM === 'orbit') {
        const tZ = curH ? 6000 : 2000;
        camera.position.z += (tZ - camera.position.z) * 0.1;
        camera.position.y += (0 - camera.position.y) * 0.1;
        camera.lookAt(0, 0, 0);
        shipGroup.visible = true;
      } else if (curM === 'landing') {
        camera.position.z += (400 - camera.position.z) * 0.02;
        camera.position.y += (200 - camera.position.y) * 0.02;
        if (camera.position.z < 450) onLandComplete();
        shipGroup.visible = false;
      } else if (curM === 'ascending') {
        camera.position.z += (2000 - camera.position.z) * 0.05;
        if (camera.position.z > 1900) onAscendComplete();
        shipGroup.visible = false;
      } else if (curM === 'surface') {
        const r = curP.radius * 4.5;
        camera.position.z += (r + 400 - camera.position.z) * 0.1;
        camera.position.y += (300 - camera.position.y) * 0.1;
        camera.lookAt(0, 0, 0);
        shipGroup.visible = false;
      }

      // Ghost placement
      if (curPlacing && ghostRef.current && curM === 'surface') {
        raycaster.current.setFromCamera(mouse.current, camera);
        const hit = raycaster.current.intersectObject(planetMesh);
        if (hit.length > 0) {
          ghostRef.current.visible = true;
          ghostRef.current.position.copy(hit[0].point);
          const n = new THREE.Vector3().copy(hit[0].point).normalize();
          ghostRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
          if (placementRingRef.current) {
            placementRingRef.current.visible = true;
            placementRingRef.current.position.copy(hit[0].point).add(n.clone().multiplyScalar(2));
            placementRingRef.current.quaternion.copy(ghostRef.current.quaternion);
            placementRingRef.current.rotation.x += Math.PI / 2;
            (placementRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.5;
          }
        } else {
          ghostRef.current.visible = false;
          if (placementRingRef.current) placementRingRef.current.visible = false;
        }
      } else {
        if (ghostRef.current) ghostRef.current.visible = false;
        if (placementRingRef.current) placementRingRef.current.visible = false;
      }

      const s = curH ? 10000 : 15;
      const arr = stars.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i*3+2] += s;
        if (arr[i*3+2] > 40000) arr[i*3+2] = -40000;
      }
      stars.geometry.attributes.position.needsUpdate = true;

      if (curM === 'orbit') {
        shipGroup.position.x += (curO.x * 70 - shipGroup.position.x) * 0.1;
        shipGroup.position.y += (-curO.y * 70 - 150 - shipGroup.position.y) * 0.1;
        shipGroup.rotation.z = -curO.x * 0.7;
      }

      engineGlows.forEach(g => {
        g.scale.setY(1 + (curH ? 150 : (curM === 'ascending' ? 40 : 1)) * (0.8 + Math.random() * 0.4));
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate(0);
    return () => cancelAnimationFrame(frame);
  }, [onLandComplete, onAscendComplete]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-black touch-none" />;
};

export default SimulationCanvas;
