
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
  const astronautRef = useRef<THREE.Group | null>(null);

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

  const createAstronaut = () => {
    const group = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const visorMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.9, roughness: 0.1, emissive: 0x00ffff, emissiveIntensity: 0.5 });

    // Body
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(4, 6, 4, 8), whiteMat);
    body.position.y = 8;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(3.5, 12, 12), whiteMat);
    head.position.y = 15;
    group.add(head);

    // Visor
    const visor = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.8), visorMat);
    visor.position.set(0, 15, 1.5);
    visor.rotation.x = -Math.PI / 2;
    group.add(visor);

    // Jetpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(6, 8, 3), darkMat);
    pack.position.set(0, 10, -3);
    group.add(pack);

    // Arms
    const leftArm = new THREE.Mesh(new THREE.CapsuleGeometry(1, 4, 4, 8), whiteMat);
    leftArm.name = "leftArm";
    leftArm.position.set(-5, 12, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.CapsuleGeometry(1, 4, 4, 8), whiteMat);
    rightArm.name = "rightArm";
    rightArm.position.set(5, 12, 0);
    group.add(rightArm);

    group.scale.setScalar(1.5);
    return group;
  };

  const createBuildingModel = (type: BuildingType, isGhost = false) => {
    const group = new THREE.Group();
    group.name = `building-${type}`;
    const opacity = isGhost ? 0.5 : 1.0;
    const getMat = (color: number, emissive = 0x000000) => new THREE.MeshStandardMaterial({ 
      color: isGhost ? 0x00ffff : color, transparent: isGhost, opacity, metalness: 0.8, roughness: 0.2,
      emissive: isGhost ? 0x00ffff : emissive, emissiveIntensity: isGhost ? 1.0 : 0.5
    });

    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(25, 30, 8, 16), getMat(0x0f172a));
    basePlate.position.y = -4;
    group.add(basePlate);

    if (type === 'extractor') {
      const tower = new THREE.Mesh(new THREE.BoxGeometry(18, 50, 18), getMat(0xeab308, 0x713f12));
      tower.position.y = 25;
      const bit = new THREE.Mesh(new THREE.CylinderGeometry(2, 12, 25, 8), getMat(0x64748b, 0x1e293b));
      bit.name = "drill";
      bit.position.y = -15;
      tower.add(bit);
      group.add(tower);
    } else if (type === 'solar') {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(4, 4, 50), getMat(0x94a3b8));
      pole.position.y = 25;
      const panels = new THREE.Group();
      panels.position.y = 50;
      const p1 = new THREE.Mesh(new THREE.BoxGeometry(90, 2, 40), getMat(0x0284c7, 0x075985));
      p1.rotation.z = 0.5;
      panels.add(p1);
      group.add(pole, panels);
    } else if (type === 'lab') {
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(28, 1), getMat(0xffffff, 0x64748b));
      body.position.y = 20;
      const dish = new THREE.Mesh(new THREE.SphereGeometry(15, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), getMat(0x64748b, 0x00ffff));
      dish.name = "dish";
      dish.position.y = 45;
      dish.rotation.x = -0.5;
      group.add(body, dish);
    } else if (type === 'plants') {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), 
        new THREE.MeshStandardMaterial({ color: 0xa7f3d0, transparent: true, opacity: isGhost ? 0.3 : 0.45, metalness: 0.9, roughness: 0.05 }));
      const life = new THREE.Mesh(new THREE.TorusKnotGeometry(15, 5, 100, 16), getMat(0x22c55e, 0x064e3b));
      life.position.y = 15;
      life.name = "plant";
      group.add(dome, life);
    } else if (type === 'habitat') {
      const hub = new THREE.Mesh(new THREE.CapsuleGeometry(18, 25, 4, 16), getMat(0x38bdf8, 0x075985));
      hub.position.y = 20;
      const lights = new THREE.Mesh(new THREE.TorusGeometry(18, 1, 8, 24), getMat(0x00ffff, 0x00ffff));
      lights.position.y = 35; lights.rotation.x = Math.PI / 2;
      group.add(hub, lights);
    } else if (type === 'rover') {
      const chassis = new THREE.Group();
      chassis.name = "roverChassis";
      const body = new THREE.Mesh(new THREE.BoxGeometry(25, 10, 40), getMat(0x94a3b8, 0x334155));
      body.position.y = 5;
      chassis.add(body);
      const wheelGeo = new THREE.CylinderGeometry(8, 8, 6, 16);
      const wheelMat = getMat(0x111827);
      for(let i=0; i<4; i++) {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.name = `wheel_${i}`;
        w.rotation.z = Math.PI / 2;
        w.position.set(i < 2 ? -18 : 18, 5, i % 2 === 0 ? -15 : 15);
        chassis.add(w);
      }
      const cam = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 6), getMat(0x0ea5e9, 0x00ffff));
      cam.position.set(0, 15, -15);
      chassis.add(cam);
      group.add(chassis);
    }

    group.scale.setScalar(1.8);
    return group;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617);
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 300000); 
    camera.position.z = 2500;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2.0));
    const sun = new THREE.DirectionalLight(0xffffff, 5.0);
    sun.position.set(15000, 8000, 3000);
    scene.add(sun);

    const starCount = 20000;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 150000;
      starPos[i*3+1] = (Math.random() - 0.5) * 150000;
      starPos[i*3+2] = (Math.random() - 0.5) * 150000;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 7, transparent: true, opacity: 0.9 }));
    scene.add(stars);

    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const pRadius = (planetRef.current?.radius || 120) * 4.5;
    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(pRadius, 128, 128), 
      new THREE.MeshStandardMaterial({ color: planetRef.current.baseColor, roughness: 0.75, metalness: 0.25 })
    );
    planetGroup.add(planetMesh);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(pRadius * 1.07, 64, 64), 
      new THREE.MeshBasicMaterial({ color: planetRef.current.atmosphereColor, transparent: true, opacity: 0.25, side: THREE.BackSide })
    );
    planetGroup.add(atmo);

    const buildingGroup = new THREE.Group();
    planetMesh.add(buildingGroup);

    scene.add(vfxGroupRef.current);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(70, 76, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0 })
    );
    scene.add(ring);
    placementRingRef.current = ring;

    const shipGroup = new THREE.Group();
    shipGroup.position.set(0, -150, 1200);
    scene.add(shipGroup);
    
    shipGroup.scale.setScalar(2.5);
    const shipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.15 });
    const shipBody = new THREE.Mesh(new THREE.BoxGeometry(60, 26, 170), shipMat);
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x0ea5e9, transparent: true, opacity: 0.8 }));
    cockpit.position.set(0, 13, -50); cockpit.rotation.x = Math.PI / 2;
    shipGroup.add(shipBody, cockpit);

    const engineGlows: THREE.Mesh[] = [];
    [[-45, -7, 85], [45, -7, 85]].forEach(pos => {
      const glow = new THREE.Mesh(new THREE.CylinderGeometry(6, 18, 65, 12), new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.95 }));
      glow.position.set(pos[0], pos[1], pos[2] + 32); glow.rotation.x = Math.PI / 2;
      shipGroup.add(glow); engineGlows.push(glow);
    });

    // Create Astronaut (Hidden initially)
    const astro = createAstronaut();
    astro.visible = false;
    planetMesh.add(astro);
    astronautRef.current = astro;

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
         targetRotation.current.x += deltaY * 0.006;
         targetRotation.current.y += deltaX * 0.006;
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
      
      if (b.type === 'rover') {
        model.userData.targetPos = new THREE.Vector3().copy(model.position);
        model.userData.isMoving = false;
        model.userData.originalNormal = new THREE.Vector3().copy(normal);
        model.userData.angle = 0;
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
    atmo.geometry = new THREE.SphereGeometry(rad * 1.07, 64, 64);
    (atmo.material as THREE.MeshBasicMaterial).color.set(p.atmosphereColor);
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
        if (astronautRef.current) astronautRef.current.visible = false;
      } else if (curM === 'surface') {
        currentRotation.current.x += (targetRotation.current.x - currentRotation.current.x) * 0.15;
        currentRotation.current.y += (targetRotation.current.y - currentRotation.current.y) * 0.15;
        planetMesh.rotation.x = currentRotation.current.x;
        planetMesh.rotation.y = currentRotation.current.y;

        // Astronaut Animation
        if (astronautRef.current) {
          astronautRef.current.visible = true;
          // Slowly wave hand
          const leftArm = astronautRef.current.getObjectByName("leftArm");
          if (leftArm) leftArm.rotation.x = Math.sin(time * 0.005) * 0.5;
          const rightArm = astronautRef.current.getObjectByName("rightArm");
          if (rightArm) rightArm.rotation.z = Math.PI + Math.sin(time * 0.008) * 0.8;
          
          // Hover if still landing
          if (astronautRef.current.userData.landingPhase < 1) {
            astronautRef.current.userData.landingPhase += 0.01;
            const r = curP.radius * 4.5;
            const hoverHeight = 40 * (1 - astronautRef.current.userData.landingPhase);
            const pos = astronautRef.current.userData.landPoint.clone().normalize().multiplyScalar(r + 5 + hoverHeight);
            astronautRef.current.position.copy(pos);
            const normal = pos.clone().normalize();
            astronautRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
          }
        }
      }

      buildingGroup.children.forEach((b: any) => {
        if (b.name === 'building-extractor') {
          const drill = b.getObjectByName('drill');
          if (drill) drill.rotation.y += 0.3;
        } else if (b.name === 'building-lab') {
          const dish = b.getObjectByName('dish');
          if (dish) dish.rotation.y += 0.03;
        } else if (b.name === 'building-plants') {
          const plant = b.getObjectByName('plant');
          if (plant) {
             plant.rotation.y += 0.01;
             plant.scale.setScalar(1 + Math.sin(time * 0.002) * 0.1);
          }
        } else if (b.name === 'building-rover') {
          const rRadius = curP.radius * 4.5;
          const roverSpeed = 0.8;
          if (!b.userData.isMoving || b.position.distanceTo(b.userData.targetPos) < 10) {
            const randAxis = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
            const angle = (Math.random() - 0.5) * 0.3; 
            const newTarget = b.position.clone().applyAxisAngle(randAxis, angle).normalize().multiplyScalar(rRadius);
            b.userData.targetPos = newTarget;
            b.userData.isMoving = true;
          }
          const direction = b.userData.targetPos.clone().sub(b.position).normalize();
          b.position.add(direction.multiplyScalar(roverSpeed));
          b.position.normalize().multiplyScalar(rRadius);
          const normal = b.position.clone().normalize();
          b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
          const chassis = b.getObjectByName('roverChassis');
          if (chassis) {
            const lookTarget = b.userData.targetPos.clone();
            const localTarget = chassis.worldToLocal(lookTarget);
            const angleToTarget = Math.atan2(localTarget.x, localTarget.z);
            chassis.rotation.y += (angleToTarget - chassis.rotation.y) * 0.1;
            chassis.children.forEach((child: any) => {
              if (child.name.startsWith('wheel')) child.rotation.x += 0.25;
            });
            chassis.position.y = 5 + Math.sin(time * 0.02) * 0.5;
          }
        }
      });

      if (curM === 'orbit') {
        const tZ = curH ? 8000 : 2800;
        camera.position.z += (tZ - camera.position.z) * 0.1;
        camera.position.y += (0 - camera.position.y) * 0.1;
        camera.lookAt(0, 0, 0);
        shipGroup.visible = true;
        shipGroup.position.z += (1200 - shipGroup.position.z) * 0.1;
      } else if (curM === 'landing') {
        const planetRad = curP.radius * 4.5;
        // DEEP ZOOM: Camera goes very close to surface
        camera.position.z += (planetRad + 400 - camera.position.z) * 0.03;
        camera.position.y += (200 - camera.position.y) * 0.03;
        
        shipGroup.position.z += (planetRad + 100 - shipGroup.position.z) * 0.03;
        shipGroup.position.y += (-50 - shipGroup.position.y) * 0.03;
        shipGroup.scale.setScalar(2.5 * (1 + (800 - shipGroup.position.z)/600));

        if (camera.position.z < planetRad + 650) {
          // Initialize astronaut landing point
          if (astronautRef.current) {
            const ray = new THREE.Vector3(0, 0, 1).applyQuaternion(camera.quaternion).negate();
            astronautRef.current.userData.landPoint = new THREE.Vector3().copy(ray).multiplyScalar(planetRad);
            astronautRef.current.userData.landingPhase = 0;
          }
          onLandComplete();
        }
        shipGroup.visible = true;
      } else if (curM === 'ascending') {
        camera.position.z += (2800 - camera.position.z) * 0.05;
        shipGroup.position.z += (1200 - shipGroup.position.z) * 0.05;
        if (camera.position.z > 2700) onAscendComplete();
        shipGroup.visible = true;
      } else if (curM === 'surface') {
        const r = curP.radius * 4.5;
        camera.position.z += (r + 450 - camera.position.z) * 0.15;
        camera.position.y += (350 - camera.position.y) * 0.15;
        camera.lookAt(0, 0, 0);
        shipGroup.visible = false;
      }

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
            placementRingRef.current.position.copy(hit[0].point).add(n.clone().multiplyScalar(3));
            placementRingRef.current.quaternion.copy(ghostRef.current.quaternion);
            placementRingRef.current.rotation.x += Math.PI / 2;
            (placementRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.6;
          }
        } else {
          ghostRef.current.visible = false;
          if (placementRingRef.current) placementRingRef.current.visible = false;
        }
      } else {
        if (ghostRef.current) ghostRef.current.visible = false;
        if (placementRingRef.current) placementRingRef.current.visible = false;
      }

      const s = curH ? 15000 : 25;
      const arr = stars.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i*3+2] += s;
        if (arr[i*3+2] > 60000) arr[i*3+2] = -60000;
      }
      stars.geometry.attributes.position.needsUpdate = true;

      if (curM === 'orbit') {
        shipGroup.position.x += (curO.x * 120 - shipGroup.position.x) * 0.1;
        shipGroup.position.y += (-curO.y * 120 - 150 - shipGroup.position.y) * 0.1;
        shipGroup.rotation.z = -curO.x * 0.9;
        shipGroup.rotation.y = curO.x * 0.4;
        shipGroup.rotation.x = -curO.y * 0.4;
      }

      engineGlows.forEach(g => {
        g.scale.setY(1 + (curH ? 250 : (curM === 'ascending' || curM === 'landing' ? 80 : 1)) * (0.8 + Math.random() * 0.4));
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
