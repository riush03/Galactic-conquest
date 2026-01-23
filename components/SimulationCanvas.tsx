
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { LevelDef, ViewMode, Building, BuildingType } from '../types.ts';

const THREE_NS = THREE;
const SUN_RAD = 16000;

interface SimulationCanvasProps {
  levels: LevelDef[];
  activeIndex: number;
  hyperdrive: boolean;
  viewMode: ViewMode;
  buildings: Building[];
  selectedBuildingType: BuildingType | null;
  onPlanetClick: (point?: [number, number, number]) => void;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ 
  levels, activeIndex, hyperdrive, viewMode, buildings, selectedBuildingType, onPlanetClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cinematicTime = useRef(0);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const planetsRef = useRef<any[]>([]);
  const planetMeshesRef = useRef<THREE.Mesh[]>([]);
  const ghostGroupRef = useRef<THREE.Group | null>(null);
  const placementRingRef = useRef<THREE.Mesh | null>(null);
  
  const stateRef = useRef({ activeIndex, hyperdrive, viewMode, selectedBuildingType });

  useEffect(() => {
    stateRef.current = { activeIndex, hyperdrive, viewMode, selectedBuildingType };
  }, [activeIndex, hyperdrive, viewMode, selectedBuildingType]);

  const getAltitude = (type: BuildingType, visualRadius: number) => {
    switch(type) {
      case 'drone': return visualRadius * 0.2;
      case 'shuttle': return visualRadius * 0.4;
      case 'satellite': return visualRadius * 0.8;
      case 'station_core':
      case 'station_wing':
      case 'station_dock': return visualRadius * 0.6;
      default: return 0;
    }
  };

  const generateSunTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = '#ff8800';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < 40000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = 1 + Math.random() * 4;
      const mix = Math.random();
      
      if (mix > 0.99) {
        ctx.fillStyle = '#331100';
      } else if (mix > 0.7) {
        ctx.fillStyle = '#ffcc00';
      } else {
        ctx.fillStyle = '#ffaa00';
      }
      
