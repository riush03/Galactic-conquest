
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
  onBuildingSelect: (type: BuildingType | null) => void;
  onLandComplete: () => void;
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
  onLandComplete
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouse = useRef(new THREE.Vector2());
  const raycaster = useRef(new THREE.Raycaster());
  
  // Interaction State
  const isDragging = useRef(false);
  const previousPointerPosition = useRef({ x: 0, y: 0 });
  const rotationVelocity = useRef({ x: 0, y: 0 });

  // Props Refs
  const viewOffsetRef = useRef(viewOffset);
  const hyperdriveRef = useRef(hyperdrive);
  const isStartedRef = useRef(isStarted);
  const planetRef = useRef(planet);

  useEffect(() => { viewOffsetRef.current = viewOffset; }, [viewOffset]);
  useEffect(() => { hyperdriveRef.current = hyperdrive; }, [hyperdrive]);
  useEffect(() => { isStartedRef.current = isStarted; }, [isStarted]);
  useEffect(() => { planetRef.current = planet; }, [planet]);

  // Animation Refs
  const currentSpin = useRef(0.001);
  const targetSpin = useRef(0.001);
  const planetScale = useRef(1);
  const expansionScale = useRef(0.8); // Start higher for visibility
  const hoverPos = useRef<THREE.Vector3 | null>(null);
  
  // Shooting & Asteroids Refs
  const asteroidsRef = useRef<THREE.Mesh[]>([]);
  const lasersRef = useRef<THREE.Mesh[]>([]);
  const landingProgress = useRef(0);

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
    shipGroup: THREE.Group;
    engines: THREE.PointLight[];
    asteroidsGroup: THREE.Group;
    lasersGroup: THREE.Group;
  } | null>(null);

  // --- Detailed Procedural Structure Factories ---
  const createSolarModel = () => {
    const group = new THREE.Group();
    // Base and Pole
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.02, 8), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    group.add(base);
    const pole = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.1, 0.015), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    pole.position.z = 0.05;
    pole.rotation.x = Math.PI / 2;
    group.add(pole);

    // Grid of Panels
    const panelGeo = new THREE.BoxGeometry(0.15, 0.005, 0.07);
    const panelMat = new THREE.MeshStandardMaterial({ 
      color: 0x004488, 
      emissive: 0x00aaff, 
      emissiveIntensity: 0.5, 
      metalness: 0.9,
      roughness: 0.1
    });
    
    // Left array
    const p1 = new THREE.Mesh(panelGeo, panelMat);
    p1.position.set(-0.08, 0, 0.1);
    p1.rotation.y = 0.4;
    group.add(p1);
    
    // Right array
    const p2 = p1.clone();
    p2.position.x = 0.08;
    p2.rotation.y = -0.4;
    group.add(p2);

    // Glowing Installation Pulse
    const light = new THREE.PointLight(0x00ffff, 0, 0.4);
    light.position.z = 0.15;
    group.add(light);
    return group;
  };

  const createLabModel = () => {
    const group = new THREE.Group();
    // Futuristic Science Domes
    const dome1 = new THREE.Mesh(new THREE.SphereGeometry(0.07, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.2 }));
    dome1.rotation.x = Math.PI / 2;
    group.add(dome1);

    const dome2 = dome1.clone();
    dome2.scale.setScalar(0.6);
    dome2.position.set(0.08, 0.08, 0);
    group.add(dome2);

    // Connectivity Tubes
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
    tube.position.set(0.04, 0.04, 0.02);
    tube.rotation.set(Math.PI/2, Math.PI/2, Math.PI/4);
    group.add(tube);

    // Rotating Radar Dish
    const antennaBase = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.06), new THREE.MeshStandardMaterial({ color: 0x888888 }));
    antennaBase.position.z = 0.07;
    antennaBase.rotation.x = Math.PI/2;
    group.add(antennaBase);

    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.04, 24, 16, 0, Math.PI * 2, 0, Math.PI / 4), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    dish.position.z = 0.12;
    dish.rotation.x = -Math.PI / 6;
    group.add(dish);
    return group;
  };

  const createDroneModel = () => {
    const group = new THREE.Group();
    // Hovering Drone with red glowing eyes
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 }));
    body.position.z = 0.15;
    group.add(body);

    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.005), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    eye.position.set(0, 0.015, 0.16);
    group.add(eye);

    const thrust = new THREE.PointLight(0x00ffff, 0.5, 0.1);
    thrust.position.set(0, 0, 0.14);
    group.add(thrust);
    return group;
  };

  const createSatelliteModel = () => {
    const group = new THREE.Group();
    // Floating orbital satellite
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 12), new THREE.MeshStandardMaterial({ color: 0x999999, metalness: 0.9 }));
    core.position.z = 0.4; // High orbit
    core.rotation.x = Math.PI/2;
    group.add(core);

    const panelGeo = new THREE.BoxGeometry(0.2, 0.005, 0.08);
    const panelMat = new THREE.MeshStandardMaterial({ color: 0x0044ff, emissive: 0x0022cc, emissiveIntensity: 0.6 });
    const w1 = new THREE.Mesh(panelGeo, panelMat);
    w1.position.set(0.15, 0, 0.4);
    const w2 = w1.clone();
    w2.position.x = -0.15;
    group.add(w1, w2);

    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.15), new THREE.MeshStandardMaterial({ color: 0xffffff }));
    antenna.position.set(0, 0, 0.5);
    antenna.rotation.x = Math.PI/2;
    group.add(antenna);
    return group;
  };

  const createExtractorModel = () => {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.05), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    base.position.z = 0.02;
    group.add(base);

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1), new THREE.MeshStandardMaterial({ color: 0x444444 }));
    shaft.position.z = 0.07;
    shaft.rotation.x = Math.PI/2;
    group.add(shaft);

    const drill = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 12), new THREE.MeshStandardMaterial({ color: 0x111111 }));
    drill.position.z = 0.12;
    drill.rotation.x = Math.PI/2;
    group.add(drill);
    return group;
  };

  const createHabitatModel = () => {
    const group = new THREE.Group();
    const mainPod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 }));
    mainPod.position.z = 0.04;
    mainPod.rotation.x = Math.PI/2;
    group.add(mainPod);

    const window = new THREE.Mesh(new THREE.SphereGeometry(0.02, 12, 12), new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00aaff }));
    window.position.set(0, 0.04, 0.06);
    group.add(window);
    return group;
  };

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x010411);
    
    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 50000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const sunLight = new THREE.DirectionalLight(0xffffff, 6);
    sunLight.position.set(2000, 1500, 1500);
    scene.add(sunLight);

    // High Detail Stars
    const starCount = 25000;
    const starGeometry = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i*3] = (Math.random() - 0.5) * 25000;
      starPos[i*3+1] = (Math.random() - 0.5) * 25000;
      starPos[i*3+2] = (Math.random() - 0.5) * 25000;
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: true, transparent: true, opacity: 0.9 }));
    scene.add(stars);

    // Planet Group
    const planetGroup = new THREE.Group();
    scene.add(planetGroup);

    const planetMesh = new THREE.Mesh(
      new THREE.SphereGeometry(1, 128, 128),
      new THREE.MeshStandardMaterial({ color: planetRef.current.baseColor, roughness: 0.7, metalness: 0.3 })
    );
    planetMesh.scale.setScalar(planetRef.current.radius * 2.5);
    planetGroup.add(planetMesh);

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(1.06, 128, 128),
      new THREE.MeshBasicMaterial({ color: planetRef.current.atmosphereColor, transparent: true, opacity: 0.25, side: THREE.BackSide })
    );
    atmo.scale.setScalar(planetRef.current.radius * 2.5);
    planetGroup.add(atmo);

    const buildingGroup = new THREE.Group();
    planetMesh.add(buildingGroup);

    // Hover Marker
    const hoverMarker = new THREE.Group();
    hoverMarker.add(new THREE.Mesh(new THREE.RingGeometry(0.04, 0.05, 48), new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide })));
    hoverMarker.visible = false;
    planetMesh.add(hoverMarker);

    // Asteroids with Varied Shapes
    const asteroidsGroup = new THREE.Group();
    scene.add(asteroidsGroup);
    const astGeo = new THREE.IcosahedronGeometry(1, 0);
    const astMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    for(let i=0; i<100; i++) {
      const ast = new THREE.Mesh(astGeo, astMat);
      ast.position.set((Math.random()-0.5)*8000, (Math.random()-0.5)*8000, (Math.random()-0.5)*15000 - 5000);
      ast.scale.setScalar(5 + Math.random()*50);
      ast.rotation.set(Math.random(), Math.random(), Math.random());
      asteroidsGroup.add(ast);
      asteroidsRef.current.push(ast);
    }

    const lasersGroup = new THREE.Group();
    scene.add(lasersGroup);

    // High-Tech Ship Model
    const shipGroup = new THREE.Group();
    shipGroup.scale.setScalar(4.5); 
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 1, roughness: 0.1 });
    const hull = new THREE.Mesh(new THREE.ConeGeometry(5, 28, 4), bodyMat);
    hull.rotation.x = Math.PI / 2;
    shipGroup.add(hull);
    const wings = new THREE.Mesh(new THREE.BoxGeometry(28, 1, 10), bodyMat);
    wings.position.set(0, -2, 6);
    shipGroup.add(wings);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(2.8, 24, 24, 0, Math.PI*2, 0, Math.PI/2), new THREE.MeshStandardMaterial({ color: 0x00ffff, transparent: true, opacity: 0.4, emissive: 0x00ffff, emissiveIntensity: 2.5 }));
    canopy.position.set(0, 3.5, -7);
    canopy.rotation.x = -Math.PI/6;
    shipGroup.add(canopy);

    const engines: THREE.PointLight[] = [];
    const enginePos = [[-7, -2, 14], [7, -2, 14]];
    enginePos.forEach(pos => {
      const glow = new THREE.Mesh(new THREE.SphereGeometry(1.5), new THREE.MeshBasicMaterial({ color: 0x00ffff }));
      glow.position.set(pos[0], pos[1], pos[2]);
      shipGroup.add(glow);
      const light = new THREE.PointLight(0x00ffff, 150, 40);
      light.position.set(pos[0], pos[1], pos[2]);
      shipGroup.add(light);
      engines.push(light);
    });

    scene.add(shipGroup);
    shipGroup.position.set(0, -30, 600); 

    sceneRef.current = { scene, camera, renderer, planetMesh, planetGroup, atmo, stars, buildingGroup, hoverMarker, shipGroup, engines, asteroidsGroup, lasersGroup };

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
      const { scene, stars, planetMesh, planetGroup, camera, atmo, renderer, hoverMarker, shipGroup, engines, lasersGroup } = sceneRef.current;

      const curStarted = isStartedRef.current;
      const curHyper = hyperdriveRef.current;
      const curOffset = viewOffsetRef.current;
      const curPlanet = planetRef.current;

      // Smooth expansion and scale transition
      const targetExp = curStarted ? 1.0 : 0.9;
      expansionScale.current += (targetExp - expansionScale.current) * 0.05;
      
      targetSpin.current = curPlanet.rotationSpeed;
      currentSpin.current += (targetSpin.current - currentSpin.current) * 0.05;
      
      if (!isDragging.current) {
        planetMesh.rotation.y += currentSpin.current;
        atmo.rotation.y += currentSpin.current * 0.85;
        rotationVelocity.current.x *= 0.96;
        rotationVelocity.current.y *= 0.96;
        planetMesh.rotation.y += rotationVelocity.current.x;
        planetMesh.rotation.x += rotationVelocity.current.y;
      }

      // Dynamic color updates
      (planetMesh.material as THREE.MeshStandardMaterial).color.set(curPlanet.baseColor);
      (atmo.material as THREE.MeshBasicMaterial).color.set(curPlanet.atmosphereColor);

      // Hyperdrive effects
      const sBase = curHyper ? 300 : 0.6;
      const starPositions = stars.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < (starPositions.length / 3); i++) {
        starPositions[i*3+2] += sBase;
        if (starPositions[i*3+2] > 12000) starPositions[i*3+2] = -12000;
      }
      stars.geometry.attributes.position.needsUpdate = true;

      // Update Asteroids
      asteroidsRef.current.forEach(ast => {
        ast.position.z += 8 + (curHyper ? 300 : 0);
        ast.rotation.x += 0.015;
        ast.rotation.y += 0.01;
        if (ast.position.z > 2500) {
          ast.position.set((Math.random()-0.5)*10000, (Math.random()-0.5)*10000, -8000);
          ast.visible = true;
        }
      });

      // Update Lasers
      for (let i = lasersRef.current.length - 1; i >= 0; i--) {
        const l = lasersRef.current[i];
        l.position.z -= 65;
        if (l.position.z < -8000) {
          lasersGroup.remove(l);
          lasersRef.current.splice(i, 1);
          continue;
        }
        asteroidsRef.current.forEach(ast => {
          if (ast.visible && l.position.distanceTo(ast.position) < ast.scale.x + 15) {
            ast.visible = false;
            spaceAudio.playExplosion();
            lasersGroup.remove(l);
            lasersRef.current.splice(i, 1);
          }
        });
      }

      // Landing phase
      if (viewMode === 'landing') {
        landingProgress.current += 0.006;
        shipGroup.position.z -= 30;
        shipGroup.scale.multiplyScalar(1.002);
        shipGroup.lookAt(planetGroup.position);
        if (landingProgress.current >= 1) {
          onLandComplete();
          landingProgress.current = 0;
        }
      }

      // Orbital Position & Rotation
      if (viewMode === 'orbit' || viewMode === 'landing') {
        camera.position.z += (950 - camera.position.z) * 0.06;
        planetGroup.position.x += (0 - planetGroup.position.x) * 0.1;
        planetGroup.position.y += (0 - planetGroup.position.y) * 0.1;
        
        if (viewMode === 'orbit') {
          shipGroup.visible = curStarted;
          shipGroup.position.x += (curOffset.x * 500 - shipGroup.position.x) * 0.12;
          shipGroup.position.y += (-50 - curOffset.y * 400 - shipGroup.position.y) * 0.12;
          shipGroup.position.z += (780 - shipGroup.position.z) * 0.08;
          shipGroup.rotation.z += (-curOffset.x * 1.5 - shipGroup.rotation.z) * 0.12;
          shipGroup.rotation.x += (curOffset.y * 1.0 - shipGroup.rotation.x) * 0.12;
          shipGroup.rotation.y += (curOffset.x * 0.5 - shipGroup.rotation.y) * 0.12;
          engines.forEach(l => l.intensity = 150 + (Math.abs(curOffset.x) + Math.abs(curOffset.y)) * 700);
        }
      } else {
        camera.position.z += (curPlanet.radius * 4.5 - camera.position.z) * 0.08;
        shipGroup.visible = false;
      }

      // Installation & Glow Effects for Structures
      const now = Date.now();
      sceneRef.current.buildingGroup.children.forEach((wrap: any) => {
        const timeSince = now - wrap.userData.timestamp;
        if (timeSince < 4000) {
          const progress = timeSince / 4000;
          const intensity = Math.sin(progress * Math.PI * 4) * (1 - progress) * 5.0;
          wrap.children.forEach((c: any) => {
            if (c.isPointLight) c.intensity = intensity;
          });
          wrap.scale.setScalar(1 + (1 - progress) * 0.2);
        }
      });

      const finalScale = curPlanet.radius * 2.5 * expansionScale.current;
      planetMesh.scale.setScalar(finalScale);
      atmo.scale.setScalar(finalScale * 1.06);

      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(frame);
  }, [viewMode, onLandComplete]);

  // Handle building updates
  useEffect(() => {
    if (!sceneRef.current) return;
    const { buildingGroup } = sceneRef.current;
    while(buildingGroup.children.length > 0) buildingGroup.remove(buildingGroup.children[0]);
    
    buildings.forEach(b => {
      const wrap: any = new THREE.Group();
      wrap.userData.timestamp = b.timestamp;
      wrap.position.set(...b.position);
      wrap.lookAt(0,0,0);
      let model;
      switch(b.type) {
        case 'solar': model = createSolarModel(); break;
        case 'lab': model = createLabModel(); break;
        case 'extractor': model = createExtractorModel(); break;
        case 'habitat': model = createHabitatModel(); break;
        case 'satellite': model = createSatelliteModel(); break;
        case 'drone': model = createDroneModel(); break;
        default: model = new THREE.Group();
      }
      wrap.add(model);
      buildingGroup.add(wrap);
    });
  }, [buildings]);

  // Input listeners
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && viewMode === 'orbit') {
        if (!sceneRef.current) return;
        const { shipGroup, lasersGroup } = sceneRef.current;
        spaceAudio.playLaser();
        const lGeo = new THREE.BoxGeometry(1.5, 1.5, 25);
        const lMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        [-15, 15].forEach(x => {
          const l = new THREE.Mesh(lGeo, lMat);
          l.position.copy(shipGroup.position);
          l.position.x += x;
          l.position.z -= 30;
          lasersGroup.add(l);
          lasersRef.current.push(l);
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [viewMode]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const { renderer, planetMesh, camera } = sceneRef.current;
    const onUp = (e: MouseEvent) => {
      if (isDragging.current) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.current.setFromCamera(mouse.current, camera);
      const hits = raycaster.current.intersectObject(planetMesh);
      if (hits.length > 0) {
        if (viewMode === 'orbit') onPlanetClick();
        else if (isPlacing) {
          const lp = planetMesh.worldToLocal(hits[0].point.clone()).normalize();
          onPlaceBuilding([lp.x, lp.y, lp.z]);
        }
      }
    };
    window.addEventListener('mouseup', onUp);
    return () => window.removeEventListener('mouseup', onUp);
  }, [viewMode, onPlanetClick, isPlacing, onPlaceBuilding]);

  return <div ref={containerRef} className="absolute inset-0 z-0 bg-black touch-none" />;
};

export default SimulationCanvas;
