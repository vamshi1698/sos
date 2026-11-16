import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SECTIONS_CONFIG } from './sceneConfig';

interface ThreeAmbulanceSceneProps {
  currentSection: number;
  strobesEnabled: boolean;
  beamEnabled: boolean;
  onAmbulanceScreenPos?: (x: number, y: number, visible: boolean) => void;
}

export default function ThreeAmbulanceScene({
  currentSection,
  strobesEnabled,
  beamEnabled,
  onAmbulanceScreenPos,
}: ThreeAmbulanceSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef({
    currentSection,
    strobesEnabled,
    beamEnabled,
    onAmbulanceScreenPos,
  });

  // Keep stateRef up to date
  useEffect(() => {
    stateRef.current = {
      currentSection,
      strobesEnabled,
      beamEnabled,
      onAmbulanceScreenPos,
    };
  }, [currentSection, strobesEnabled, beamEnabled, onAmbulanceScreenPos]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. Scene, Camera, Renderer ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.038);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    const initialConfig = SECTIONS_CONFIG[0];
    camera.position.set(...initialConfig.camPos);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- 2. Lighting ---
    const ambientLight = new THREE.AmbientLight(0x22304d, 1.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x88aaff, 1.6);
    moonLight.position.set(12, 20, 10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 1024;
    moonLight.shadow.mapSize.height = 1024;
    moonLight.shadow.camera.near = 1;
    moonLight.shadow.camera.far = 40;
    moonLight.shadow.camera.left = -10;
    moonLight.shadow.camera.right = 10;
    moonLight.shadow.camera.top = 10;
    moonLight.shadow.camera.bottom = -10;
    moonLight.shadow.bias = -0.001;
    scene.add(moonLight);

    // Soft fill light from front-left
    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.6);
    fillLight.position.set(-10, 6, 8);
    scene.add(fillLight);

    // --- 3. Ground & Distinct Road System for Every Section ---
    const groundGroup = new THREE.Group();
    scene.add(groundGroup);

    // Common Base Asphalt Ground
    const asphaltMat = new THREE.MeshStandardMaterial({
      color: 0x121722,
      roughness: 0.85,
      metalness: 0.15,
    });
    const groundGeo = new THREE.PlaneGeometry(90, 90);
    const baseGround = new THREE.Mesh(groundGeo, asphaltMat);
    baseGround.rotation.x = -Math.PI / 2;
    baseGround.receiveShadow = true;
    groundGroup.add(baseGround);

    // Common Curbs & Sidewalks with textured concrete borders
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x1f293d, roughness: 0.8 });
    const curbEdgeMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });

    const sidewalkLeft = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 90), curbMat);
    sidewalkLeft.position.set(-11, 0.1, 0);
    sidewalkLeft.receiveShadow = true;
    groundGroup.add(sidewalkLeft);

    const curbLeftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 90), curbEdgeMat);
    curbLeftEdge.position.set(-3.95, 0.12, 0);
    groundGroup.add(curbLeftEdge);

    const sidewalkRight = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 90), curbMat);
    sidewalkRight.position.set(11, 0.1, 0);
    sidewalkRight.receiveShadow = true;
    groundGroup.add(sidewalkRight);

    const curbRightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.24, 90), curbEdgeMat);
    curbRightEdge.position.set(3.95, 0.12, 0);
    groundGroup.add(curbRightEdge);

    // =========================================================================
    // ROAD 1: STANDBY BASE STATION / HOSPITAL DEPOT PARKING BAY
    // =========================================================================
    const roadGroup1 = new THREE.Group();
    groundGroup.add(roadGroup1);

    const stallMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    const stallWhiteMat = new THREE.MeshBasicMaterial({ color: 0xdde4ed });

    // Parking slot boundary lines
    const pLineL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.6), stallMat);
    pLineL.rotation.x = -Math.PI / 2;
    pLineL.position.set(0.8, 0.015, 0.2);
    roadGroup1.add(pLineL);

    const pLineR = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 5.6), stallMat);
    pLineR.rotation.x = -Math.PI / 2;
    pLineR.position.set(3.4, 0.015, 0.2);
    roadGroup1.add(pLineR);

    const pLineBack = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 0.2), stallMat);
    pLineBack.rotation.x = -Math.PI / 2;
    pLineBack.position.set(2.1, 0.015, -2.6);
    roadGroup1.add(pLineBack);

    // Wheel stop curb behind rear wheels
    const wheelStop = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.16, 0.28),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 })
    );
    wheelStop.position.set(2.1, 0.08, -2.2);
    roadGroup1.add(wheelStop);

    // Painted floor stencil: "STANDBY • UNIT 07"
    function createDepotStencilTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 128;
      const c = cvs.getContext('2d')!;
      c.fillStyle = '#121722';
      c.fillRect(0, 0, 512, 128);
      c.font = 'bold 44px "Rubik", "Arial Black", sans-serif';
      c.fillStyle = '#facc15';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('STANDBY • BAY 07', 256, 64);
      return new THREE.CanvasTexture(cvs);
    }
    const depotStencil = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 0.6),
      new THREE.MeshBasicMaterial({ map: createDepotStencilTexture(), transparent: true, opacity: 0.85 })
    );
    depotStencil.rotation.x = -Math.PI / 2;
    depotStencil.position.set(2.1, 0.016, 1.8);
    roadGroup1.add(depotStencil);

    // White perimeter guideline
    const depotGuideline = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 40), stallWhiteMat);
    depotGuideline.rotation.x = -Math.PI / 2;
    depotGuideline.position.set(-1.2, 0.014, 0);
    roadGroup1.add(depotGuideline);

    // =========================================================================
    // ROAD 2: CITY BOULEVARD ("DISPATCH WAY")
    // =========================================================================
    const roadGroup2 = new THREE.Group();
    groundGroup.add(roadGroup2);

    const roadLines2: THREE.Mesh[] = [];
    const dashedLineMat = new THREE.MeshBasicMaterial({ color: 0xdde4ed });

    for (let z = -40; z <= 40; z += 3.5) {
      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.8), dashedLineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(0, 0.015, z);
      roadGroup2.add(lineMesh);
      roadLines2.push(lineMesh);
    }

    // Solid shoulder lines along both curbs
    const shoulderLineL = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 80), dashedLineMat);
    shoulderLineL.rotation.x = -Math.PI / 2;
    shoulderLineL.position.set(-3.7, 0.015, 0);
    roadGroup2.add(shoulderLineL);

    const shoulderLineR = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 80), dashedLineMat);
    shoulderLineR.rotation.x = -Math.PI / 2;
    shoulderLineR.position.set(3.7, 0.015, 0);
    roadGroup2.add(shoulderLineR);

    // Asphalt drain grates
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.5 });
    for (const gz of [-18, 0, 18]) {
      const grate = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.9), grateMat);
      grate.rotation.x = -Math.PI / 2;
      grate.position.set(-3.5, 0.016, gz);
      roadGroup2.add(grate);
    }

    // =========================================================================
    // ROAD 3: URBAN TRANSIT CORRIDOR (CLEAN STRAIGHT HIGHWAY BOULEVARD)
    // =========================================================================
    const roadGroup3 = new THREE.Group();
    groundGroup.add(roadGroup3);

    // Road 3 Center dashed lines running full length from -40 to +40
    const roadLines3: THREE.Mesh[] = [];
    for (let z = -40; z <= 40; z += 3.5) {
      const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1.8), dashedLineMat);
      lineMesh.rotation.x = -Math.PI / 2;
      lineMesh.position.set(0, 0.015, z);
      roadGroup3.add(lineMesh);
      roadLines3.push(lineMesh);
    }

    // =========================================================================
    // ROAD 4: 4-LANE HIGH-SPEED EXPRESSWAY / HIGHWAY
    // =========================================================================
    const roadGroup4 = new THREE.Group();
    groundGroup.add(roadGroup4);

    // Steel Armco Guardrails along outer shoulders
    const guardrailMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.25 });
    for (const gx of [-4.2, 4.2]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 90), guardrailMat);
      rail.position.set(gx, 0.45, 0);
      rail.castShadow = true;
      roadGroup4.add(rail);

      for (let z = -40; z <= 40; z += 4.0) {
        // Keep foreground near camera clear of any guardrail post
        if (gx > 0 && z >= 4 && z <= 8) continue;
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), guardrailMat);
        post.position.set(gx, 0.25, z);
        roadGroup4.add(post);
      }
    }

    // 3 Rows of High-Speed White Dashed Lane Dividers (4 Lanes total!)
    const roadLines4: THREE.Mesh[] = [];
    const highwayLaneOffsets = [-2.0, 0.0, 2.0];

    highwayLaneOffsets.forEach((lx) => {
      for (let z = -40; z <= 40; z += 4.5) {
        const lineMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 2.8), dashedLineMat);
        lineMesh.rotation.x = -Math.PI / 2;
        lineMesh.position.set(lx, 0.015, z);
        roadGroup4.add(lineMesh);
        roadLines4.push(lineMesh);
      }
    });

    // Solid yellow express shoulder lines
    const expressShoulderL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 90), stallMat);
    expressShoulderL.rotation.x = -Math.PI / 2;
    expressShoulderL.position.set(-3.8, 0.016, 0);
    roadGroup4.add(expressShoulderL);

    const expressShoulderR = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 90), stallMat);
    expressShoulderR.rotation.x = -Math.PI / 2;
    expressShoulderR.position.set(3.8, 0.016, 0);
    roadGroup4.add(expressShoulderR);

    // Speed streak lines embedded in highway asphalt
    for (let s = -1; s <= 1; s += 2) {
      const streakMat = new THREE.MeshBasicMaterial({
        color: s === 1 ? 0xff2222 : 0x0088ff,
        transparent: true,
        opacity: 0.6,
      });
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 18), streakMat);
      streak.rotation.x = -Math.PI / 2;
      streak.position.set(s * 1.1 + 0.4, 0.018, -4.0);
      roadGroup4.add(streak);
    }

    // =========================================================================
    // ROAD 5: HOSPITAL EMERGENCY DROP-OFF BAY (Environment managed by hospitalSceneGroup)
    // =========================================================================
    const roadGroup5 = new THREE.Group();
    groundGroup.add(roadGroup5);

    // --- 4. Low-Poly Trees along Both Sidewalks ---
    function createLowPolyTree(scale = 1): THREE.Group {
      const tree = new THREE.Group();
      // Concrete planter box
      const planter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75 * scale, 0.85 * scale, 0.25 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x242e42, roughness: 0.8 })
      );
      planter.position.y = 0.12 * scale;
      tree.add(planter);

      // Soil inside planter
      const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.68 * scale, 0.68 * scale, 0.1 * scale, 8),
        new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.95 })
      );
      soil.position.y = 0.22 * scale;
      tree.add(soil);

      // Trunk
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12 * scale, 0.18 * scale, 1.8 * scale, 6),
        new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 0.9 })
      );
      trunk.position.y = 1.0 * scale;
      trunk.castShadow = true;
      tree.add(trunk);

      // Tiered faceted foliage clusters
      const foliageMatDark = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.85, flatShading: true });
      const foliageMatMid = new THREE.MeshStandardMaterial({ color: 0x2d6a4f, roughness: 0.85, flatShading: true });
      const foliageMatLight = new THREE.MeshStandardMaterial({ color: 0x40916c, roughness: 0.85, flatShading: true });

      const leafBase = new THREE.Mesh(new THREE.DodecahedronGeometry(1.05 * scale, 1), foliageMatDark);
      leafBase.position.y = 2.1 * scale;
      leafBase.castShadow = true;
      tree.add(leafBase);

      const leafMid = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85 * scale, 1), foliageMatMid);
      leafMid.position.set(0.1 * scale, 2.9 * scale, -0.05 * scale);
      leafMid.castShadow = true;
      tree.add(leafMid);

      const leafTop = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 * scale, 1), foliageMatLight);
      leafTop.position.set(-0.05 * scale, 3.6 * scale, 0.08 * scale);
      leafTop.castShadow = true;
      tree.add(leafTop);

      return tree;
    }

    const treeMeshes: THREE.Group[] = [];
    // Background avenue trees along the far sidewalk (never obstructs foreground ambulance camera)
    const treePositions = [
      { x: -5.8, z: -36, s: 1.1 },
      { x: -6.2, z: -26, s: 0.95 },
      { x: -5.8, z: -16, s: 1.05 },
      { x: -6.2, z: -6, s: 1.15 },
      { x: -5.8, z: 4, s: 1.0 },
      { x: -6.2, z: 14, s: 1.15 },
      { x: -5.8, z: 24, s: 1.05 },
      { x: -6.2, z: 34, s: 1.1 },
      { x: -5.8, z: 44, s: 0.95 },
    ];
    const treesGroup = new THREE.Group();
    groundGroup.add(treesGroup);

    treePositions.forEach((tp) => {
      const tree = createLowPolyTree(tp.s);
      tree.position.set(tp.x, 0.2, tp.z);
      treesGroup.add(tree);
      treeMeshes.push(tree);
    });

    // --- 5. Arched Overhead Street Lamps with Downward Spotlights ---
    function createArchedStreetLamp(isLeft: boolean): THREE.Group {
      const lamp = new THREE.Group();
      const metalMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

      // Base plate
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.2, 8), metalMat);
      base.position.y = 0.1;
      lamp.add(base);

      // Vertical pole
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 4.8, 8), metalMat);
      mast.position.y = 2.5;
      lamp.add(mast);

      // Curved cantilever arm
      const armGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.8, 8);
      armGeo.rotateZ(isLeft ? -Math.PI / 3.4 : Math.PI / 3.4);
      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.position.set(isLeft ? 0.75 : -0.75, 5.2, 0);
      lamp.add(arm);

      // Lamp fixture housing
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.14, 0.28), metalMat);
      head.position.set(isLeft ? 1.5 : -1.5, 5.6, 0);
      lamp.add(head);

      // Glowing lens
      const bulb = new THREE.Mesh(
        new THREE.PlaneGeometry(0.38, 0.22),
        new THREE.MeshBasicMaterial({ color: 0xffedd5 })
      );
      bulb.rotation.x = Math.PI / 2;
      bulb.position.set(isLeft ? 1.5 : -1.5, 5.52, 0);
      lamp.add(bulb);

      // Downward conical street spotlight
      const spot = new THREE.SpotLight(0xffe4b5, 2.2, 13, Math.PI / 4.5, 0.55, 1.2);
      spot.position.set(isLeft ? 1.5 : -1.5, 5.5, 0);
      spot.target.position.set(isLeft ? 1.5 : -1.5, 0, 0);
      lamp.add(spot);
      lamp.add(spot.target);

      return lamp;
    }

    const lampMeshes: THREE.Group[] = [];
    const lampPositions = [
      { isLeft: true, z: -28 },
      { isLeft: true, z: -12 },
      { isLeft: true, z: 4 },
      { isLeft: true, z: 20 },
      { isLeft: true, z: 36 },
      { isLeft: false, z: -24 },
      { isLeft: false, z: -8 },
      { isLeft: false, z: 18 },
      { isLeft: false, z: 34 },
    ];
    lampPositions.forEach((lp) => {
      const lamp = createArchedStreetLamp(lp.isLeft);
      lamp.position.set(lp.isLeft ? -4.6 : 4.6, 0.2, lp.z);
      groundGroup.add(lamp);
      lampMeshes.push(lamp);
    });

    // --- 6. Sidewalk Street Props (Fire Hydrants, Utility Cabinets) ---

    // Fire Hydrant (belong to Road 2 city boulevard)
    function createFireHydrant(): THREE.Group {
      const hydrant = new THREE.Group();
      const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.65, 8), redMat);
      body.position.y = 0.325;
      hydrant.add(body);

      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8), redMat);
      cap.position.y = 0.65;
      hydrant.add(cap);

      const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 6), redMat);
      valve.rotation.z = Math.PI / 2;
      valve.position.y = 0.45;
      hydrant.add(valve);

      return hydrant;
    }

    const hydrant1 = createFireHydrant();
    hydrant1.position.set(-4.5, 0.2, -6);
    roadGroup2.add(hydrant1);

    const hydrant2 = createFireHydrant();
    hydrant2.position.set(4.5, 0.2, 10);
    roadGroup2.add(hydrant2);

    // Electrical utility box (belong to Road 2 city boulevard)
    const utilBoxMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.4, roughness: 0.6 });
    const utilBox = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.5), utilBoxMat);
    utilBox.position.set(-4.7, 0.65, 8);
    roadGroup2.add(utilBox);

    // --- 7. Multi-Layered City Skyline & Detailed Architecture ---
    const buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);

    // Arrays to collect rooftop aviation beacon lights for blinking animation
    const beaconMeshes: THREE.Mesh[] = [];
    const beaconLights: THREE.PointLight[] = [];

    // Window canvas texture generator for illuminated city skyline
    function createBuildingWindowTexture(seed = 0): THREE.CanvasTexture {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#111827';
      ctx.fillRect(0, 0, 128, 256);

      const rows = 16;
      const cols = 6;
      for (let r = 1; r < rows; r++) {
        for (let c = 1; c < cols; c++) {
          const rand = Math.sin(r * 14.1 + c * 38.7 + seed) * 10000;
          const isLit = rand - Math.floor(rand) > 0.38;
          if (isLit) {
            const isWarm = rand - Math.floor(rand) > 0.72;
            ctx.fillStyle = isWarm ? '#fde047' : '#93c5fd';
            ctx.shadowColor = isWarm ? 'rgba(253, 224, 71, 0.9)' : 'rgba(147, 197, 253, 0.9)';
            ctx.shadowBlur = 5;
            ctx.fillRect(c * 20 - 4, r * 15 - 3, 10, 8);
          }
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    }

    interface BuildingConfig {
      x: number;
      z: number;
      w: number;
      h: number;
      d: number;
      seed: number;
      color?: number;
      hasWaterTower?: boolean;
      hasHVAC?: boolean;
      hasAntenna?: boolean;
    }

    const streetBuildingConfigs: BuildingConfig[] = [
      // Left Avenue Street-Facing Buildings (x ~ -15)
      { x: -15, z: -35, w: 9, h: 26, d: 9, seed: 17, color: 0x141d2d, hasHVAC: true },
      { x: -14, z: -22, w: 9, h: 22, d: 8, seed: 1, color: 0x131a29, hasHVAC: true },
      { x: -15, z: -10, w: 8, h: 28, d: 9, seed: 2, color: 0x162032, hasWaterTower: true },
      { x: -14, z: 2, w: 9, h: 18, d: 9, seed: 3, color: 0x111827, hasHVAC: true },
      { x: -15, z: 14, w: 8, h: 26, d: 8, seed: 4, color: 0x141e2e, hasAntenna: true },
      { x: -14, z: 26, w: 9, h: 20, d: 9, seed: 5, color: 0x162338, hasWaterTower: true },
      { x: -15, z: 38, w: 8, h: 24, d: 8, seed: 18, color: 0x131a28, hasHVAC: true },

      // Right Avenue Street-Facing Buildings (x ~ 15)
      { x: 15, z: -33, w: 8, h: 22, d: 8, seed: 19, color: 0x162032, hasHVAC: true },
      { x: 15, z: -20, w: 9, h: 24, d: 8, seed: 6, color: 0x141d2d, hasAntenna: true },
      { x: 16, z: -8, w: 8, h: 19, d: 9, seed: 7, color: 0x111927, hasHVAC: true },
      { x: 15, z: 5, w: 9, h: 27, d: 8, seed: 8, color: 0x172236, hasWaterTower: true },
      { x: 16, z: 18, w: 8, h: 23, d: 9, seed: 9, color: 0x131a28, hasHVAC: true },
      { x: 15, z: 30, w: 9, h: 26, d: 9, seed: 20, color: 0x152134, hasWaterTower: true },
      { x: 16, z: 42, w: 8, h: 21, d: 8, seed: 21, color: 0x111827, hasAntenna: true },
    ];

    const distantBuildingConfigs: BuildingConfig[] = [
      // Distant Background Skyscrapers & High-Rises
      { x: -25, z: -36, w: 12, h: 38, d: 10, seed: 10, color: 0x0f172a, hasAntenna: true },
      { x: -12, z: -38, w: 11, h: 44, d: 11, seed: 11, color: 0x111b2b, hasAntenna: true },
      { x: 1, z: -40, w: 13, h: 48, d: 12, seed: 12, color: 0x0d1524, hasWaterTower: true, hasAntenna: true },
      { x: 14, z: -37, w: 11, h: 40, d: 10, seed: 13, color: 0x101a2c, hasAntenna: true },
      { x: 26, z: -34, w: 12, h: 36, d: 10, seed: 14, color: 0x0f1626, hasHVAC: true },
      { x: -6, z: -32, w: 9, h: 32, d: 8, seed: 15, color: 0x131c2e, hasHVAC: true },
      { x: 8, z: -31, w: 9, h: 34, d: 8, seed: 16, color: 0x141e30, hasWaterTower: true },
    ];

    function createBuildingItem(cfg: BuildingConfig): THREE.Group {
      const bGroup = new THREE.Group();
      bGroup.position.set(cfg.x, 0, cfg.z);

      // Main structural block
      const geo = new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d);
      const winTex = createBuildingWindowTexture(cfg.seed);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color || 0x131a29,
        roughness: 0.8,
        map: winTex,
        emissive: 0xffffff,
        emissiveMap: winTex,
        emissiveIntensity: 0.38,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = cfg.h / 2;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bGroup.add(mesh);

      // Rooftop parapet rim ledge
      const rimMat = new THREE.MeshStandardMaterial({ color: 0x273549, roughness: 0.7 });
      const rim = new THREE.Mesh(new THREE.BoxGeometry(cfg.w + 0.3, 0.4, cfg.d + 0.3), rimMat);
      rim.position.y = cfg.h + 0.2;
      bGroup.add(rim);

      // Rooftop Detail 1: Water Tower
      if (cfg.hasWaterTower) {
        const wtGroup = new THREE.Group();
        wtGroup.position.set(cfg.w * 0.2, cfg.h + 0.4, -cfg.d * 0.15);

        // 4 Stilt Legs
        const legMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        for (const lx of [-0.4, 0.4]) {
          for (const lz of [-0.4, 0.4]) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 6), legMat);
            leg.position.set(lx, 0.5, lz);
            wtGroup.add(leg);
          }
        }

        // Barrel Tank
        const tankMat = new THREE.MeshStandardMaterial({ color: 0x4a3b32, roughness: 0.85 });
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.1, 10), tankMat);
        tank.position.y = 1.55;
        wtGroup.add(tank);

        // Conical Roof
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(0.72, 0.5, 10),
          new THREE.MeshStandardMaterial({ color: 0x2d241e, roughness: 0.8 })
        );
        cone.position.y = 2.35;
        wtGroup.add(cone);

        bGroup.add(wtGroup);
      }

      // Rooftop Detail 2: HVAC Chillers / AC Units
      if (cfg.hasHVAC) {
        const hvacMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.6, roughness: 0.4 });
        const fanMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

        const hvac = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 1.2), hvacMat);
        hvac.position.set(-cfg.w * 0.2, cfg.h + 0.6, cfg.d * 0.15);
        bGroup.add(hvac);

        // Circular fan vents
        for (const fx of [-0.4, 0.4]) {
          const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.04, 8), fanMat);
          fan.position.set(-cfg.w * 0.2 + fx, cfg.h + 1.02, cfg.d * 0.15);
          bGroup.add(fan);
        }
      }

      // Rooftop Detail 3: Telecommunications Radio Mast with Blinking Beacon
      if (cfg.hasAntenna) {
        const antennaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.12, 4.5, 6), antennaMat);
        spire.position.set(0, cfg.h + 2.25, 0);
        bGroup.add(spire);

        // Red aviation beacon light at tip
        const beaconGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
        const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
        beaconMesh.position.set(0, cfg.h + 4.55, 0);
        bGroup.add(beaconMesh);
        beaconMeshes.push(beaconMesh);

        const beaconLight = new THREE.PointLight(0xff2222, 2.5, 8, 2);
        beaconLight.position.set(0, cfg.h + 4.6, 0);
        bGroup.add(beaconLight);
        beaconLights.push(beaconLight);
      }

      return bGroup;
    }

    const streetBuildingMeshes: THREE.Group[] = [];
    streetBuildingConfigs.forEach((cfg) => {
      const b = createBuildingItem(cfg);
      buildingsGroup.add(b);
      streetBuildingMeshes.push(b);
    });

    const distantBuildingMeshes: THREE.Group[] = [];
    distantBuildingConfigs.forEach((cfg) => {
      const b = createBuildingItem(cfg);
      buildingsGroup.add(b);
      distantBuildingMeshes.push(b);
    });

    // Atmospheric Night Dust / Distant Starfield in Sky
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 180;
    const starCoords = new Float32Array(starCount * 3);
    for (let s = 0; s < starCount; s++) {
      starCoords[s * 3] = (Math.random() - 0.5) * 80;
      starCoords[s * 3 + 1] = 16 + Math.random() * 25;
      starCoords[s * 3 + 2] = -15 - Math.random() * 45;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xc7d2fe,
      size: 0.35,
      transparent: true,
      opacity: 0.7,
    });
    const starField = new THREE.Points(starsGeo, starMat);
    scene.add(starField);

    // --- 8. Low-Poly 3D Ambulance Model ---
    const ambulanceGroup = new THREE.Group();
    scene.add(ambulanceGroup);

    // Materials
    const bodyWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.45,
      metalness: 0.1,
    });
    const stripeRedMat = new THREE.MeshStandardMaterial({
      color: 0xe52421,
      roughness: 0.4,
      metalness: 0.1,
    });
    const bumperBlackMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2,
    });
    const windowGlassMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.9,
    });
    const wheelRubberMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.9,
    });
    const rimSilverMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.85,
      roughness: 0.25,
    });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 2.2,
    });
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff1111,
      emissiveIntensity: 2.0,
    });
    const strobeRedMat = new THREE.MeshStandardMaterial({
      color: 0xff1111,
      emissive: 0xff1111,
      emissiveIntensity: 3.5,
    });
    const strobeBlueMat = new THREE.MeshStandardMaterial({
      color: 0x0088ff,
      emissive: 0x0088ff,
      emissiveIntensity: 3.5,
    });

    // 1. Lower Chassis
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 4.8), bumperBlackMat);
    chassis.position.y = 0.45;
    chassis.castShadow = true;
    ambulanceGroup.add(chassis);

    // 2. Main Box Body (Patient Compartment)
    const rearBox = new THREE.Mesh(new THREE.BoxGeometry(2.1, 1.7, 3.1), bodyWhiteMat);
    rearBox.position.set(0, 1.45, -0.65);
    rearBox.castShadow = true;
    rearBox.receiveShadow = true;
    ambulanceGroup.add(rearBox);

    // Red horizontal stripe on rear box
    const stripeSide = new THREE.Mesh(new THREE.BoxGeometry(2.14, 0.28, 3.12), stripeRedMat);
    stripeSide.position.set(0, 1.25, -0.65);
    ambulanceGroup.add(stripeSide);

    // 3. Cabin (Front)
    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.35, 1.6), bodyWhiteMat);
    cab.position.set(0, 1.2, 1.4);
    cab.castShadow = true;
    cab.receiveShadow = true;
    ambulanceGroup.add(cab);

    // Hood / Front Nose
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.96, 0.75, 0.7), bodyWhiteMat);
    nose.position.set(0, 0.85, 2.3);
    nose.castShadow = true;
    ambulanceGroup.add(nose);

    // Front Windshield (Slanted appearance)
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.65, 0.1), windowGlassMat);
    windshield.position.set(0, 1.48, 2.18);
    windshield.rotation.x = -Math.PI * 0.12;
    ambulanceGroup.add(windshield);

    // Side Windows on Cab
    const cabWindowLeft = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.8), windowGlassMat);
    cabWindowLeft.position.set(-1.01, 1.45, 1.4);
    ambulanceGroup.add(cabWindowLeft);

    const cabWindowRight = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.8), windowGlassMat);
    cabWindowRight.position.set(1.01, 1.45, 1.4);
    ambulanceGroup.add(cabWindowRight);

    // Bold "AMBULANCE" Red Lettering Canvas Decals on Hood
    function createDecalTexture(text: string, textColor = '#e52421', bgColor = '#f8fafc'): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 128;
      const c = cvs.getContext('2d')!;
      c.fillStyle = bgColor;
      c.fillRect(0, 0, 512, 128);

      c.font = 'bold 54px "Rubik", "Arial Black", sans-serif';
      c.fillStyle = textColor;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, 256, 64);

      const tex = new THREE.CanvasTexture(cvs);
      return tex;
    }

    // Unified "EMERGENCY" Decal with Blue Star of Life Emblem on Side Walls
    // Reference: media_1794819686574_69836512.jpg - Clean, centered, flush decal with blue Star of Life on left & bold red EMERGENCY on right
    function createSideEmergencyDecal(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 1024;
      cvs.height = 256;
      const c = cvs.getContext('2d')!;

      // Crisp clean white decal plate matching ambulance white paint
      c.fillStyle = '#f8fafc';
      c.fillRect(0, 0, 1024, 256);

      // Blue 6-pointed Star of Life emblem on left
      c.fillStyle = '#1d4ed8';
      const cx = 130, cy = 128, r = 70, w = 26;
      for (let a = 0; a < 3; a++) {
        const rad = (a * Math.PI) / 3;
        c.save();
        c.translate(cx, cy);
        c.rotate(rad);
        c.fillRect(-w / 2, -r, w, r * 2);
        c.restore();
      }

      // White rod / serpent motif inside Star of Life
      c.fillStyle = '#ffffff';
      c.fillRect(cx - 5, cy - 46, 10, 92);

      // Bold Red "EMERGENCY" lettering cleanly spaced and proportioned
      c.font = 'bold 94px "Rubik", "Arial Black", "Montserrat", sans-serif';
      c.fillStyle = '#dc2626';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText('EMERGENCY', 235, 128);

      const tex = new THREE.CanvasTexture(cvs);
      tex.anisotropy = 4;
      return tex;
    }

    const ambSideTex = createSideEmergencyDecal();
    const ambSideMat = new THREE.MeshBasicMaterial({ map: ambSideTex, transparent: true });

    // Left side decal (centered on patient box z = -0.65)
    const sideTextL = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.48), ambSideMat);
    sideTextL.rotation.y = -Math.PI / 2;
    sideTextL.position.set(-1.06, 1.70, -0.65);
    ambulanceGroup.add(sideTextL);

    // Right side decal (centered on patient box z = -0.65)
    const sideTextR = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.48), ambSideMat);
    sideTextR.rotation.y = Math.PI / 2;
    sideTextR.position.set(1.06, 1.70, -0.65);
    ambulanceGroup.add(sideTextR);

    // Hood "EMERGENCY" Decal with Medical Cross
    function createHoodDecal(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 256;
      const c = cvs.getContext('2d')!;

      c.fillStyle = '#f8fafc';
      c.fillRect(0, 0, 512, 256);

      // Red Medical Cross
      c.fillStyle = '#dc2626';
      c.fillRect(238, 20, 36, 96);
      c.fillRect(208, 50, 96, 36);

      // Red text "EMERGENCY"
      c.font = 'bold 44px "Rubik", "Arial Black", sans-serif';
      c.fillStyle = '#dc2626';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('EMERGENCY', 256, 160);

      return new THREE.CanvasTexture(cvs);
    }

    const hoodTex = createHoodDecal();
    const hoodDecal = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.45),
      new THREE.MeshBasicMaterial({ map: hoodTex, transparent: true })
    );
    hoodDecal.rotation.x = -Math.PI / 2;
    hoodDecal.position.set(0, 1.23, 2.25);
    ambulanceGroup.add(hoodDecal);

    // Front Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.35, 0.08), bumperBlackMat);
    grille.position.set(0, 0.75, 2.66);
    ambulanceGroup.add(grille);

    // Headlights
    const headlightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), headlightMat);
    headlightLeft.position.set(-0.7, 0.78, 2.66);
    ambulanceGroup.add(headlightLeft);

    const headlightRight = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.08), headlightMat);
    headlightRight.position.set(0.7, 0.78, 2.66);
    ambulanceGroup.add(headlightRight);

    // Front Bumper Lower Auxiliary Strobes (Blue on left, Red on right)
    const lowerAuxBlue = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.08), strobeBlueMat);
    lowerAuxBlue.position.set(-0.7, 0.58, 2.66);
    ambulanceGroup.add(lowerAuxBlue);

    const lowerAuxRed = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.1, 0.08), strobeRedMat);
    lowerAuxRed.position.set(0.7, 0.58, 2.66);
    ambulanceGroup.add(lowerAuxRed);

    // Corner Marker Lights on Ambulance Patient Box (matching reference image)
    const amberMarkerMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const redMarkerMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const blueMarkerMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });

    // Front-Right top corner: amber
    const markerFR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.14), amberMarkerMat);
    markerFR.position.set(1.06, 2.25, 0.85);
    ambulanceGroup.add(markerFR);

    // Front-Left top corner: amber
    const markerFL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.14), amberMarkerMat);
    markerFL.position.set(-1.06, 2.25, 0.85);
    ambulanceGroup.add(markerFL);

    // Rear-Right top corner: red/blue
    const markerRR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.14), blueMarkerMat);
    markerRR.position.set(1.06, 2.25, -2.15);
    ambulanceGroup.add(markerRR);

    // Rear-Left top corner: red
    const markerRL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.14), redMarkerMat);
    markerRL.position.set(-1.06, 2.25, -2.15);
    ambulanceGroup.add(markerRL);

    // Spotlights for High Beams
    const beamLightLeft = new THREE.SpotLight(0xfff7d6, 6.0, 18, Math.PI / 6, 0.4, 1.2);
    beamLightLeft.position.set(-0.7, 0.8, 2.7);
    beamLightLeft.target.position.set(-0.7, 0.1, 10);
    scene.add(beamLightLeft);
    scene.add(beamLightLeft.target);

    const beamLightRight = new THREE.SpotLight(0xfff7d6, 6.0, 18, Math.PI / 6, 0.4, 1.2);
    beamLightRight.position.set(0.7, 0.8, 2.7);
    beamLightRight.target.position.set(0.7, 0.1, 10);
    scene.add(beamLightRight);
    scene.add(beamLightRight.target);

    // Taillights
    const taillightLeft = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.08), taillightMat);
    taillightLeft.position.set(-0.85, 1.2, -2.22);
    ambulanceGroup.add(taillightLeft);

    const taillightRight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.08), taillightMat);
    taillightRight.position.set(0.85, 1.2, -2.22);
    ambulanceGroup.add(taillightRight);

    // Roof Lightbar (Sirens)
    const lightbarBase = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.45), bumperBlackMat);
    lightbarBase.position.set(0, 1.95, 1.35);
    ambulanceGroup.add(lightbarBase);

    const strobeBlue = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.38), strobeBlueMat);
    strobeBlue.position.set(-0.45, 2.05, 1.35);
    ambulanceGroup.add(strobeBlue);

    const strobeRed = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.2, 0.38), strobeRedMat);
    strobeRed.position.set(0.45, 2.05, 1.35);
    ambulanceGroup.add(strobeRed);

    // Dynamic PointLights for Siren Flashing
    const blueSirenLight = new THREE.PointLight(0x0088ff, 3.5, 9, 2.0);
    blueSirenLight.position.set(-0.6, 2.2, 1.4);
    ambulanceGroup.add(blueSirenLight);

    const redSirenLight = new THREE.PointLight(0xff1111, 3.5, 9, 2.0);
    redSirenLight.position.set(0.6, 2.2, 1.4);
    ambulanceGroup.add(redSirenLight);

    // 4 Wheels
    const wheels: THREE.Mesh[] = [];
    const wheelPositions: [number, number, number][] = [
      [-1.05, 0.42, 1.5], // front-left
      [1.05, 0.42, 1.5],  // front-right
      [-1.05, 0.42, -1.4], // rear-left
      [1.05, 0.42, -1.4],  // rear-right
    ];

    wheelPositions.forEach((pos) => {
      const wGroup = new THREE.Group();
      wGroup.position.set(...pos);

      const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 16), wheelRubberMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wGroup.add(tire);

      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.34, 12), rimSilverMat);
      rim.rotation.z = Math.PI / 2;
      wGroup.add(rim);

      ambulanceGroup.add(wGroup);
      wheels.push(tire);
    });

    // --- 6. Section 2 & 3: Holographic Radar / Telemetry Bounding Box ---
    const radarGroup = new THREE.Group();
    scene.add(radarGroup);

    // Expanding pulsing circles on road
    const radarRingMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const radarRingGeo = new THREE.RingGeometry(2.4, 2.55, 32);
    const radarRing = new THREE.Mesh(radarRingGeo, radarRingMat);
    radarRing.rotation.x = -Math.PI / 2;
    radarRing.position.y = 0.03;
    radarGroup.add(radarRing);

    // Green Road Directional Arrows
    const arrowsGroup = new THREE.Group();
    radarGroup.add(arrowsGroup);

    function createRoadArrow(zPos: number): THREE.Mesh {
      const shape = new THREE.Shape();
      shape.moveTo(0, 1.2);
      shape.lineTo(0.6, 0.3);
      shape.lineTo(0.25, 0.3);
      shape.lineTo(0.25, -0.6);
      shape.lineTo(-0.25, -0.6);
      shape.lineTo(-0.25, 0.3);
      shape.lineTo(-0.6, 0.3);
      shape.closePath();

      const geom = new THREE.ShapeGeometry(shape);
      const m = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geom, m);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = Math.PI;
      mesh.position.set(0.6, 0.02, zPos);
      return mesh;
    }

    const roadArrows: THREE.Mesh[] = [
      createRoadArrow(3.5),
      createRoadArrow(7.0),
      createRoadArrow(10.5),
    ];
    roadArrows.forEach((a) => arrowsGroup.add(a));

    // --- Section 2: Dispatch Holographic UI & Radio Audio Waveform (Reference: media_1794816754881_75863ed9.jpg) ---
    const dispatchHoloGroup = new THREE.Group();
    scene.add(dispatchHoloGroup);

    // 1. Large Holographic Telemetry Screen
    function createHoloTelemetryTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 340;
      const c = cvs.getContext('2d')!;

      // Translucent cyan glass background
      c.fillStyle = 'rgba(6, 24, 44, 0.9)';
      c.fillRect(0, 0, 512, 340);

      // Glowing cyan border
      c.strokeStyle = '#22d3ee';
      c.lineWidth = 4;
      c.strokeRect(4, 4, 504, 332);

      // Header Bar
      c.fillStyle = 'rgba(14, 116, 144, 0.5)';
      c.fillRect(4, 4, 504, 44);

      c.fillStyle = '#ef4444';
      c.beginPath();
      c.arc(24, 26, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#facc15';
      c.beginPath();
      c.arc(42, 26, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#10b981';
      c.beginPath();
      c.arc(60, 26, 6, 0, Math.PI * 2);
      c.fill();

      c.font = 'bold 20px "Courier New", monospace';
      c.fillStyle = '#38bdf8';
      c.fillText('02 / 05 • DISPATCH OVERLAY', 84, 32);

      // Telemetry stats & code rows
      c.font = 'bold 18px "Courier New", monospace';
      c.fillStyle = '#a5f3fc';
      c.fillText('DISPATCH ID : #PRAN-9042', 24, 85);
      c.fillText('INFLOW      : MULTI-CHANNEL (CALL + APP)', 24, 115);
      c.fillText('STATUS      : CALL RECEIVED • ACCELERATING', 24, 145);
      c.fillText('ASSIGNMENT  : UNIT PRAN-07 CONFIRMED', 24, 175);
      c.fillText('PREEMPTION  : GREEN CORRIDOR SYNCED', 24, 205);

      // Mini live audio/vitals chart at bottom
      c.strokeStyle = '#22d3ee';
      c.lineWidth = 2.5;
      c.beginPath();
      for (let x = 0; x < 464; x += 12) {
        const y = 280 + Math.sin(x * 0.08) * 20 + Math.cos(x * 0.16) * 12;
        if (x === 0) c.moveTo(24 + x, y);
        else c.lineTo(24 + x, y);
      }
      c.stroke();

      c.font = '14px "Courier New", monospace';
      c.fillStyle = '#67e8f9';
      c.fillText('LIVE RADIO / VOICE NOTE TRANSCRIPT STREAM', 24, 320);

      const tex = new THREE.CanvasTexture(cvs);
      return tex;
    }

    const holoTex = createHoloTelemetryTexture();
    const holoMat = new THREE.MeshBasicMaterial({
      map: holoTex,
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
    });
    const holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), holoMat);
    holoScreen.position.set(0.1, 2.5, -1.0);
    holoScreen.rotation.y = Math.PI * 0.12;
    dispatchHoloGroup.add(holoScreen);

    // 2. Secondary Mini Routing Hologram (Right side of road)
    function createMiniHoloTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 320;
      cvs.height = 180;
      const c = cvs.getContext('2d')!;

      c.fillStyle = 'rgba(6, 24, 44, 0.88)';
      c.fillRect(0, 0, 320, 180);

      c.strokeStyle = '#38bdf8';
      c.lineWidth = 3;
      c.strokeRect(3, 3, 314, 174);

      c.font = 'bold 16px "Courier New", monospace';
      c.fillStyle = '#facc15';
      c.fillText('ROUTE NAVIGATION OVERLAY', 16, 32);

      c.font = '14px "Courier New", monospace';
      c.fillStyle = '#e2e8f0';
      c.fillText('ETA: 4.2 MIN • CORRIDOR 1', 16, 68);
      c.fillText('TRAFFIC: SIGNALS PREEMPTED', 16, 98);
      c.fillText('COORDINATOR: CONFIRMED', 16, 128);

      const tex = new THREE.CanvasTexture(cvs);
      return tex;
    }

    const miniHoloTex = createMiniHoloTexture();
    const miniHoloScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.9),
      new THREE.MeshBasicMaterial({ map: miniHoloTex, transparent: true, opacity: 0.9, side: THREE.DoubleSide })
    );
    miniHoloScreen.position.set(3.9, 2.2, -0.4);
    miniHoloScreen.rotation.y = -Math.PI * 0.18;
    dispatchHoloGroup.add(miniHoloScreen);

    // 3. Glowing Audio/Radio Waveform Ribbon
    const waveSegments = 48;
    const waveRibbonGeo = new THREE.PlaneGeometry(4.2, 0.12, waveSegments, 1);
    waveRibbonGeo.rotateY(Math.PI / 10);
    const waveRibbonMat = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    });
    const waveMesh = new THREE.Mesh(waveRibbonGeo, waveRibbonMat);
    waveMesh.position.set(1.9, 2.45, -0.6);
    dispatchHoloGroup.add(waveMesh);

    // 4. Street Signs from Reference Image
    const signPostMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.4 });
    const signPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8), signPostMat);
    signPole.position.set(-1.8, 1.4, 3.4);
    dispatchHoloGroup.add(signPole);

    function createStreetSignTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 256;
      cvs.height = 96;
      const c = cvs.getContext('2d')!;
      c.fillStyle = '#1e40af';
      c.fillRect(0, 0, 256, 96);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 4;
      c.strokeRect(4, 4, 248, 88);
      c.font = 'bold 24px sans-serif';
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('DISPATCH WAY', 128, 48);
      return new THREE.CanvasTexture(cvs);
    }
    const streetPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 0.42),
      new THREE.MeshBasicMaterial({ map: createStreetSignTexture() })
    );
    streetPlate.position.set(-1.8, 2.4, 3.4);
    streetPlate.rotation.y = -Math.PI * 0.15;
    dispatchHoloGroup.add(streetPlate);

    // Diamond speed / warning sign on the right
    const diamondPole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.6, 8), signPostMat);
    diamondPole.position.set(4.6, 1.3, 0.6);
    dispatchHoloGroup.add(diamondPole);

    function createDiamondSignTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 160;
      cvs.height = 160;
      const c = cvs.getContext('2d')!;
      c.fillStyle = '#facc15';
      c.fillRect(0, 0, 160, 160);
      c.strokeStyle = '#1e293b';
      c.lineWidth = 6;
      c.strokeRect(6, 6, 148, 148);
      c.font = 'bold 50px sans-serif';
      c.fillStyle = '#1e293b';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('35', 80, 80);
      return new THREE.CanvasTexture(cvs);
    }
    const diamondPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(0.65, 0.65),
      new THREE.MeshBasicMaterial({ map: createDiamondSignTexture() })
    );
    diamondPlate.rotation.z = Math.PI / 4;
    diamondPlate.rotation.y = -Math.PI * 0.25;
    diamondPlate.position.set(4.6, 2.1, 0.6);
    dispatchHoloGroup.add(diamondPlate);

    // 5. Bright Warm Square Window on Background Building (matching reference image)
    const warmWindowMat = new THREE.MeshBasicMaterial({ color: 0xffedd5 });
    const warmWindow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.8), warmWindowMat);
    warmWindow.position.set(1.2, 5.2, -7.95);
    dispatchHoloGroup.add(warmWindow);

    const warmWindowLight = new THREE.PointLight(0xffedd5, 1.8, 10, 1.8);
    warmWindowLight.position.set(1.2, 5.2, -7.0);
    dispatchHoloGroup.add(warmWindowLight);

    // --- 7. Section 3: Traffic Vehicles ---
    const trafficGroup = new THREE.Group();
    scene.add(trafficGroup);

    function createCar(colorHex: number): THREE.Group {
      const car = new THREE.Group();
      const carMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.4, metalness: 0.2 });
      // Chassis
      const cBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 3.2), carMat);
      cBody.position.y = 0.45;
      cBody.castShadow = true;
      car.add(cBody);

      // Cabin / Roof
      const cRoof = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.48, 1.7), windowGlassMat);
      cRoof.position.set(0, 0.88, -0.15);
      car.add(cRoof);

      // Front Headlights (+Z front)
      const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), headlightMat);
      hlL.position.set(-0.52, 0.46, 1.62);
      const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), headlightMat);
      hlR.position.set(0.52, 0.46, 1.62);
      car.add(hlL, hlR);

      // Rear Taillights (-Z rear)
      const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), taillightMat);
      tlL.position.set(-0.52, 0.46, -1.62);
      const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.12, 0.05), taillightMat);
      tlR.position.set(0.52, 0.46, -1.62);
      car.add(tlL, tlR);

      // Wheels
      for (const s of [-0.82, 0.82]) {
        for (const l of [-0.95, 0.95]) {
          const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 10), wheelRubberMat);
          w.rotation.z = Math.PI / 2;
          w.position.set(s, 0.3, l);
          car.add(w);
        }
      }
      return car;
    }

    // Yellow Sedan: Drives forward down the left oncoming lane (x = -2.2, facing -Z oncoming, moving forward down the road)
    const carYellow = createCar(0xfacc15);
    carYellow.position.set(-2.2, 0, 12.0);
    carYellow.rotation.y = Math.PI;
    trafficGroup.add(carYellow);

    // Red Coupe: Drives forward down the far-left oncoming lane (x = -3.6, facing -Z oncoming, moving forward down the road)
    const carRed = createCar(0xef4444);
    carRed.position.set(-3.6, 0, -4.0);
    carRed.rotation.y = Math.PI;
    trafficGroup.add(carRed);

    // Blue Hatchback: Drives forward in center passing lane (x = -0.6, well separated from ambulance at x = 2.0, facing +Z, moving forward down the road)
    const carBlue = createCar(0x3b82f6);
    carBlue.position.set(-0.6, 0, 4.0);
    carBlue.rotation.y = 0;
    trafficGroup.add(carBlue);

    // --- 8. Section 4: Light Beams / Speed Streak Trails ---
    const lightTrailsGroup = new THREE.Group();
    scene.add(lightTrailsGroup);

    const trailRedGeo = new THREE.CylinderGeometry(0.08, 0.02, 10, 8);
    trailRedGeo.rotateX(Math.PI / 2);
    const trailRedMat = new THREE.MeshBasicMaterial({
      color: 0xff3b30,
      transparent: true,
      opacity: 0.85,
    });
    const trailRed = new THREE.Mesh(trailRedGeo, trailRedMat);
    trailRed.position.set(0.45, 2.05, -5.2);
    lightTrailsGroup.add(trailRed);

    const trailBlueGeo = new THREE.CylinderGeometry(0.08, 0.02, 10, 8);
    trailBlueGeo.rotateX(Math.PI / 2);
    const trailBlueMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.85,
    });
    const trailBlue = new THREE.Mesh(trailBlueGeo, trailBlueMat);
    trailBlue.position.set(-0.45, 2.05, -5.2);
    lightTrailsGroup.add(trailBlue);

    // Extra road streaks
    for (let s = -1; s <= 1; s += 2) {
      const streakMat = new THREE.MeshBasicMaterial({
        color: s === 1 ? 0xff2222 : 0x0088ff,
        transparent: true,
        opacity: 0.5,
      });
      const streak = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 14), streakMat);
      streak.rotation.x = -Math.PI / 2;
      streak.position.set(s * 0.9, 0.04, -7.0);
      lightTrailsGroup.add(streak);
    }

    // --- 9. Section 5: Hospital Building with Glowing Neon EMERGENCY Sign (Reference: media_1794819686574_69836512.jpg) ---
    const hospitalGroup = new THREE.Group();
    scene.add(hospitalGroup);

    // Dedicated Hospital Scene Group aligned cleanly with the road axis
    const hospitalSceneGroup = new THREE.Group();
    hospitalSceneGroup.position.set(0, 0, 0);
    hospitalSceneGroup.rotation.y = 0;
    hospitalGroup.add(hospitalSceneGroup);

    // Clean dark asphalt driveway matching the reference image
    const bayAsphalt = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 80),
      new THREE.MeshStandardMaterial({ color: 0x141a24, roughness: 0.85, metalness: 0.1 })
    );
    bayAsphalt.rotation.x = -Math.PI / 2;
    bayAsphalt.position.set(4.0, 0.012, 0);
    hospitalSceneGroup.add(bayAsphalt);

    // Dashed white center lane markings (matching reference image media_1794819686574_69836512.jpg)
    for (let z = -28; z <= 28; z += 4.0) {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 2.2), dashedLineMat);
      stripe.rotation.x = -Math.PI / 2;
      stripe.position.set(2.4, 0.015, z);
      hospitalSceneGroup.add(stripe);
    }

    // Soft Warm Headlight Ground Pool (shining forward from the headlights)
    function createHeadlightPoolTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 512;
      const c = cvs.getContext('2d')!;
      const grad = c.createRadialGradient(256, 256, 10, 256, 256, 240);
      grad.addColorStop(0, 'rgba(255, 247, 237, 0.7)');
      grad.addColorStop(0.35, 'rgba(254, 215, 170, 0.4)');
      grad.addColorStop(0.7, 'rgba(253, 186, 116, 0.14)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      c.fillStyle = grad;
      c.fillRect(0, 0, 512, 512);
      return new THREE.CanvasTexture(cvs);
    }

    const headlightPoolMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6.0, 7.5),
      new THREE.MeshBasicMaterial({
        map: createHeadlightPoolTexture(),
        transparent: true,
        opacity: 0.88,
      })
    );
    headlightPoolMesh.rotation.x = -Math.PI / 2;
    headlightPoolMesh.position.set(0.9, 0.016, 4.4);
    hospitalSceneGroup.add(headlightPoolMesh);

    // Sidewalk Platform & Curb running parallel to building
    const sidewalk = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.16, 80),
      new THREE.MeshStandardMaterial({ color: 0x242e42, roughness: 0.7 })
    );
    sidewalk.position.set(-1.05, 0.08, 0);
    hospitalSceneGroup.add(sidewalk);

    const sidewalkCurb = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.20, 80),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 })
    );
    sidewalkCurb.position.set(-0.3, 0.10, 0);
    hospitalSceneGroup.add(sidewalkCurb);

    // Modern Hospital Main Building Block (front face sits exactly at x = -1.8, height = 6.2m)
    const hospBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(10, 6.2, 80),
      new THREE.MeshStandardMaterial({ color: 0x161e2c, roughness: 0.8, metalness: 0.2 })
    );
    hospBuilding.position.set(-6.8, 3.1, 0);
    hospitalSceneGroup.add(hospBuilding);

    // Roof Parapet / Cornice Trim
    const roofTrim = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 0.28, 80.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 })
    );
    roofTrim.position.set(-6.8, 6.25, 0);
    hospitalSceneGroup.add(roofTrim);

    // Cantilevered Architectural Canopy / Overhang (extends forward from x = -1.8 to x = -0.55 at y = 2.68m)
    const canopy = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.26, 16.0),
      new THREE.MeshStandardMaterial({ color: 0x1e2738, roughness: 0.35, metalness: 0.6 })
    );
    canopy.position.set(-1.175, 2.68, -0.4);
    canopy.castShadow = true;
    hospitalSceneGroup.add(canopy);

    // Canopy Under-Ledge Downlight fixtures
    for (let lz = -5.0; lz <= 5.0; lz += 5.0) {
      const downFixture = new THREE.Mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 0.05, 8),
        new THREE.MeshBasicMaterial({ color: 0xffedd5 })
      );
      downFixture.position.set(0, -0.14, lz);
      canopy.add(downFixture);
    }

    const canopySpot = new THREE.SpotLight(0xffedd5, 4.5, 10, Math.PI / 3.5, 0.4);
    canopySpot.position.set(-1.15, 2.65, -0.4);
    canopySpot.target.position.set(-1.15, 0, -0.4);
    hospitalSceneGroup.add(canopySpot);
    hospitalSceneGroup.add(canopySpot.target);

    // 3D Backing box for EMERGENCY Sign (centered at y = 3.65m right above canopy)
    const signBacking = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.35, 8.8),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.3 })
    );
    signBacking.position.set(-1.74, 3.65, -0.4);
    hospitalSceneGroup.add(signBacking);

    // Glowing Neon EMERGENCY Sign Canvas Texture (2048x512)
    function createEmergencySignTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 2048;
      cvs.height = 512;
      const c = cvs.getContext('2d')!;

      // Dark slate sign plate backing
      c.fillStyle = '#0b1120';
      c.fillRect(0, 0, 2048, 512);

      c.strokeStyle = '#1e293b';
      c.lineWidth = 14;
      c.strokeRect(8, 8, 2032, 496);

      // Multi-layer glowing red neon letterforms matching reference image media_1794819686574_69836512.jpg
      c.font = '900 190px "Rubik", "Arial Black", "Impact", sans-serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';

      // 1. Broad outer red neon bloom
      c.fillStyle = '#ff0033';
      c.shadowColor = '#ff0033';
      c.shadowBlur = 70;
      c.fillText('EMERGENCY', 1024, 256);

      // 2. Mid-layer intense red glow
      c.fillStyle = '#ff1744';
      c.shadowColor = '#ff1744';
      c.shadowBlur = 30;
      c.fillText('EMERGENCY', 1024, 256);

      // 3. Bright inner neon tube white-pink core
      c.fillStyle = '#ffe4e8';
      c.shadowBlur = 8;
      c.shadowColor = '#ffffff';
      c.fillText('EMERGENCY', 1024, 256);

      return new THREE.CanvasTexture(cvs);
    }

    // Sign mesh mounted on facade surface right above the canopy (facing +X)
    const signMat = new THREE.MeshBasicMaterial({
      map: createEmergencySignTexture(),
      side: THREE.DoubleSide,
    });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 1.25), signMat);
    signMesh.position.set(-1.67, 3.65, -0.4);
    signMesh.rotation.y = Math.PI / 2;
    hospitalSceneGroup.add(signMesh);

    // Red neon point lights casting vibrant red glow across facade & ground
    const neonLight1 = new THREE.PointLight(0xff1744, 7.0, 14, 1.2);
    neonLight1.position.set(-0.7, 3.65, -3.2);
    hospitalSceneGroup.add(neonLight1);

    const neonLight2 = new THREE.PointLight(0xff1744, 8.5, 15, 1.2);
    neonLight2.position.set(-0.7, 3.65, -0.4);
    hospitalSceneGroup.add(neonLight2);

    const neonLight3 = new THREE.PointLight(0xff1744, 7.0, 14, 1.2);
    neonLight3.position.set(-0.7, 3.65, 2.4);
    hospitalSceneGroup.add(neonLight3);

    // Ground Floor Illuminated Glass Doors & Lobby Windows (matching reference image media_1794819686574_69836512.jpg)
    function createEmergencyGlassDoorsTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 2048;
      cvs.height = 1024;
      const c = cvs.getContext('2d')!;

      // Left window (warm yellow glow)
      c.fillStyle = '#fef08a';
      c.fillRect(30, 30, 480, 960);
      c.fillStyle = 'rgba(255, 255, 255, 0.45)';
      c.fillRect(60, 60, 420, 220);

      // Center entrance sliding glass doors (warm peach/coral triage lobby glow)
      const gradCenter = c.createLinearGradient(0, 0, 0, 1024);
      gradCenter.addColorStop(0, '#fffbf0');
      gradCenter.addColorStop(0.35, '#fed7aa');
      gradCenter.addColorStop(0.7, '#fda4af');
      gradCenter.addColorStop(1, '#fb7185');
      c.fillStyle = gradCenter;
      c.fillRect(540, 30, 940, 960);

      // Soft interior ceiling fixtures
      c.fillStyle = '#ffffff';
      c.shadowColor = 'rgba(255, 255, 255, 0.9)';
      c.shadowBlur = 24;
      c.fillRect(600, 60, 380, 36);
      c.fillRect(1040, 60, 380, 36);

      // Right window (warm yellow glow)
      c.shadowBlur = 0;
      c.fillStyle = '#fef08a';
      c.fillRect(1510, 30, 480, 960);
      c.fillStyle = 'rgba(255, 255, 255, 0.45)';
      c.fillRect(1540, 60, 420, 220);

      // Dark slate framing & mullions
      c.fillStyle = '#1e293b';
      c.fillRect(0, 0, 2048, 30);
      c.fillRect(0, 994, 2048, 30);
      c.fillRect(0, 0, 30, 1024);
      c.fillRect(2018, 0, 30, 1024);
      c.fillRect(510, 0, 30, 1024);
      c.fillRect(1000, 0, 20, 1024); // Center sliding door split
      c.fillRect(1480, 0, 30, 1024);

      // Red Medical Cross on sliding doors
      c.fillStyle = '#ef4444';
      c.fillRect(990, 420, 40, 160);
      c.fillRect(930, 480, 160, 40);

      return new THREE.CanvasTexture(cvs);
    }

    const doorsMat = new THREE.MeshBasicMaterial({
      map: createEmergencyGlassDoorsTexture(),
      side: THREE.DoubleSide,
    });
    const doorsMesh = new THREE.Mesh(new THREE.PlaneGeometry(16.0, 2.5), doorsMat);
    doorsMesh.position.set(-1.77, 1.35, -0.4);
    doorsMesh.rotation.y = Math.PI / 2;
    hospitalSceneGroup.add(doorsMesh);

    // Warm entrance light spilling outward
    const warmEntranceLight = new THREE.PointLight(0xffedd5, 5.5, 14, 1.2);
    warmEntranceLight.position.set(-0.7, 1.5, -0.4);
    hospitalSceneGroup.add(warmEntranceLight);

    // Warm peach entrance light puddle spilling onto sidewalk and driveway
    const warmSpillMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5.0, 7.5),
      new THREE.MeshBasicMaterial({
        color: 0xffa285,
        transparent: true,
        opacity: 0.35,
      })
    );
    warmSpillMesh.rotation.x = -Math.PI / 2;
    warmSpillMesh.position.set(-0.5, 0.018, -0.4);
    hospitalSceneGroup.add(warmSpillMesh);

    // Upper Floor Illuminated Windows (matching reference image media_1794819686574_69836512.jpg, centered at y = 4.85m)
    function createWindowTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 768;
      const c = cvs.getContext('2d')!;

      // Warm illuminated interior
      const grad = c.createLinearGradient(0, 0, 0, 768);
      grad.addColorStop(0, '#fffbf0');
      grad.addColorStop(1, '#fef08a');
      c.fillStyle = grad;
      c.fillRect(0, 0, 512, 768);

      // Subtle horizontal window blinds
      c.fillStyle = 'rgba(15, 23, 42, 0.15)';
      for (let y = 50; y < 760; y += 32) {
        c.fillRect(20, y, 472, 8);
      }

      // Outer frame
      c.strokeStyle = '#0f172a';
      c.lineWidth = 28;
      c.strokeRect(14, 14, 484, 740);

      return new THREE.CanvasTexture(cvs);
    }

    const winTex = createWindowTexture();
    const winMat = new THREE.MeshBasicMaterial({ map: winTex, side: THREE.DoubleSide });

    // Upper window 1 (left)
    const win1 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.7), winMat);
    win1.position.set(-1.77, 4.85, 3.2);
    win1.rotation.y = Math.PI / 2;
    hospitalSceneGroup.add(win1);

    // Upper window 2 (center, above sign)
    const win2 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.7), winMat);
    win2.position.set(-1.77, 4.85, -0.4);
    win2.rotation.y = Math.PI / 2;
    hospitalSceneGroup.add(win2);

    // Upper window 3 (right)
    const win3 = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.7), winMat);
    win3.position.set(-1.77, 4.85, -4.0);
    win3.rotation.y = Math.PI / 2;
    hospitalSceneGroup.add(win3);

    const winLight = new THREE.PointLight(0xfef08a, 4.0, 14, 1.5);
    winLight.position.set(-0.7, 4.85, -0.4);
    hospitalSceneGroup.add(winLight);

    // 3D Floating "SAFE ARRIVAL" Badge Pill (matching reference image media_1794819686574_69836512.jpg)
    function createSafeArrivalPillTexture(): THREE.CanvasTexture {
      const cvs = document.createElement('canvas');
      cvs.width = 512;
      cvs.height = 180;
      const c = cvs.getContext('2d')!;

      // Rounded pill rect
      c.fillStyle = '#064e3b';
      c.beginPath();
      c.roundRect(14, 14, 484, 120, 36);
      c.fill();

      // Downward pointer beak triangle pointing to ambulance cab roof
      c.beginPath();
      c.moveTo(236, 134);
      c.lineTo(256, 168);
      c.lineTo(276, 134);
      c.closePath();
      c.fill();

      // Neon green stroke with glow
      c.strokeStyle = '#22c55e';
      c.lineWidth = 10;
      c.shadowColor = '#22c55e';
      c.shadowBlur = 18;
      c.stroke();

      // Text: SAFE ARRIVAL
      c.font = 'bold 52px "Rubik", "Arial Black", sans-serif';
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.shadowBlur = 0;
      c.fillText('SAFE ARRIVAL', 256, 74);

      return new THREE.CanvasTexture(cvs);
    }

    const safeArrivalMat = new THREE.MeshBasicMaterial({
      map: createSafeArrivalPillTexture(),
      transparent: true,
      side: THREE.DoubleSide,
    });
    const safeArrivalMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.6), safeArrivalMat);
    safeArrivalMesh.position.set(0.9, 2.7, 1.3);
    safeArrivalMesh.rotation.y = Math.PI * 0.25;
    hospitalSceneGroup.add(safeArrivalMesh);

    // --- 10. Animation Loop & Transitions ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const currentCamTarget = new THREE.Vector3(...initialConfig.camPos);
    const currentLookAt = new THREE.Vector3(...initialConfig.lookAt);
    const currentAmbTarget = new THREE.Vector3(...initialConfig.ambulancePos);
    let targetRotY = initialConfig.ambulanceRotY;

    // Vector for speech bubble 2D screen-space projection
    const ambulanceRoofWorldPos = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      const { currentSection: activeSec, strobesEnabled: strobesOn, beamEnabled: beamOn, onAmbulanceScreenPos: posCallback } = stateRef.current;
      const targetConfig = SECTIONS_CONFIG[Math.max(0, Math.min(4, activeSec - 1))] || SECTIONS_CONFIG[0];

      // 1. Smooth Camera Transition (Lerp)
      currentCamTarget.set(...targetConfig.camPos);
      currentLookAt.set(...targetConfig.lookAt);
      camera.position.lerp(currentCamTarget, 0.045);

      const lookTarget = new THREE.Vector3();
      lookTarget.lerpVectors(camera.getWorldDirection(new THREE.Vector3()).add(camera.position), currentLookAt, 0.045);
      camera.lookAt(currentLookAt);

      // 2. Smooth Ambulance Position & Rotation
      currentAmbTarget.set(...targetConfig.ambulancePos);
      targetRotY = targetConfig.ambulanceRotY;
      ambulanceGroup.position.lerp(currentAmbTarget, 0.04);
      ambulanceGroup.rotation.y = THREE.MathUtils.lerp(ambulanceGroup.rotation.y, targetRotY, 0.04);

      // Engine subtle idle vibration
      if (targetConfig.speed > 0) {
        ambulanceGroup.position.y = THREE.MathUtils.lerp(ambulanceGroup.position.y, Math.sin(elapsed * 24) * 0.018, 0.1);
      } else {
        ambulanceGroup.position.y = THREE.MathUtils.lerp(ambulanceGroup.position.y, Math.sin(elapsed * 3) * 0.012, 0.05);
      }

      // 3. Wheel rotation & Synchronized Environment Motion
      const groundMove = targetConfig.speed * 8.5 * delta;
      const wheelSpin = groundMove > 0 ? groundMove / 0.42 : 0;
      wheels.forEach((w) => {
        w.rotation.x += wheelSpin;
      });

      // Animate Trees, Street Lamps, and Buildings scrolling backward as the ambulance drives forward
      if (groundMove > 0 && activeSec !== 5) {
        treeMeshes.forEach((tree) => {
          tree.position.z -= groundMove;
          if (tree.position.z < -42) {
            tree.position.z += 84;
          }
        });

        lampMeshes.forEach((lamp) => {
          lamp.position.z -= groundMove;
          if (lamp.position.z < -42) {
            lamp.position.z += 84;
          }
        });

        // Street-facing avenue buildings scroll continuously
        streetBuildingMeshes.forEach((b) => {
          b.position.z -= groundMove;
          if (b.position.z < -45) {
            b.position.z += 90;
          }
        });

        // Distant background skyscrapers drift with subtle 3D parallax
        distantBuildingMeshes.forEach((b) => {
          b.position.z -= groundMove * 0.35;
          if (b.position.z < -52) {
            b.position.z += 30;
          }
        });
      }

      // 4. Strobe Siren Lights (Alternating Red & Blue)
      if (strobesOn) {
        const strobeFreq = Math.floor(elapsed * 12) % 4;
        const isRed = strobeFreq === 0 || strobeFreq === 1;
        strobeRed.visible = isRed;
        strobeBlue.visible = !isRed;
        redSirenLight.intensity = isRed ? 4.5 : 0.2;
        blueSirenLight.intensity = !isRed ? 4.5 : 0.2;
      } else {
        strobeRed.visible = false;
        strobeBlue.visible = false;
        redSirenLight.intensity = 0;
        blueSirenLight.intensity = 0;
      }

      // 5. Headlight Beams (accurately oriented to ambulance forward heading)
      beamLightLeft.intensity = beamOn ? 6.5 : 0.8;
      beamLightRight.intensity = beamOn ? 6.5 : 0.8;

      const fX = Math.sin(ambulanceGroup.rotation.y);
      const fZ = Math.cos(ambulanceGroup.rotation.y);
      const rX = Math.cos(ambulanceGroup.rotation.y);
      const rZ = -Math.sin(ambulanceGroup.rotation.y);

      const oX = ambulanceGroup.position.x + fX * 2.5;
      const oZ = ambulanceGroup.position.z + fZ * 2.5;
      const oY = ambulanceGroup.position.y + 0.8;

      beamLightLeft.position.set(oX - rX * 0.7, oY, oZ - rZ * 0.7);
      beamLightRight.position.set(oX + rX * 0.7, oY, oZ + rZ * 0.7);

      beamLightLeft.target.position.set(oX + fX * 12 - rX * 0.7, 0.1, oZ + fZ * 12 - rZ * 0.7);
      beamLightRight.target.position.set(oX + fX * 12 + rX * 0.7, 0.1, oZ + fZ * 12 + rZ * 0.7);

      // 6. Section Visibility Switches
      dispatchHoloGroup.visible = targetConfig.showDispatchHolo;
      trafficGroup.visible = targetConfig.showTraffic;
      lightTrailsGroup.visible = targetConfig.showLightTrails;
      hospitalGroup.visible = targetConfig.showHospital;
      groundGroup.visible = activeSec !== 5;
      radarGroup.visible = targetConfig.showRadar;
      treesGroup.visible = activeSec !== 5;
      buildingsGroup.visible = activeSec !== 5;

      // Update Distinct Road System Visibility for Each Section
      roadGroup1.visible = activeSec === 1;
      roadGroup2.visible = activeSec === 2;
      roadGroup3.visible = activeSec === 3;
      roadGroup4.visible = activeSec === 4;
      roadGroup5.visible = activeSec === 5;

      // Animate Audio Waveform in Section 2 (media_1794816754881_75863ed9.jpg)
      if (targetConfig.showDispatchHolo) {
        const pos = waveRibbonGeo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          pos.setY(i, Math.sin(elapsed * 7.5 + x * 4.2) * 0.22);
        }
        pos.needsUpdate = true;
      }

      // Animate Traffic cars driving realistically forward in their distinct lanes in Section 3
      if (targetConfig.showTraffic) {
        // Yellow sedan drives forward in -Z in left oncoming lane (x = -2.2)
        carYellow.position.z -= (0.08 + groundMove * 0.4);
        if (carYellow.position.z < -26) carYellow.position.z = 32;

        // Red coupe drives forward in -Z in far-left oncoming lane (x = -3.6)
        carRed.position.z -= (0.12 + groundMove * 0.5);
        if (carRed.position.z < -26) carRed.position.z = 38;

        // Blue hatchback drives forward in +Z in center lane (x = -0.6, well separated from ambulance at x = 2.0)
        carBlue.position.z += 0.05;
        if (carBlue.position.z > 32) carBlue.position.z = -22;
      }

      // Animate Light Trails to stream behind ambulance in Section 4
      if (targetConfig.showLightTrails) {
        lightTrailsGroup.position.set(ambulanceGroup.position.x, ambulanceGroup.position.y, ambulanceGroup.position.z);
        lightTrailsGroup.rotation.y = ambulanceGroup.rotation.y;
      }

      // 3D SAFE ARRIVAL badge floating over the ambulance in Section 5 (media_1794819686574_69836512.jpg)
      if (targetConfig.showHospital) {
        safeArrivalMesh.position.set(0.9, 2.7, 1.3);
        safeArrivalMesh.rotation.y = Math.PI * 0.25;
      }

      // Animate Radar Ring Pulsing
      if (targetConfig.showRadar) {
        const pulse = 1 + (Math.sin(elapsed * 4) + 1) * 0.25;
        radarRing.scale.set(pulse, pulse, 1);
        radarRing.position.set(ambulanceGroup.position.x, 0.03, ambulanceGroup.position.z);
      }

      // Animate Road dashed lines scrolling in sync with ground motion
      if (groundMove > 0) {
        if (activeSec === 2) {
          roadLines2.forEach((line) => {
            line.position.z -= groundMove;
            if (line.position.z < -40) line.position.z += 80;
          });
        } else if (activeSec === 3) {
          roadLines3.forEach((line) => {
            line.position.z -= groundMove;
            if (line.position.z < -40) line.position.z += 80;
          });
        } else if (activeSec === 4) {
          roadLines4.forEach((line) => {
            line.position.z -= groundMove;
            if (line.position.z < -40) line.position.z += 80;
          });
        }
      }

      // Animate Rooftop Aviation Beacon Blinking
      const beaconOn = Math.floor(elapsed * 2.2) % 2 === 0;
      beaconMeshes.forEach((bm) => (bm.visible = beaconOn));
      beaconLights.forEach((bl) => (bl.intensity = beaconOn ? 2.5 : 0.05));

      // 7. Calculate Speech Bubble 2D Projection
      if (posCallback) {
        if (activeSec === 5) {
          // In Section 5, offset speech bubble to the rear-right of the ambulance matching reference image
          ambulanceRoofWorldPos.set(
            ambulanceGroup.position.x + 1.1,
            ambulanceGroup.position.y + 2.1,
            ambulanceGroup.position.z - 0.7
          );
        } else {
          ambulanceRoofWorldPos.set(
            ambulanceGroup.position.x,
            ambulanceGroup.position.y + 2.5,
            ambulanceGroup.position.z
          );
        }
        ambulanceRoofWorldPos.project(camera);

        const isBehindCamera = ambulanceRoofWorldPos.z > 1;
        const x = (ambulanceRoofWorldPos.x * 0.5 + 0.5) * width;
        const y = (-ambulanceRoofWorldPos.y * 0.5 + 0.5) * height;

        posCallback(x, y, !isBehindCamera);
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- 11. Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full pointer-events-auto" />;
}