      ctx.globalAlpha = 0.2 + Math.random() * 0.4;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const rx = 30 + Math.random() * 120;
      const ry = 5 + Math.random() * 20;
      ctx.fillStyle = '#ffff66';
      ctx.globalAlpha = 0.05;
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    
    const texture = new THREE_NS.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  };

  const generatePlanetTexture = (p: any) => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 1024;
    const ctx = canvas.getContext('2d', { alpha: false })!;
    const baseColor = new THREE.Color(p.baseColor);
    const atmosphereColor = new THREE.Color(p.atmosphereColor);
    
    ctx.fillStyle = p.baseColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (p.name === 'Earth' || p.type === 'Terrestrial') {
      ctx.fillStyle = '#0a214d';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const generateContinents = (color: string, iterations: number, sizeMult: number) => {
        ctx.fillStyle = color;
        for (let i = 0; i < iterations; i++) {
          ctx.beginPath();
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const rx = (100 + Math.random() * 300) * sizeMult;
          const ry = (50 + Math.random() * 150) * sizeMult;
          const rot = Math.random() * Math.PI;
          ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      generateContinents('#14532d', 60, 1.2);
      generateContinents('#166534', 40, 0.8);
      generateContinents('#3f6212', 30, 0.4);
      ctx.globalAlpha = 0.3;
      generateContinents('#d4d4d8', 20, 0.5);
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, 120);
      ctx.fillRect(0, canvas.height - 120, canvas.width, 120);
    } else if (p.name === 'Mercury' || p.type === 'Arid') {
      // High-Contrast Cratered Rocky Surface
      ctx.fillStyle = '#333333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dust & Regolith Noise
      for (let i = 0; i < 150000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const bri = 20 + Math.random() * 80;
        ctx.fillStyle = `rgb(${bri},${bri},${bri})`;
        ctx.fillRect(x, y, 1, 1);
      }

      // Draw Rays for large impacts
      const drawRays = (x: number, y: number, r: number) => {
        const count = 15 + Math.random() * 20;
        ctx.save();
        ctx.translate(x, y);
        for(let i=0; i<count; i++) {
          const angle = (i/count) * Math.PI * 2 + Math.random() * 0.2;
          const length = r * (2 + Math.random() * 4);
          const g = ctx.createLinearGradient(0,0, Math.cos(angle)*length, Math.sin(angle)*length);
          g.addColorStop(0, 'rgba(255,255,255,0.15)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.strokeStyle = g;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0,0);
          ctx.lineTo(Math.cos(angle)*length, Math.sin(angle)*length);
          ctx.stroke();
        }
        ctx.restore();
      };

      const drawCrater = (x: number, y: number, r: number, rays: boolean) => {
        if (rays) drawRays(x,y,r);
        // Main Pit
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fill();
        // Inner Edge Highlighting
        ctx.beginPath();
        ctx.arc(x - r*0.15, y - r*0.15, r * 0.9, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = r * 0.1;
        ctx.stroke();
        // Secondary outer highlight
        ctx.beginPath();
        ctx.arc(x + r*0.1, y + r*0.1, r * 1.05, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
      };

      // Distribution
      for (let i = 0; i < 3000; i++) drawCrater(Math.random()*canvas.width, Math.random()*canvas.height, 0.5 + Math.random()*3, false);
      for (let i = 0; i < 400; i++) drawCrater(Math.random()*canvas.width, Math.random()*canvas.height, 6 + Math.random()*18, false);
      for (let i = 0; i < 45; i++) drawCrater(Math.random()*canvas.width, Math.random()*canvas.height, 25 + Math.random()*70, Math.random() > 0.7);

    } else if (p.type === 'Gas Giant' || p.name === 'Jupiter' || p.name === 'Saturn') {
      for (let i = 0; i < 80; i++) {
        const y = (i / 80) * canvas.height;
        const h = canvas.height / 80;
        const mix = Math.random();
        const col = baseColor.clone().lerp(atmosphereColor, mix * 0.45);
        ctx.fillStyle = col.getStyle();
        ctx.fillRect(0, y, canvas.width, h);
      }
    } else {
      ctx.globalAlpha = 0.2;
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
      }
      ctx.globalAlpha = 1.0;
    }
    const texture = new THREE_NS.CanvasTexture(canvas);
    texture.anisotropy = 16;
    return texture;
  };

  const generateNightLightsTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * canvas.width;
      const y = (0.2 + Math.random() * 0.6) * canvas.height;
      const size = Math.random() * 1.5;
      const alpha = 0.3 + Math.random() * 0.7;
      ctx.fillStyle = `rgba(255, 230, 150, ${alpha})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE_NS.CanvasTexture(canvas);
  };

  const generateCloudTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 120; i++) {
      ctx.globalAlpha = 0.1 + Math.random() * 0.4;
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const w = 100 + Math.random() * 200;
      const h = 40 + Math.random() * 80;
      ctx.beginPath();
      ctx.ellipse(x, y, w, h, Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    return new THREE_NS.CanvasTexture(canvas);
  };

  const createBuildingModel = (type: BuildingType, visualRadius: number, isGhost = false) => {
    const group = new THREE_NS.Group();
    const s = visualRadius * 0.15; 
    const mat = new THREE_NS.MeshStandardMaterial({ 
      color: isGhost ? 0x00ffff : 0xdddddd, 
      transparent: true, 
      opacity: isGhost ? 0.4 : 1.0, 
      metalness: 1.0, 
      roughness: 0.1,
      emissive: isGhost ? 0x00ffff : 0x000000,
      emissiveIntensity: isGhost ? 0.6 : 0
    });
    const blueGlow = new THREE_NS.MeshStandardMaterial({
        color: 0x00f3ff,
        emissive: 0x00f3ff,
        emissiveIntensity: 3.0,
        transparent: true,
        opacity: isGhost ? 0.3 : 1.0
    });

    const isFlying = getAltitude(type, visualRadius) > 0;

    if (!isFlying) {
      const foundationGeo = new THREE_NS.CylinderGeometry(s * 0.45, s * 0.5, s * 0.1, 32);
      const foundation = new THREE_NS.Mesh(foundationGeo, mat);
      foundation.position.y = -s * 0.05;
      group.add(foundation);
    }

    switch(type) {
      case 'extractor': {
        const body = new THREE_NS.Mesh(new THREE_NS.CylinderGeometry(s*0.2, s*0.25, s*0.7, 8), mat);
        body.position.y = s * 0.35;
        group.add(body);
        const drillGrp = new THREE_NS.Group();
        const drill = new THREE_NS.Mesh(new THREE_NS.ConeGeometry(s*0.12, s*0.4, 8), mat);
        drill.rotation.x = Math.PI;
        drill.position.y = -s * 0.2;
        drillGrp.add(drill);
        drillGrp.userData = { anim: 'rotateY', speed: 0.25 };
        group.add(drillGrp);
        break;
      }
      case 'solar': {
        const pillar = new THREE_NS.Mesh(new THREE_NS.CylinderGeometry(s*0.05, s*0.08, s*0.5), mat);
        pillar.position.y = s * 0.25;
        group.add(pillar);
        const wing = new THREE_NS.Mesh(new THREE_NS.BoxGeometry(s*1.2, s*0.02, s*0.6), mat);
        wing.position.y = s * 0.5;
        wing.rotation.z = Math.PI / 8;
        group.add(wing);
        break;
      }
      case 'habitat': {
        const dome = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(s*0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2), mat);
        group.add(dome);
        const ring = new THREE_NS.Mesh(new THREE_NS.TorusGeometry(s*0.5, s*0.05, 12, 48), mat);
        ring.rotation.x = Math.PI/2;
        group.add(ring);
        break;
      }
      case 'drone': {
        const body = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(s*0.25, 16, 16), mat);
        const eye = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(s*0.08, 8, 8), blueGlow);
        eye.position.set(0, 0, s*0.2);
        body.add(eye);
        const rotor = new THREE_NS.Mesh(new THREE_NS.BoxGeometry(s*0.6, s*0.02, s*0.08), mat);
        rotor.position.y = s*0.25;
        rotor.userData = { anim: 'rotateY', speed: 0.4 };
        group.add(body, rotor);
        break;
      }
      case 'shuttle': {
        const hull = new THREE_NS.Mesh(new THREE_NS.CapsuleGeometry(s*0.3, s*0.8, 8, 16), mat);
        hull.rotation.x = Math.PI/2;
        const exhaust = new THREE_NS.Mesh(new THREE_NS.CylinderGeometry(s*0.2, s*0.1, s*0.2), blueGlow);
        exhaust.position.z = -s*0.6;
        exhaust.rotation.x = Math.PI/2;
        hull.add(exhaust);
        group.add(hull);
        break;
      }
      case 'satellite': {
        const core = new THREE_NS.Mesh(new THREE_NS.BoxGeometry(s*0.4, s*0.4, s*0.4), mat);
        const wingL = new THREE_NS.Mesh(new THREE_NS.BoxGeometry(s*1.5, s*0.4, s*0.02), mat);
        wingL.position.x = s*0.95;
        const wingR = wingL.clone();
        wingR.position.x = -s*0.95;
        const dish = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(s*0.3, 16, 16, 0, Math.PI*2, 0, Math.PI/2), mat);
        dish.position.y = s*0.3;
        group.add(core, wingL, wingR, dish);
        break;
      }
      case 'station_core': {
        const core = new THREE_NS.Mesh(new THREE_NS.CylinderGeometry(s*0.4, s*0.4, s*1.5, 8), mat);
        const orbitRing = new THREE_NS.Mesh(new THREE_NS.TorusGeometry(s*0.9, s*0.1, 12, 48), mat);
        orbitRing.rotation.x = Math.PI/2;
        orbitRing.userData = { anim: 'rotateZ', speed: 0.05 };
        group.add(core, orbitRing);
        break;
      }
      case 'flag': {
        const pole = new THREE_NS.Mesh(new THREE_NS.CylinderGeometry(s*0.02, s*0.02, s*1.0), mat);
        pole.position.y = s*0.5;
        const fabric = new THREE_NS.Mesh(new THREE_NS.PlaneGeometry(s*0.6, s*0.4), blueGlow);
        fabric.position.set(s*0.3, s*0.7, 0);
        fabric.rotation.y = Math.PI/2;
        group.add(pole, fabric);
        break;
      }
      case 'rover': {
        const body = new THREE_NS.Mesh(new THREE_NS.BoxGeometry(s*0.7, s*0.4, s*0.5), mat);
        body.position.y = s*0.3;
        for(let i=0; i<6; i++){
          const wheel = new THREE_NS.Mesh(new THREE_NS.CylinderGeometry(s*0.15, s*0.15, s*0.1, 12), mat);
          wheel.rotation.z = Math.PI/2;
          wheel.position.set(i < 3 ? s*0.3 : -s*0.3, s*0.15, (i % 3 - 1) * s*0.2);
          group.add(wheel);
        }
        group.add(body);
        break;
      }
      default: {
        const poly = new THREE_NS.Mesh(new THREE_NS.IcosahedronGeometry(s*0.4), mat);
        poly.position.y = s*0.4;
        group.add(poly);
      }
    }

    return group;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const scene = new THREE_NS.Scene();
    const camera = new THREE_NS.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 100, 100000000);
    const renderer = new THREE_NS.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE_NS.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    containerRef.current.appendChild(renderer.domElement);
    scene.add(new THREE_NS.AmbientLight(0xffffff, 0.45));
    const sunLight = new THREE_NS.PointLight(0xffffff, 8, 0, 1.2);
    scene.add(sunLight);

    const starCount = 8000;
    const starGeo = new THREE_NS.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for(let i=0; i<starCount; i++) {
      const r = 4000000 + Math.random() * 5500000;
      const t = Math.random() * Math.PI * 2;
      const p = Math.acos(2 * Math.random() - 1);
      starPos[i*3] = r * Math.sin(p) * Math.cos(t);
      starPos[i*3+1] = r * Math.sin(p) * Math.sin(t);
      starPos[i*3+2] = r * Math.cos(p);
    }
    starGeo.setAttribute('position', new THREE_NS.BufferAttribute(starPos, 3));
    scene.add(new THREE_NS.Points(starGeo, new THREE_NS.PointsMaterial({ size: 2500, color: 0xffffff, transparent: true, opacity: 0.85, sizeAttenuation: true })));

    const planets: any[] = [];
    const planetMeshes: THREE.Mesh[] = [];
    levels.forEach((lvl, idx) => {
      const pData = lvl.planet;
      const group = new THREE_NS.Group();
      scene.add(group);
      const orbitRadius = idx === 0 ? 0 : 130000 + (idx - 1) * 140000;
      const orbitSpeed = idx === 0 ? 0 : 0.0007 / Math.sqrt(idx + 1);
      const orbitOffset = Math.random() * Math.PI * 2;
      const visualRadius = idx === 0 ? SUN_RAD : pData.radius * 14;
      let mesh: THREE.Mesh;
      if (idx === 0) {
        const sunTex = generateSunTexture();
        mesh = new THREE_NS.Mesh(
          new THREE_NS.SphereGeometry(SUN_RAD, 128, 128), 
          new THREE_NS.MeshStandardMaterial({ 
            map: sunTex,
            emissive: 0xffaa00,
            emissiveMap: sunTex,
            emissiveIntensity: 3.5,
          })
        );
        
        const glow1 = new THREE_NS.Mesh(
          new THREE_NS.SphereGeometry(SUN_RAD * 1.15, 64, 64),
          new THREE_NS.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.4, side: THREE_NS.BackSide, blending: THREE_NS.AdditiveBlending })
        );
        const glow2 = new THREE_NS.Mesh(
          new THREE_NS.SphereGeometry(SUN_RAD * 1.4, 64, 64),
          new THREE_NS.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.15, side: THREE_NS.BackSide, blending: THREE_NS.AdditiveBlending })
        );
        const glow3 = new THREE_NS.Mesh(
          new THREE_NS.SphereGeometry(SUN_RAD * 2.0, 64, 64),
          new THREE_NS.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.05, side: THREE_NS.BackSide, blending: THREE_NS.AdditiveBlending })
        );
        group.add(glow1, glow2, glow3);
      } else {
        const isMercury = pData.name === 'Mercury';
        const segments = (pData.name === 'Earth' || pData.type === 'Terrestrial' || isMercury) ? 128 : 64;
        const mainMat = new THREE_NS.MeshStandardMaterial({ 
          map: generatePlanetTexture(pData), 
          roughness: isMercury ? 0.95 : 0.8, 
          metalness: 0.1,
          emissive: (pData.name === 'Earth' || pData.type === 'Terrestrial') ? 0xffffbb : 0x000000,
          emissiveMap: (pData.name === 'Earth' || pData.type === 'Terrestrial') ? generateNightLightsTexture() : null,
          emissiveIntensity: 0.2
        });
        mesh = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(visualRadius, segments, segments), mainMat);
        if (pData.name === 'Earth' || pData.type === 'Terrestrial') {
          const cloudMesh = new THREE_NS.Mesh(new THREE_NS.SphereGeometry(visualRadius * 1.015, segments, segments), new THREE_NS.MeshStandardMaterial({ map: generateCloudTexture(), transparent: true, opacity: 0.8, depthWrite: false, roughness: 1 }));
          cloudMesh.userData = { isClouds: true, rotSpeed: 0.0002 };
          group.add(cloudMesh);
        }

        const atmosphere = new THREE_NS.Mesh(
          new THREE_NS.SphereGeometry(visualRadius * 1.06, segments, segments), 
          new THREE_NS.MeshBasicMaterial({ 
            color: pData.atmosphereColor, 
            transparent: true, 
            opacity: isMercury ? 0.03 : 0.25, 
            side: THREE_NS.BackSide, 
            blending: THREE_NS.AdditiveBlending 
          })
        );
        group.add(atmosphere);
      }
      mesh.userData = { planetIndex: idx, visualRadius };
      group.add(mesh);
      planetMeshes.push(mesh);
      planets.push({ group, mesh, orbitRadius, orbitSpeed, orbitOffset, visualRadius });
    });

    const ringHUD = new THREE_NS.Mesh(new THREE_NS.RingGeometry(1, 1.15, 64), new THREE_NS.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.5, side: THREE_NS.DoubleSide }));
    ringHUD.visible = false;
    scene.add(ringHUD);
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    planetsRef.current = planets;
    planetMeshesRef.current = planetMeshes;
    placementRingRef.current = ringHUD;

    const raycaster = new THREE_NS.Raycaster();
    const mouse = new THREE_NS.Vector2();

    const onPointer = (e: MouseEvent, isClick: boolean) => {
      if (!containerRef.current) return;
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const activeIdx = stateRef.current.activeIndex;
      const target = planetMeshes[activeIdx];
      if (target) {
        const intersects = raycaster.intersectObject(target);
        if (intersects.length > 0) {
          const intersection = intersects[0];
          const local = target.worldToLocal(intersection.point.clone()).normalize();
          if (isClick) {
            onPlanetClick([local.x, local.y, local.z]);
          } else if (stateRef.current.selectedBuildingType && ghostGroupRef.current) {
            ghostGroupRef.current.visible = true;
            placementRingRef.current!.visible = true;
            
            const radius = target.userData.visualRadius;
            const altitude = getAltitude(stateRef.current.selectedBuildingType, radius);
            const finalPos = intersection.point.clone().add(intersection.normal!.clone().multiplyScalar(altitude));
            
            ghostGroupRef.current.position.copy(finalPos);
            ghostGroupRef.current.quaternion.setFromUnitVectors(new THREE_NS.Vector3(0, 1, 0), intersection.normal!);
            
            placementRingRef.current!.position.copy(intersection.point.clone().add(intersection.normal!.clone().multiplyScalar(5)));
            placementRingRef.current!.quaternion.copy(ghostGroupRef.current.quaternion);
            placementRingRef.current!.rotateX(Math.PI/2);
          }
        } else if (!isClick && ghostGroupRef.current) {
          ghostGroupRef.current.visible = false;
          placementRingRef.current!.visible = false;
        }
      }
    };

    window.addEventListener('mousemove', (e) => onPointer(e, false));
    containerRef.current.addEventListener('mousedown', (e) => onPointer(e, true));

    let frameId: number;
    const animate = () => {
      cinematicTime.current += 0.015;
      const { activeIndex, hyperdrive, viewMode } = stateRef.current;
      planets.forEach((p, idx) => {
        if (idx !== 0) {
          const angle = cinematicTime.current * p.orbitSpeed + p.orbitOffset;
          p.group.position.set(Math.cos(angle) * p.orbitRadius, 0, Math.sin(angle) * p.orbitRadius);
        }
        p.mesh.rotation.y += levels[idx].planet.rotationSpeed;
        p.group.children.forEach(c => {
          if (c.userData.isClouds) c.rotation.y += c.userData.rotSpeed || 0.0002;
        });
        p.mesh.children.forEach(c => {
          if (c.userData.isBuilding && c.scale.x < 1) {
            c.scale.addScalar(0.05);
            if (c.scale.x > 1) c.scale.set(1, 1, 1);
          }
          c.children.forEach(sub => {
              if (sub.userData.anim === 'rotateY') sub.rotation.y += sub.userData.speed || 0.01;
              if (sub.userData.anim === 'rotateZ') sub.rotation.z += sub.userData.speed || 0.01;
          });
        });
      });
      const activePlanet = planets[activeIndex];
      if (hyperdrive) {
        camera.position.lerp(new THREE_NS.Vector3(0, 200000, 400000), 0.03);
        camera.lookAt(0, 0, 0);
      } else if (viewMode === 'focus' && activePlanet) {
        const camDist = activePlanet.visualRadius * 4.8;
        const offset = new THREE_NS.Vector3(camDist * 0.5, activePlanet.visualRadius * 0.4, camDist);
        const targetPos = activePlanet.group.position.clone().add(offset);
        camera.position.lerp(targetPos, 0.07);
        camera.lookAt(activePlanet.group.position);
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', (e) => onPointer(e, false));
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current || !planetsRef.current.length) return;
    if (ghostGroupRef.current) { sceneRef.current.remove(ghostGroupRef.current); ghostGroupRef.current = null; }
    if (selectedBuildingType) {
      const activePlanet = planetsRef.current[activeIndex];
      const ghost = createBuildingModel(selectedBuildingType, activePlanet.visualRadius, true);
      ghostGroupRef.current = ghost;
      sceneRef.current.add(ghost);
      const s = activePlanet.visualRadius * 0.1;
      placementRingRef.current!.geometry.dispose();
      placementRingRef.current!.geometry = new THREE_NS.RingGeometry(s*0.9, s*1.1, 64);
    }
    planetsRef.current.forEach((p, idx) => {
      const existingIds = new Set(p.mesh.children.filter(c => c.userData.isBuilding).map(c => c.userData.buildingId));
      buildings.filter(b => b.planetIndex === idx).forEach(b => {
        if (!existingIds.has(b.id)) {
          const building = createBuildingModel(b.type, p.visualRadius, false);
          building.userData = { isBuilding: true, buildingId: b.id };
          building.scale.set(0, 0, 0);
          
          const normal = new THREE_NS.Vector3(...b.position).normalize();
          const radius = p.visualRadius;
          const altitude = getAltitude(b.type, radius);
          const finalPos = normal.clone().multiplyScalar(radius + altitude);
          
          building.position.copy(finalPos);
          building.quaternion.setFromUnitVectors(new THREE_NS.Vector3(0, 1, 0), normal);
          p.mesh.add(building);
        }
      });
    });
  }, [buildings, selectedBuildingType, activeIndex]);

  return <div ref={containerRef} className="fixed inset-0 w-full h-full z-0 overflow-hidden" />;
};

export default SimulationCanvas;
