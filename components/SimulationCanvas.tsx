
import React, { useRef, useEffect, useMemo } from 'react';
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

  useEffect(() => { viewOffsetRef.current = viewOffset; }, [viewOffset]);
  useEffect(() => { hyperdriveRef.current = hyperdrive; }, [hyperdrive]);
  useEffect(() => { planetRef.current = planet; }, [planet]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { isPlacingRef.current = isPlacing; }, [isPlacing]);

  const ghostRef = useRef<THREE.Group | null>(null);
  const placementRingRef = useRef<THREE.Mesh | null>(null);
  const surfaceLightRef = useRef<THREE.PointLight | null>(null);
  const vfxGroupRef = useRef<THREE.Group>(new THREE.Group());

  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    planetMesh: THREE.Mesh;
    planetGroup: THREE.Group;
    atmo: THREE.Mesh;
    rings: THREE.Mesh | null;
    stars: THREE.Points;
    buildingGroup: THREE.Group;
    shipGroup: THREE.Group;
    engineGlows: THREE.Mesh[];
  } | null>(null);

  const createBuildingModel = (type: BuildingType, isGhost = false) => {
    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({ 
      color: isGhost ? 0x00ffff : 0xffffff, 
      transparent: isGhost, 
      opacity: isGhost ? 0.4 : 1,
      metalness: 0.9,
      roughness: 0.1,
      emissive: isGhost ? 0x00ffff : 0x111111,
      emissiveIntensity: isGhost ? 0.8 : 0.2
    });

    const basePlate = new THREE.Mesh(
      new THREE.CylinderGeometry(30, 38, 15, 16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.4 })
    );
    basePlate.position.y = -6; 
    group.add(basePlate);

    if (type === 'extractor') {
      const h = 50;
      const core = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, h, 8), material);
      core.position.y = h / 2;
      const drillGroup = new THREE.Group();
      drillGroup.name = "drill";
      const drill = new THREE.Mesh(new THREE.ConeGeometry(12, 55, 8), material);
      drill.position.y = h + 15;
      drillGroup.add(drill);
      group.add(core, drillGroup);
    } else if (type === 'solar') {
      const h = 55; 
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, h), material);
      mast.position.y = h / 2;
      const panelGroup = new THREE.Group();
      const panelGeo = new THREE.BoxGeometry(100, 3, 50);
      const panelMat = new THREE.MeshStandardMaterial({ color: isGhost ? 0x00ffff : 0x0ea5e9, emissive: isGhost ? 0x00ffff : 0x0033aa, emissiveIntensity: 0.6 });
      const panelL = new THREE.Mesh(panelGeo, panelMat);
      panelL.position.set(-60, h, 0);
      panelL.rotation.z = -0.5;
      const panelR = panelL.clone();
      panelR.position.x = 60;
      panelR.rotation.z = 0.5;
      panelGroup.add(panelL, panelR);
      group.add(mast, panelGroup);
    } else if (type === 'lab') {
      const r = 40;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), material);
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 70), material);
      antenna.position.y = r + 20;
      antenna.name = "antenna";
      const dish = new THREE.Mesh(new THREE.SphereGeometry(25, 24, 12, 0, Math.PI * 2, 0, Math.PI / 4), material);
      dish.position.y = 30;
      dish.rotation.x = -Math.PI / 4;
      antenna.add(dish);
      group.add(dome, antenna);
    } else {
      const pod = new THREE.Mesh(new THREE.CapsuleGeometry(25, 40, 4, 12), material);
      pod.rotation.z = Math.PI / 2;
      pod.position.y = 25;
      group.add(pod);
    }

    group.scale.setScalar(2.0); 
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

    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 5.0);
    sun.position.set(5000, 2000, 1000);
    scene.add(sun);

    const starCount = 20000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 80000;
      starPos[i*3+1] = (Math.random() - 0.5) * 80000;
      starPos[i*3+2] = (Math.random() - 0.5) * 80000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 4.5, transparent: true, opacity: 0.8 }));
    scene.add(stars);

    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const currentPlanet = planetRef.current;
    const realRadius = (currentPlanet?.radius || 120) * 4.5;
    
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(realRadius, 256, 256), 
      new THREE.MeshStandardMaterial({ 
        color: currentPlanet?.baseColor || '#3b82f6',
        roughness: 0.85,
        metalness: 0.15
      })
    );
    planetGroup.add(planetMesh);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(realRadius * 1.06, 128, 128), 
      new THREE.MeshBasicMaterial({ color: currentPlanet?.atmosphereColor || '#60a5fa', transparent: true, opacity: 0.22, side: THREE.BackSide })
    );
    planetGroup.add(atmo);

    let rings: THREE.Mesh | null = null;
    if (currentPlanet?.hasRings) {
      const inner = realRadius * (currentPlanet.ringRadiusInner || 1.4);
      const outer = realRadius * (currentPlanet.ringRadiusOuter || 2.4);
      const ringGeo = new THREE.RingGeometry(inner, outer, 128);
      const ringMat = new THREE.MeshStandardMaterial({ 
        color: currentPlanet.ringColor || 0xaaaaaa, 
        transparent: true, 
        opacity: 0.6, 
        side: THREE.DoubleSide 
      });
      rings = new THREE.Mesh(ringGeo, ringMat);
      rings.rotation.x = Math.PI / 2.2;
      planetGroup.add(rings);
    }

    const buildingGroup = new THREE.Group();
    planetMesh.add(buildingGroup);

    scene.add(vfxGroupRef.current);

    const placementRing = new THREE.Mesh(
      new THREE.RingGeometry(80, 85, 64), 
      new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    scene.add(placementRing);
    placementRingRef.current = placementRing;

    const sLight = new THREE.PointLight(0x00ffff, 0, 1500);
    scene.add(sLight);
    surfaceLightRef.current = sLight;

    const shipGroup = new THREE.Group();
    shipGroup.position.set(0, -150, 800);
    scene.add(shipGroup);
    
    const shipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const shipBody = new THREE.Mesh(new THREE.BoxGeometry(60, 24, 180), shipMat);
    const shipWings = new THREE.Mesh(new THREE.BoxGeometry(240, 6, 90), shipMat);
    shipWings.position.z = 30;
    
    const cockpit = new THREE.Mesh(
      new THREE.SphereGeometry(20, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.7 })
    );
    cockpit.position.set(0, 15, -60);
    cockpit.rotation.x = Math.PI / 2;
    shipGroup.add(shipBody, shipWings, cockpit);

    const engineGlows: THREE.Mesh[] = [];
    [[-50, -6, 90], [50, -6, 90]].forEach(pos => {
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(6, 18, 70, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 }));
      glow.position.set(pos[0], pos[1], pos[2] + 35);
      glow.rotation.x = Math.PI / 2;
      shipGroup.add(glow);
      engineGlows.push(glow);
    });

    sceneRef.current = { scene, camera, renderer, planetMesh, planetGroup, atmo, rings, stars, buildingGroup, shipGroup, engineGlows };

    const handleInput = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      mouse.current.x = (clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(clientY / window.innerHeight) * 2 + 1;

      if (e.type === 'mousedown' || e.type === 'touchstart') {
        isDragging.current = true;
        previousMouse.current = { x: clientX, y: clientY };
      } else if (e.type === 'mousemove' || e.type === 'touchmove') {
        if (isDragging.current && viewModeRef.current === 'surface' && !isPlacingRef.current) {
          const deltaX = clientX - previousMouse.current.x;
          const deltaY = clientY - previousMouse.current.y;
          targetRotation.current.x += deltaY * 0.005;
          targetRotation.current.y += deltaX * 0.005;
          previousMouse.current = { x: clientX, y: clientY };
        }
      } else if (e.type === 'mouseup' || e.type === 'touchend') {
        if (isPlacingRef.current && sceneRef.current) {
          raycaster.current.setFromCamera(mouse.current, sceneRef.current.camera);
          const intersects = raycaster.current.intersectObject(sceneRef.current.planetMesh);
          
          if (intersects.length > 0) {
            const point = intersects[0].point.clone();
            sceneRef.current.planetMesh.updateMatrixWorld();
            const localPoint = sceneRef.current.planetMesh.worldToLocal(point);
            onPlaceBuilding([localPoint.x, localPoint.y, localPoint.z]);
            spaceAudio.playLaser();

            const flash = new THREE.Mesh(
              new THREE.SphereGeometry(150, 32, 32),
              new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 1.0 })
            );
            flash.position.copy(point);
            flash.userData = { age: 0, maxAge: 20 };
            vfxGroupRef.current.add(flash);
            
            if (ghostRef.current) ghostRef.current.visible = false;
          }
        } else if (!isPlacingRef.current && viewModeRef.current === 'orbit') {
          raycaster.current.setFromCamera(mouse.current, sceneRef.current.camera);
          const intersects = raycaster.current.intersectObject(sceneRef.current.planetMesh);
          if (intersects.length > 0) onPlanetClick();
        }
        isDragging.current = false;
      }
    };

    window.addEventListener('mousedown', handleInput);
    window.addEventListener('mousemove', handleInput);
    window.addEventListener('mouseup', handleInput);
    window.addEventListener('touchstart', handleInput);
    window.addEventListener('touchmove', handleInput, { passive: false });
    window.addEventListener('touchend', handleInput);

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    return () => {
      window.removeEventListener('mousedown', handleInput);
      window.removeEventListener('mousemove', handleInput);
      window.removeEventListener('mouseup', handleInput);
      window.removeEventListener('touchstart', handleInput);
      window.removeEventListener('touchmove', handleInput);
      window.removeEventListener('touchend', handleInput);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { buildingGroup } = sceneRef.current;
    
    buildingGroup.clear();
    buildings.forEach(b => {
      const model = createBuildingModel(b.type);
      model.position.set(b.position[0], b.position[1], b.position[2]);
      const normal = new THREE.Vector3().copy(model.position).normalize();
      model.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
      buildingGroup.add(model);
    });
  }, [buildings]);

  useEffect(() => {
    let frame: number;
    const animate = () => {
      if (!sceneRef.current) return;
      const { renderer, scene, camera, planetMesh, stars, shipGroup, engineGlows, atmo, rings } = sceneRef.current;
      
      const curHyper = hyperdriveRef.current;
      const curOffset = viewOffsetRef.current;
      const curMode = viewModeRef.current;
      const curPlacing = isPlacingRef.current;
      const curPlanet = planetRef.current;

      const pRadius = (curPlanet?.radius || 120) * 4.5;

      if (curMode === 'orbit') {
        planetMesh.rotation.y += curPlanet.rotationSpeed;
        if (rings) rings.rotation.z += curPlanet.rotationSpeed * 0.2;
      } else if (curMode === 'surface') {
        currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.15;
        currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.15;
        planetMesh.rotation.x = currentRotation.current.x;
        planetMesh.rotation.y = currentRotation.current.y;
      }
      atmo.rotation.y += curPlanet.rotationSpeed * 0.5;

      // Transitions
      if (curMode === 'orbit') {
        const targetZ = curHyper ? 3500 : 1800;
        camera.position.z += (targetZ - camera.position.z) * 0.05;
        camera.position.y += (0 - camera.position.y) * 0.05;
        camera.lookAt(0, 0, 0);
        shipGroup.visible = true;
      } else if (curMode === 'landing') {
        camera.position.z += (300 - camera.position.z) * 0.015; 
        camera.position.y += (180 - camera.position.y) * 0.015;
        // Turbulence jitter
        camera.position.x += (Math.random() - 0.5) * 1.5;
        camera.position.y += (Math.random() - 0.5) * 1.5;
        if (camera.position.z < 350) onLandComplete();
        shipGroup.visible = false;
      } else if (curMode === 'ascending') {
        camera.position.z += (2500 - camera.position.z) * 0.02;
        camera.position.y += (0 - camera.position.y) * 0.02;
        // Thruster shake
        camera.position.x += (Math.random() - 0.5) * 3;
        camera.position.y += (Math.random() - 0.5) * 3;
        if (camera.position.z > 2400) onAscendComplete();
        shipGroup.visible = false;
      } else if (curMode === 'surface') {
        const targetCamZ = pRadius + 280;
        const targetCamY = 180;
        camera.position.z += (targetCamZ - camera.position.z) * 0.08;
        camera.position.y += (targetCamY - camera.position.y) * 0.08;
        camera.lookAt(0, 0, 0);
        shipGroup.visible = false;
      }

      raycaster.current.setFromCamera(mouse.current, camera);
      const hits = raycaster.current.intersectObject(planetMesh);

      if (curMode === 'surface') {
        if (hits.length > 0) {
          const point = hits[0].point;
          const normal = hits[0].face!.normal.clone().applyQuaternion(planetMesh.quaternion);

          if (surfaceLightRef.current) {
            surfaceLightRef.current.position.copy(point).add(normal.clone().multiplyScalar(150));
            surfaceLightRef.current.intensity = curPlacing ? 60 : 25;
            surfaceLightRef.current.color.set(curPlacing ? 0x00ffff : 0xffffff);
          }

          if (curPlacing) {
            if (!ghostRef.current || ghostRef.current.userData.type !== curPlacing) {
              if (ghostRef.current) scene.remove(ghostRef.current);
              ghostRef.current = createBuildingModel(curPlacing, true);
              ghostRef.current.userData.type = curPlacing;
              scene.add(ghostRef.current);
            }
            ghostRef.current.position.copy(point);
            ghostRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            ghostRef.current.visible = true;

            if (placementRingRef.current) {
              placementRingRef.current.position.copy(point).add(normal.clone().multiplyScalar(20));
              placementRingRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
              (placementRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9 + Math.sin(Date.now() * 0.02) * 0.1;
            }
          }
        } else {
          if (ghostRef.current) ghostRef.current.visible = false;
          if (placementRingRef.current) (placementRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
          if (surfaceLightRef.current) surfaceLightRef.current.intensity = 0;
        }
      } else {
         if (ghostRef.current) ghostRef.current.visible = false;
      }

      vfxGroupRef.current.children.forEach((child) => {
        child.userData.age++;
        const p = child.userData.age / child.userData.maxAge;
        if (child instanceof THREE.Mesh) {
          (child.material as THREE.MeshBasicMaterial).opacity = (1 - p);
          child.scale.setScalar(1 + p * 2.0);
        }
        if (child.userData.age >= child.userData.maxAge) {
          vfxGroupRef.current.remove(child);
        }
      });

      const sBase = curHyper ? 2800 : (curMode === 'ascending' ? 50 : 6.0);
      const starPosArr = stars.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < starPosArr.length / 3; i++) {
        starPosArr[i*3+2] += sBase;
        if (starPosArr[i*3+2] > 40000) starPosArr[i*3+2] = -40000;
      }
      stars.geometry.attributes.position.needsUpdate = true;

      if (curMode === 'orbit') {
        shipGroup.position.x += (curOffset.x * 60 - shipGroup.position.x) * 0.1;
        shipGroup.position.y += (-curOffset.y * 60 - 150 - shipGroup.position.y) * 0.1;
        shipGroup.rotation.z = -curOffset.x * 0.6;
        shipGroup.rotation.x = curOffset.y * 0.4;
      }

      engineGlows.forEach(glow => {
        glow.scale.setY(1 + Math.random() * 0.5 + (curHyper ? 100 : (curMode === 'ascending' ? 20 : 0)));
        (glow.material as THREE.MeshBasicMaterial).opacity = 0.8 + Math.random() * 0.2;
      });

      sceneRef.current.buildingGroup.children.forEach(child => {
        const drill = child.getObjectByName('drill');
        if (drill) drill.rotation.y += 0.35;
        const antenna = child.getObjectByName('antenna');
        if (antenna) antenna.rotation.y += 0.1;
      });

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [onLandComplete, onAscendComplete]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-black cursor-crosshair touch-none" />;
};

export default SimulationCanvas;
