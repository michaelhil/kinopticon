/**
 * Kinopticon - Clean Road Visualization
 * Single, clean version with flat OSM overlay on procedural terrain
 */

import * as THREE from 'three';

interface OSMNode {
  id: string;
  lat: number;
  lon: number;
}

interface OSMWay {
  id: string;
  nodes: string[];
  tags: Record<string, string>;
}

interface OSMData {
  nodes: Map<string, OSMNode>;
  ways: OSMWay[];
}

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface RoadSegment {
  points: Vec3[];
  name?: string;
  wayId: string;
}

interface DrivingState {
  isDriving: boolean;
  currentSegment?: RoadSegment;
  currentPointIndex: number;
  currentPosition: Vec3;
  currentDirection: Vec3;
  speed: number; // km/h
  targetSpeed: number; // km/h
}

class Kinopticon {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain?: THREE.Mesh;
  private roads: THREE.Group = new THREE.Group();
  private roadLabels: THREE.Sprite[] = [];
  private roadSegments: RoadSegment[] = [];
  private bumpiness: number = 0.3;
  private heightMap: Float32Array | null = null;
  private terrainSize: number = 2000;
  private terrainSegments: number = 100;
  private drivingState: DrivingState;
  private orbitControls: any = null;
  private notificationElement?: HTMLDivElement;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    // Initialize driving state
    this.drivingState = {
      isDriving: false,
      currentPointIndex: 0,
      currentPosition: { x: 0, y: 0, z: 0 },
      currentDirection: { x: 0, y: 0, z: 1 },
      speed: 0,
      targetSpeed: 20
    };
    
    this.init();
  }

  private init(): void {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x6B8CAE, 1); // Darker sky blue background
    document.body.appendChild(this.renderer.domElement);

    // Setup scene
    this.setupLighting();
    this.createSkyDome();
    this.createFlatGround();
    this.setupCamera();
    this.setupControls();

    // Load roads - focus on proper road rendering
    this.loadHaldenRoads();
    
    // Setup driving controls UI
    this.setupDrivingUI();

    // Start render loop
    this.animate();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    this.scene.add(directionalLight);
  }

  private createSkyDome(): void {
    console.log('☁️ Creating sky dome with clouds...');
    
    // Create sky sphere
    const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
    
    // Create gradient sky with canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Create darker sky gradient
    const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#4A6B8A'); // Darker blue at top
    gradient.addColorStop(0.3, '#6B8CAE'); // Medium blue
    gradient.addColorStop(0.6, '#8FA7C4'); // Lighter blue
    gradient.addColorStop(1, '#B8CDD9'); // Pale blue at horizon
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add more cloud patterns with higher opacity
    context.globalAlpha = 0.5;
    context.fillStyle = '#E8E8E8';
    
    // Draw more procedural clouds
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.5 + canvas.height * 0.1; // Clouds in upper portion
      const radiusX = Math.random() * 80 + 40;
      const radiusY = Math.random() * 30 + 15;
      
      // Draw cloud puffs
      context.save();
      context.filter = 'blur(15px)';
      context.beginPath();
      context.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
      context.fill();
      
      // Add smaller puffs around main cloud
      for (let j = 0; j < 3; j++) {
        const offsetX = (Math.random() - 0.5) * radiusX;
        const offsetY = (Math.random() - 0.5) * radiusY * 0.5;
        const smallRadius = radiusX * 0.5;
        
        context.beginPath();
        context.ellipse(x + offsetX, y + offsetY, smallRadius, smallRadius * 0.5, 0, 0, Math.PI * 2);
        context.fill();
      }
      context.restore();
    }
    
    // Add wispy clouds
    context.globalAlpha = 0.25;
    context.filter = 'blur(20px)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height * 0.4;
      const width = Math.random() * 200 + 100;
      const height = Math.random() * 20 + 10;
      
      context.fillRect(x, y, width, height);
    }
    
    // Create texture from canvas
    const skyTexture = new THREE.CanvasTexture(canvas);
    skyTexture.needsUpdate = true;
    
    const skyMaterial = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      fog: false
    });
    
    const skyDome = new THREE.Mesh(skyGeometry, skyMaterial);
    this.scene.add(skyDome);
    
    // Add animated cloud layer
    this.addAnimatedClouds();
    
    console.log('✅ Sky dome created');
  }
  
  private addAnimatedClouds(): void {
    // Create more floating cloud sprites at different heights
    for (let i = 0; i < 25; i++) {
      const cloudGeometry = new THREE.PlaneGeometry(
        Math.random() * 300 + 200,
        Math.random() * 100 + 50
      );
      
      // Create cloud texture
      const cloudCanvas = document.createElement('canvas');
      cloudCanvas.width = 256;
      cloudCanvas.height = 128;
      const ctx = cloudCanvas.getContext('2d')!;
      
      // Draw fluffy cloud
      ctx.fillStyle = 'white';
      ctx.globalAlpha = 0.6;
      ctx.filter = 'blur(10px)';
      
      // Multiple ellipses for cloud shape
      for (let j = 0; j < 5; j++) {
        const x = (j / 4) * cloudCanvas.width;
        const y = cloudCanvas.height / 2 + (Math.random() - 0.5) * 20;
        const radiusX = Math.random() * 40 + 30;
        const radiusY = Math.random() * 20 + 15;
        
        ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      
      const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
      cloudTexture.needsUpdate = true;
      
      const cloudMaterial = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      
      const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
      
      // Position clouds randomly in sky
      cloud.position.set(
        (Math.random() - 0.5) * 3000,
        Math.random() * 200 + 300, // High in the sky
        (Math.random() - 0.5) * 3000
      );
      
      // Random rotation for variety
      cloud.rotation.z = Math.random() * Math.PI;
      
      // Store cloud for potential animation
      this.scene.add(cloud);
    }
  }

  private createFlatGround(): void {
    console.log('🏔️ Creating procedural terrain...');
    
    // Create a larger, more visible terrain
    const terrainSize = 2000;
    const segments = 50;
    
    // Create terrain geometry manually to ensure proper height application
    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Initialize heightmap for roads
    this.terrainSize = terrainSize;
    this.terrainSegments = segments;
    this.heightMap = new Float32Array((segments + 1) * (segments + 1));
    
    // Generate terrain vertices with height variations
    console.log('🏔️ Generating hills manually...');
    
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        // Calculate world coordinates
        const x = (i / segments - 0.5) * terrainSize;
        const z = (j / segments - 0.5) * terrainSize;
        
        // Create dramatic height changes for testing
        let height = 0;
        height += Math.sin(x * 0.001) * 80;  // Large hills
        height += Math.cos(z * 0.0008) * 60;
        height += Math.sin(x * 0.003 + z * 0.002) * 30;
        
        // Store vertex
        vertices.push(x, height, z);
        
        // Store in height map for road calculations
        // Using consistent indexing: i=X, j=Z
        const heightMapIndex = i * (segments + 1) + j;
        this.heightMap[heightMapIndex] = height;
        
        // Create triangle indices
        if (i < segments && j < segments) {
          const a = i * (segments + 1) + j;
          const b = i * (segments + 1) + (j + 1);
          const c = (i + 1) * (segments + 1) + j;
          const d = (i + 1) * (segments + 1) + (j + 1);
          
          // Two triangles per quad
          indices.push(a, b, c);
          indices.push(b, d, c);
        }
      }
    }
    
    // Set geometry attributes
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    console.log(`✅ Created terrain with ${vertices.length/3} vertices and ${indices.length/3} triangles`);
    
    // Create grass texture
    const grassTexture = this.createGrassTexture();
    
    // Create material with grass texture
    const material = new THREE.MeshLambertMaterial({ 
      map: grassTexture,
      side: THREE.DoubleSide,
      wireframe: false
    });
    
    this.terrain = new THREE.Mesh(geometry, material);
    // No rotation needed - we built it in world space
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
    
    // Add subtle wireframe overlay to show topology
    this.addTopographyMesh(geometry, terrainSize, segments);
    
    console.log('✅ Gentle rolling terrain created with height variations');
  }

  private addTopographyMesh(baseGeometry: THREE.PlaneGeometry, terrainSize: number, segments: number): void {
    console.log('🗺️ Adding topography mesh overlay...');
    
    // Create a wireframe version of the same geometry
    const wireframeGeometry = baseGeometry.clone();
    
    // Create subtle green wireframe material - slightly different from grass
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x5a7a4a, // Slightly darker green than grass base color
      wireframe: true,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    // Create wireframe mesh
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    // No rotation needed - geometry is already in world space
    wireframeMesh.position.y = 0.5; // Lower than roads but above terrain
    
    this.scene.add(wireframeMesh);
    
    // Also add grid lines for better visualization
    this.addGridLines(terrainSize);
    
    console.log('✅ Topography mesh overlay added');
  }

  private addGridLines(terrainSize: number): void {
    const gridHelper = new THREE.GridHelper(terrainSize, 20, 0xdddddd, 0xdddddd);
    gridHelper.position.y = 0.2; // Just above terrain, below wireframe and roads
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.1; // Very subtle
    this.scene.add(gridHelper);
  }

  private createProceduralTerrain(): void {
    const terrainSize = 1500; // Smaller terrain to match 1km OSM area
    const segments = 100; // Fewer segments for simpler mesh
    
    // Create terrain geometry
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, segments, segments);
    const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
    
    // Store height map for road elevation lookup
    this.heightMap = new Float32Array((segments + 1) * (segments + 1));
    this.terrainSize = terrainSize;
    this.terrainSegments = segments;
    
    console.log(`🏔️ Generating terrain: ${segments+1} x ${segments+1} vertices`);
    
    // Generate gentle heightmap - NOTE: PlaneGeometry vertices are in XZ plane before rotation
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const x = (i / segments - 0.5) * terrainSize;
        const z = (j / segments - 0.5) * terrainSize;
        
        // Very gentle undulating terrain
        let height = 0;
        
        // Large gentle waves
        height += Math.sin(x * 0.003) * 8;
        height += Math.cos(z * 0.004) * 6;
        
        // Add some gentle noise
        height += this.simpleNoise(x * 0.01, z * 0.01) * 3;
        height += this.simpleNoise(x * 0.02, z * 0.02) * 1.5;
        
        // Store in height map
        const index = i * (segments + 1) + j;
        this.heightMap[index] = height;
        
        // Set vertex Y position (height) - this is correct for PlaneGeometry
        positions.setY(index, height);
      }
    }
    
    console.log(`✅ Generated ${(segments+1)*(segments+1)} terrain vertices`);
    
    // Update geometry
    geometry.computeVertexNormals();
    
    // Create terrain material with color variation based on height
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x7d9654,
      vertexColors: false,
      side: THREE.DoubleSide // Make sure both sides are visible
    });
    
    // Add simple color variation based on height
    const colors: number[] = [];
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        const index = i * (segments + 1) + j;
        const height = this.heightMap[index];
        
        // Simple green with slight variation
        let r = 0.45, g = 0.6, b = 0.3; // Base green
        
        if (height > 5) {
          // Slightly higher - lighter green
          r = 0.5; g = 0.65; b = 0.35;
        } else if (height < -3) {
          // Lower areas - darker green
          r = 0.4; g = 0.55; b = 0.25;
        }
        
        colors.push(r, g, b);
      }
    }
    
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    material.vertexColors = true;
    
    this.terrain = new THREE.Mesh(geometry, material);
    this.terrain.rotation.x = -Math.PI / 2;
    this.terrain.receiveShadow = true;
    this.scene.add(this.terrain);
  }

  private simpleNoise(x: number, y: number): number {
    // Simple pseudo-random noise function
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return (n - Math.floor(n)) * 2 - 1; // Range -1 to 1
  }

  private createGrassTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d')!;
    
    // Base grass color - darker green
    context.fillStyle = '#4a6741';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add grass blade texture
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const height = Math.random() * 8 + 2;
      const width = Math.random() * 2 + 0.5;
      
      // Vary grass colors
      const greenVariation = Math.floor(Math.random() * 40);
      const r = 60 + Math.floor(Math.random() * 20);
      const g = 100 + greenVariation;
      const b = 50 + Math.floor(Math.random() * 15);
      
      context.strokeStyle = `rgb(${r}, ${g}, ${b})`;
      context.lineWidth = width;
      context.lineCap = 'round';
      
      // Draw grass blade
      context.beginPath();
      context.moveTo(x, y);
      const curve = (Math.random() - 0.5) * 4;
      context.quadraticCurveTo(x + curve, y - height/2, x + curve*2, y - height);
      context.stroke();
    }
    
    // Add some texture patches
    context.globalAlpha = 0.3;
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const radius = Math.random() * 30 + 10;
      
      // Darker patches
      const isDark = Math.random() > 0.5;
      if (isDark) {
        context.fillStyle = '#3a5531';
      } else {
        context.fillStyle = '#5a7551';
      }
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    // Add subtle noise
    context.globalAlpha = 0.1;
    for (let i = 0; i < 500; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const size = Math.random() * 3 + 1;
      
      context.fillStyle = Math.random() > 0.5 ? '#2a4521' : '#6a8561';
      context.fillRect(x, y, size, size);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(50, 50); // Tile the texture across the terrain
    texture.needsUpdate = true;
    
    return texture;
  }

  private smoothRoadPath(points: Vec3[]): Vec3[] {
    if (points.length < 3) return points;
    
    const smoothed: Vec3[] = [];
    
    // Always keep first point
    smoothed.push(points[0]);
    
    // Create smooth curves between points using Catmull-Rom spline
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];
      
      // Calculate segment length to determine curve resolution
      const segmentLength = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2)
      );
      
      // More points for longer segments, fewer for short ones
      const curvePoints = Math.max(3, Math.min(10, Math.floor(segmentLength / 8)));
      
      // Generate curve points between p1 and p2
      for (let t = 0; t <= 1; t += 1 / curvePoints) {
        if (t === 0 && i > 0) continue; // Skip first point except for very first segment
        
        // Catmull-Rom spline interpolation
        const tt = t * t;
        const ttt = tt * t;
        
        // Catmull-Rom basis functions
        const q0 = -ttt + 2 * tt - t;
        const q1 = 3 * ttt - 5 * tt + 2;
        const q2 = -3 * ttt + 4 * tt + t;
        const q3 = ttt - tt;
        
        const x = 0.5 * (p0.x * q0 + p1.x * q1 + p2.x * q2 + p3.x * q3);
        const z = 0.5 * (p0.z * q0 + p1.z * q1 + p2.z * q2 + p3.z * q3);
        
        // Get terrain height for the smoothed point
        const terrainHeight = this.getTerrainHeight(x, z);
        
        smoothed.push({
          x: x,
          y: terrainHeight + 1,
          z: z
        });
      }
    }
    
    // Always keep last point with exact position
    const lastPoint = points[points.length - 1];
    smoothed.push(lastPoint);
    
    return smoothed;
  }

  private getTerrainHeight(worldX: number, worldZ: number): number {
    if (!this.heightMap) return 0;
    
    // Convert world coordinates to terrain grid coordinates
    // Terrain is now in world space, so coordinates match directly
    const terrainX = (worldX / this.terrainSize + 0.5) * this.terrainSegments;
    const terrainZ = (worldZ / this.terrainSize + 0.5) * this.terrainSegments;
    
    // Clamp to terrain bounds
    const x = Math.max(0, Math.min(this.terrainSegments, terrainX));
    const z = Math.max(0, Math.min(this.terrainSegments, terrainZ));
    
    // Get integer coordinates
    const x1 = Math.floor(x);
    const z1 = Math.floor(z);
    const x2 = Math.min(this.terrainSegments, x1 + 1);
    const z2 = Math.min(this.terrainSegments, z1 + 1);
    
    // Get fractional parts for interpolation
    const fx = x - x1;
    const fz = z - z1;
    
    // Sample height map at four corners
    // Note: heightMap is indexed as [i * (segments + 1) + j] where i=X, j=Z
    const h11 = this.heightMap[x1 * (this.terrainSegments + 1) + z1] || 0;
    const h21 = this.heightMap[x2 * (this.terrainSegments + 1) + z1] || 0;
    const h12 = this.heightMap[x1 * (this.terrainSegments + 1) + z2] || 0;
    const h22 = this.heightMap[x2 * (this.terrainSegments + 1) + z2] || 0;
    
    // Bilinear interpolation
    const h1 = h11 * (1 - fx) + h21 * fx;
    const h2 = h12 * (1 - fx) + h22 * fx;
    const height = h1 * (1 - fz) + h2 * fz;
    
    return height;
  }


  private setupCamera(): void {
    this.camera.position.set(400, 300, 400);
    this.camera.lookAt(0, 0, 0);
  }

  private setupDrivingUI(): void {
    // Create control panel
    const controlPanel = document.createElement('div');
    controlPanel.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 1000;
      font-family: Arial, sans-serif;
    `;
    
    // Drive button
    const driveButton = document.createElement('button');
    driveButton.textContent = 'Drive';
    driveButton.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      padding: 10px 30px;
      border-radius: 5px;
      font-size: 16px;
      cursor: pointer;
      margin-bottom: 15px;
      width: 100%;
      font-weight: bold;
    `;
    
    driveButton.addEventListener('click', () => this.toggleDriving());
    
    // Speed control
    const speedContainer = document.createElement('div');
    speedContainer.style.cssText = 'margin-top: 10px;';
    
    const speedLabel = document.createElement('label');
    speedLabel.textContent = 'Speed: ';
    speedLabel.style.cssText = 'display: block; margin-bottom: 5px; font-size: 14px;';
    
    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '5';
    speedSlider.max = '80';
    speedSlider.value = '20';
    speedSlider.style.cssText = 'width: 100%; margin-bottom: 5px;';
    
    const speedValue = document.createElement('span');
    speedValue.textContent = '20 km/h';
    speedValue.style.cssText = 'display: block; text-align: center; font-size: 12px; color: #666;';
    
    speedSlider.addEventListener('input', (e) => {
      const speed = parseInt((e.target as HTMLInputElement).value);
      this.drivingState.targetSpeed = speed;
      speedValue.textContent = `${speed} km/h`;
    });
    
    speedContainer.appendChild(speedLabel);
    speedContainer.appendChild(speedSlider);
    speedContainer.appendChild(speedValue);
    
    controlPanel.appendChild(driveButton);
    controlPanel.appendChild(speedContainer);
    document.body.appendChild(controlPanel);
    
    // Create notification area
    this.notificationElement = document.createElement('div');
    this.notificationElement.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px 30px;
      border-radius: 25px;
      font-size: 16px;
      display: none;
      z-index: 1001;
      font-family: Arial, sans-serif;
    `;
    document.body.appendChild(this.notificationElement);
  }

  private setupControls(): void {
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };

    // Mouse controls
    this.renderer.domElement.addEventListener('mousedown', (e) => {
      isDragging = true;
      previousMouse = { x: e.clientX, y: e.clientY };
    });

    this.renderer.domElement.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMouse.x;
        const deltaY = e.clientY - previousMouse.y;
        
        const spherical = new THREE.Spherical();
        spherical.setFromVector3(this.camera.position);
        spherical.theta -= deltaX * 0.01;
        spherical.phi += deltaY * 0.01;
        spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
        
        this.camera.position.setFromSpherical(spherical);
        this.camera.lookAt(0, 0, 0);
        
        previousMouse = { x: e.clientX, y: e.clientY };
      }
    });

    this.renderer.domElement.addEventListener('mouseup', () => {
      isDragging = false;
    });

    // Wheel zoom
    this.renderer.domElement.addEventListener('wheel', (e) => {
      const direction = this.camera.position.clone().normalize();
      if (e.deltaY > 0) {
        this.camera.position.add(direction.multiplyScalar(10));
      } else {
        this.camera.position.sub(direction.multiplyScalar(10));
      }
      e.preventDefault();
    });

    // Keyboard controls
    document.addEventListener('keydown', (e) => {
      const moveSpeed = 10;
      
      switch (e.key.toLowerCase()) {
        case 'w':
          this.camera.position.z -= moveSpeed;
          break;
        case 's':
          this.camera.position.z += moveSpeed;
          break;
        case 'a':
          this.camera.position.x -= moveSpeed;
          break;
        case 'd':
          this.camera.position.x += moveSpeed;
          break;
      }
      
      this.camera.lookAt(0, 0, 0);
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }


  private async loadHaldenRoads(): Promise<void> {
    try {
      console.log('🌍 Loading Halden road network...');
      
      const osmData = await this.fetchOSMData();
      console.log(`📊 Loaded ${osmData.ways.length} ways, ${osmData.nodes.size} nodes`);
      
      this.renderRoads(osmData);
      
      console.log('✅ Roads loaded and rendered');
    } catch (error) {
      console.error('❌ Failed to load roads:', error);
    }
  }

  private async fetchOSMData(): Promise<OSMData> {
    // Small 1km x 1km area in central Halden
    const query = `
      [out:json][timeout:25];
      (
        way["highway"]["highway"!="footway"]["highway"!="cycleway"]["highway"!="path"]["highway"!="steps"]["highway"!="pedestrian"]
        (59.124,11.387,59.132,11.397);
      );
      out geom;
    `;
    
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: query
    });
    
    const data = await response.json();
    
    const nodes = new Map<string, OSMNode>();
    const ways: OSMWay[] = [];
    
    for (const element of data.elements) {
      if (element.type === 'way') {
        // Convert geometry to nodes
        for (let i = 0; i < element.geometry.length; i++) {
          const point = element.geometry[i];
          const nodeId = `${element.id}_${i}`;
          nodes.set(nodeId, {
            id: nodeId,
            lat: point.lat,
            lon: point.lon
          });
        }
        
        ways.push({
          id: element.id.toString(),
          nodes: element.geometry.map((_: any, i: number) => `${element.id}_${i}`),
          tags: element.tags || {}
        });
      }
    }
    
    return { nodes, ways };
  }

  private renderRoads(osmData: OSMData): void {
    console.log('🛣️ Rendering roads as individual clean lines...');
    
    // Clear existing roads
    this.scene.remove(this.roads);
    this.roads = new THREE.Group();
    
    // Track intersections and road endpoints
    const roadNetwork = this.analyzeRoadNetwork(osmData);
    
    // Create shared materials for better performance
    const centerMaterial = new THREE.LineBasicMaterial({ 
      color: 0xffffff,
      transparent: true,
      opacity: 0.8
    });
    
    const sideMaterial = new THREE.LineBasicMaterial({ 
      color: 0xcccccc,
      transparent: true,
      opacity: 0.6
    });
    
    for (const way of osmData.ways) {
      const points: Vec3[] = [];
      
      // Convert OSM coordinates to world coordinates
      const rawPoints: Vec3[] = [];
      for (const nodeId of way.nodes) {
        const node = osmData.nodes.get(nodeId);
        if (!node) continue;
        
        // Convert lat/lon to world coordinates for the 1km area
        // Center: 59.128, 11.392 (middle of our OSM bounds)
        const worldX = (node.lon - 11.392) * 100000; // Scale longitude 
        const worldZ = (node.lat - 59.128) * 111000; // Scale latitude
        
        // Get terrain height and place roads slightly above it
        const terrainHeight = this.getTerrainHeight(worldX, worldZ);
        rawPoints.push({ x: worldX, y: terrainHeight + 1, z: worldZ });
      }
      
      // Smooth the OSM path to eliminate sharp angles
      const smoothedPoints = this.smoothRoadPath(rawPoints);
      points.push(...smoothedPoints);
      
      if (points.length < 2) continue;
      
      // Store road segment for driving
      this.roadSegments.push({
        points: smoothedPoints,
        name: way.tags.name || `Road ${way.id}`,
        wayId: way.id
      });
      
      // Create individual road lines
      const roadLines = this.createRoadLines(points, way.tags, centerMaterial, sideMaterial);
      this.roads.add(roadLines);
    }
    
    // Add intersection and metadata markers
    this.addRoadMarkers(osmData, roadNetwork);
    
    this.scene.add(this.roads);
    console.log(`✅ Rendered ${osmData.ways.length} roads as individual line groups`);
  }

  private createRoadLines(points: Vec3[], tags: Record<string, string>, centerMaterial: THREE.LineBasicMaterial, sideMaterial: THREE.LineBasicMaterial): THREE.Group {
    const roadGroup = new THREE.Group();
    
    // Determine road width based on type (half-width from center to edge)
    let halfWidth = 3; // Default 6m total width
    const highway = tags.highway || '';
    if (highway.includes('motorway') || highway.includes('trunk')) halfWidth = 6; // 12m total
    else if (highway.includes('primary')) halfWidth = 5; // 10m total
    else if (highway.includes('secondary')) halfWidth = 4; // 8m total
    else if (highway.includes('residential')) halfWidth = 3; // 6m total
    
    // Calculate left and right side points
    const leftPoints: THREE.Vector3[] = [];
    const rightPoints: THREE.Vector3[] = [];
    
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      
      // Calculate direction for perpendicular offset
      let direction: THREE.Vector3;
      if (i === 0 && points.length > 1) {
        direction = new THREE.Vector3(points[1].x - point.x, 0, points[1].z - point.z).normalize();
      } else if (i === points.length - 1) {
        direction = new THREE.Vector3(point.x - points[i-1].x, 0, point.z - points[i-1].z).normalize();
      } else {
        const prev = new THREE.Vector3(point.x - points[i-1].x, 0, point.z - points[i-1].z).normalize();
        const next = new THREE.Vector3(points[i+1].x - point.x, 0, points[i+1].z - point.z).normalize();
        direction = prev.add(next).normalize();
      }
      
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(halfWidth);
      
      // Get terrain height for each side point
      const leftX = point.x - perpendicular.x;
      const leftZ = point.z - perpendicular.z;
      const rightX = point.x + perpendicular.x;
      const rightZ = point.z + perpendicular.z;
      
      const leftTerrainHeight = this.getTerrainHeight(leftX, leftZ);
      const rightTerrainHeight = this.getTerrainHeight(rightX, rightZ);
      
      // Store left and right points following terrain
      leftPoints.push(new THREE.Vector3(
        leftX, 
        leftTerrainHeight + 2, // Higher than wireframe (at 0.5)
        leftZ
      ));
      
      rightPoints.push(new THREE.Vector3(
        rightX, 
        rightTerrainHeight + 2, // Higher than wireframe (at 0.5)
        rightZ
      ));
    }
    
    // Create road surface mesh between left and right points
    const roadSurface = this.createRoadSurface(leftPoints, rightPoints, highway);
    roadGroup.add(roadSurface);
    
    // Create center line
    const centerGeometry = new THREE.BufferGeometry();
    const centerVertices: number[] = [];
    for (const point of points) {
      centerVertices.push(point.x, point.y, point.z); // Same level as road surface
    }
    centerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(centerVertices, 3));
    const centerLine = new THREE.Line(centerGeometry, centerMaterial);
    roadGroup.add(centerLine);
    
    // Create left side line
    const leftGeometry = new THREE.BufferGeometry();
    const leftVertices: number[] = [];
    for (const point of leftPoints) {
      leftVertices.push(point.x, point.y, point.z); // Same level as road surface
    }
    leftGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leftVertices, 3));
    const leftLine = new THREE.Line(leftGeometry, sideMaterial);
    roadGroup.add(leftLine);
    
    // Create right side line
    const rightGeometry = new THREE.BufferGeometry();
    const rightVertices: number[] = [];
    for (const point of rightPoints) {
      rightVertices.push(point.x, point.y, point.z); // Same level as road surface
    }
    rightGeometry.setAttribute('position', new THREE.Float32BufferAttribute(rightVertices, 3));
    const rightLine = new THREE.Line(rightGeometry, sideMaterial);
    roadGroup.add(rightLine);
    
    return roadGroup;
  }

  private createRoadSurface(leftPoints: THREE.Vector3[], rightPoints: THREE.Vector3[], highway: string): THREE.Mesh {
    const vertices: number[] = [];
    const indices: number[] = [];
    
    // Create triangle strip between left and right points
    for (let i = 0; i < leftPoints.length; i++) {
      // Add left point
      vertices.push(leftPoints[i].x, leftPoints[i].y, leftPoints[i].z);
      // Add right point  
      vertices.push(rightPoints[i].x, rightPoints[i].y, rightPoints[i].z);
      
      // Create triangles for this segment (except for the last point)
      if (i < leftPoints.length - 1) {
        const baseIndex = i * 2;
        
        // First triangle: left[i], right[i], left[i+1]
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
        
        // Second triangle: right[i], right[i+1], left[i+1]  
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    // Choose road surface color based on type
    let roadColor = 0x444444; // Default dark gray
    if (highway.includes('motorway') || highway.includes('trunk')) {
      roadColor = 0x333333; // Darker for major roads
    } else if (highway.includes('primary')) {
      roadColor = 0x3a3a3a; 
    } else if (highway.includes('secondary')) {
      roadColor = 0x404040;
    } else if (highway.includes('residential')) {
      roadColor = 0x4a4a4a; // Lighter for residential
    }
    
    const material = new THREE.MeshLambertMaterial({ 
      color: roadColor,
      transparent: true,
      opacity: 0.9
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    
    return mesh;
  }





  private analyzeRoadNetwork(osmData: OSMData): Map<string, number> {
    // Count how many roads use each node to identify intersections
    const nodeUsage = new Map<string, number>();
    
    for (const way of osmData.ways) {
      for (const nodeId of way.nodes) {
        nodeUsage.set(nodeId, (nodeUsage.get(nodeId) || 0) + 1);
      }
    }
    
    return nodeUsage;
  }

  private addRoadMarkers(osmData: OSMData, roadNetwork: Map<string, number>): void {
    console.log('🎯 Adding road markers...');
    
    const markersGroup = new THREE.Group();
    
    for (const way of osmData.ways) {
      const tags = way.tags;
      const nodes = way.nodes;
      
      if (nodes.length < 2) continue;
      
      // Get road endpoints
      const startNodeId = nodes[0];
      const endNodeId = nodes[nodes.length - 1];
      const startNode = osmData.nodes.get(startNodeId);
      const endNode = osmData.nodes.get(endNodeId);
      
      if (!startNode || !endNode) continue;
      
      // Convert to world coordinates
      const startX = (startNode.lon - 11.392) * 100000;
      const startZ = (startNode.lat - 59.128) * 111000;
      const endX = (endNode.lon - 11.392) * 100000;
      const endZ = (endNode.lat - 59.128) * 111000;
      
      // Get terrain heights for markers
      const startHeight = this.getTerrainHeight(startX, startZ);
      const endHeight = this.getTerrainHeight(endX, endZ);
      
      // Check if endpoints are intersections
      const startIsIntersection = (roadNetwork.get(startNodeId) || 0) > 1;
      const endIsIntersection = (roadNetwork.get(endNodeId) || 0) > 1;
      
      // Add intersection markers (red spheres)
      if (startIsIntersection) {
        const marker = this.createMarker(startX, startZ, startHeight, 'intersection');
        markersGroup.add(marker);
      }
      if (endIsIntersection) {
        const marker = this.createMarker(endX, endZ, endHeight, 'intersection');
        markersGroup.add(marker);
      }
      
      // Add road type markers based on highway tag
      const highway = tags.highway || '';
      let markerType = 'residential';
      
      if (highway.includes('motorway')) markerType = 'motorway';
      else if (highway.includes('trunk')) markerType = 'trunk';
      else if (highway.includes('primary')) markerType = 'primary';
      else if (highway.includes('secondary')) markerType = 'secondary';
      
      // Add road type marker at midpoint
      if (nodes.length > 2) {
        const midIndex = Math.floor(nodes.length / 2);
        const midNode = osmData.nodes.get(nodes[midIndex]);
        if (midNode) {
          const midX = (midNode.lon - 11.392) * 100000;
          const midZ = (midNode.lat - 59.128) * 111000;
          const midHeight = this.getTerrainHeight(midX, midZ);
          const typeMarker = this.createMarker(midX, midZ, midHeight, markerType);
          markersGroup.add(typeMarker);
        }
      }
      
      // Add name markers for named roads
      if (tags.name) {
        const midIndex = Math.floor(nodes.length / 2);
        const midNode = osmData.nodes.get(nodes[midIndex]);
        if (midNode) {
          const midX = (midNode.lon - 11.392) * 100000;
          const midZ = (midNode.lat - 59.128) * 111000;
          const midHeight = this.getTerrainHeight(midX, midZ);
          const nameMarker = this.createNameMarker(midX, midZ, midHeight, tags.name);
          markersGroup.add(nameMarker);
        }
      }
      
      // Add endpoint markers (blue spheres) for non-intersections
      if (!startIsIntersection) {
        const marker = this.createMarker(startX, startZ, startHeight, 'endpoint');
        markersGroup.add(marker);
      }
      if (!endIsIntersection) {
        const marker = this.createMarker(endX, endZ, endHeight, 'endpoint');
        markersGroup.add(marker);
      }
    }
    
    this.roads.add(markersGroup);
    console.log('✅ Road markers added');
  }

  private createMarker(x: number, z: number, terrainHeight: number, type: string): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(1.5, 8, 6);
    let color = 0x888888;
    let size = 1.5;
    
    switch (type) {
      case 'intersection':
        color = 0xff0000; // Red for intersections
        size = 2.5;
        break;
      case 'endpoint':
        color = 0x0080ff; // Blue for road endpoints
        size = 1.5;
        break;
      case 'motorway':
        color = 0xff8000; // Orange for motorways
        size = 2.0;
        break;
      case 'trunk':
        color = 0xffff00; // Yellow for trunk roads
        size = 1.8;
        break;
      case 'primary':
        color = 0x00ff00; // Green for primary roads
        size = 1.6;
        break;
      case 'secondary':
        color = 0x8000ff; // Purple for secondary roads
        size = 1.4;
        break;
      case 'residential':
        color = 0xffffff; // White for residential
        size = 1.0;
        break;
    }
    
    const adjustedGeometry = new THREE.SphereGeometry(size, 8, 6);
    const material = new THREE.MeshBasicMaterial({ color });
    const marker = new THREE.Mesh(adjustedGeometry, material);
    marker.position.set(x, terrainHeight + 5, z);
    
    return marker;
  }

  private createNameMarker(x: number, z: number, terrainHeight: number, name: string): THREE.Group {
    const group = new THREE.Group();
    
    // Create text sprite that always faces camera
    const sprite = this.createTextSprite(name, x, terrainHeight + 15, z);
    this.roadLabels.push(sprite);
    group.add(sprite);
    
    return group;
  }

  private createTextSprite(text: string, x: number, y: number, z: number): THREE.Sprite {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    
    // Set canvas size
    canvas.width = 512;
    canvas.height = 128;
    
    // Configure background with rounded corners - no border
    context.fillStyle = 'rgba(255, 255, 255, 0.9)';
    const padding = 20;
    const radius = 15;
    
    // Draw rounded rectangle background
    context.beginPath();
    context.moveTo(radius, 0);
    context.lineTo(canvas.width - radius, 0);
    context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    context.lineTo(canvas.width, canvas.height - radius);
    context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    context.lineTo(radius, canvas.height);
    context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    context.lineTo(0, radius);
    context.quadraticCurveTo(0, 0, radius, 0);
    context.closePath();
    context.fill();
    
    // Configure text style
    context.font = 'bold 36px Arial';
    context.fillStyle = '#1a1a1a';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw text
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create sprite material
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.9
    });
    
    // Create sprite
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(x, y, z);
    
    // Scale sprite (adjust as needed)
    const scale = 25;
    sprite.scale.set(scale * (canvas.width / canvas.height), scale, 1);
    
    return sprite;
  }





  private toggleDriving(): void {
    if (this.drivingState.isDriving) {
      this.stopDriving();
    } else {
      this.startDriving();
    }
  }

  private startDriving(): void {
    if (this.roadSegments.length === 0) {
      console.warn('No roads available for driving');
      return;
    }
    
    console.log('🚗 Starting driving mode, available segments:', this.roadSegments.length);
    
    // Find nearest road segment
    const camPos = this.camera.position;
    let nearestSegment: RoadSegment | null = null;
    let nearestDistance = Infinity;
    let nearestPointIndex = 0;
    
    for (const segment of this.roadSegments) {
      for (let i = 0; i < segment.points.length - 1; i++) { // Skip last point to have look-ahead
        const point = segment.points[i];
        const dist = Math.sqrt(
          Math.pow(point.x - camPos.x, 2) +
          Math.pow(point.z - camPos.z, 2)
        );
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestSegment = segment;
          nearestPointIndex = i;
        }
      }
    }
    
    if (!nearestSegment) {
      console.warn('Could not find nearest segment');
      return;
    }
    
    console.log(`📍 Found nearest road: ${nearestSegment.name} at index ${nearestPointIndex}, distance: ${nearestDistance.toFixed(2)}`);
    
    // Set driving state
    this.drivingState.isDriving = true;
    this.drivingState.currentSegment = nearestSegment;
    this.drivingState.currentPointIndex = nearestPointIndex;
    const startPoint = nearestSegment.points[nearestPointIndex];
    // Road is at terrain + 1, so driver eye should be at terrain + 3 (2m above road)
    this.drivingState.currentPosition = { 
      x: startPoint.x, 
      y: this.getTerrainHeight(startPoint.x, startPoint.z) + 3,
      z: startPoint.z 
    };
    this.drivingState.speed = 0;
    
    // Immediately position camera at road
    this.camera.position.set(
      this.drivingState.currentPosition.x,
      this.drivingState.currentPosition.y,
      this.drivingState.currentPosition.z
    );
    
    // Look at next point
    if (nearestPointIndex < nearestSegment.points.length - 1) {
      const lookPoint = nearestSegment.points[nearestPointIndex + 1];
      this.camera.lookAt(
        lookPoint.x,
        this.getTerrainHeight(lookPoint.x, lookPoint.z) + 2.5, // Look at road level ahead
        lookPoint.z
      );
    }
    
    console.log(`🎥 Camera positioned at (${this.drivingState.currentPosition.x.toFixed(1)}, ${this.drivingState.currentPosition.y.toFixed(1)}, ${this.drivingState.currentPosition.z.toFixed(1)})`);
    
    // Update button
    const button = document.querySelector('button') as HTMLButtonElement;
    if (button) {
      button.textContent = 'Stop';
      button.style.background = '#f44336';
    }
    
    this.showNotification(`Starting drive on ${nearestSegment.name}`);
  }

  private stopDriving(): void {
    this.drivingState.isDriving = false;
    this.drivingState.speed = 0;
    
    // Update button
    const button = document.querySelector('button') as HTMLButtonElement;
    if (button) {
      button.textContent = 'Drive';
      button.style.background = '#4CAF50';
    }
    
    this.hideNotification();
  }

  private showNotification(message: string): void {
    if (this.notificationElement) {
      this.notificationElement.textContent = message;
      this.notificationElement.style.display = 'block';
      
      // Auto-hide after 3 seconds
      setTimeout(() => this.hideNotification(), 3000);
    }
  }

  private hideNotification(): void {
    if (this.notificationElement) {
      this.notificationElement.style.display = 'none';
    }
  }

  private updateDriving(deltaTime: number): void {
    if (!this.drivingState.isDriving || !this.drivingState.currentSegment) return;
    
    // Skip invalid delta times
    if (deltaTime <= 0 || deltaTime > 1) return;
    
    // Accelerate/decelerate towards target speed
    const acceleration = 20; // km/h per second
    if (this.drivingState.speed < this.drivingState.targetSpeed) {
      this.drivingState.speed = Math.min(
        this.drivingState.targetSpeed,
        this.drivingState.speed + acceleration * deltaTime
      );
    } else {
      this.drivingState.speed = Math.max(
        this.drivingState.targetSpeed,
        this.drivingState.speed - acceleration * deltaTime
      );
    }
    
    // Convert speed to world units per second (assuming 1 world unit = 1 meter)
    const speedMPS = this.drivingState.speed / 3.6; // km/h to m/s
    const distanceToMove = speedMPS * deltaTime;
    
    const segment = this.drivingState.currentSegment;
    const points = segment.points;
    
    // Move along current segment
    while (this.drivingState.currentPointIndex < points.length - 1 && distanceToMove > 0) {
      const currentPoint = points[this.drivingState.currentPointIndex];
      const nextPoint = points[this.drivingState.currentPointIndex + 1];
      
      // Calculate remaining distance in current segment
      const dx = nextPoint.x - this.drivingState.currentPosition.x;
      const dz = nextPoint.z - this.drivingState.currentPosition.z;
      const segmentRemainingLength = Math.sqrt(dx * dx + dz * dz);
      
      if (segmentRemainingLength < 0.01) {
        // Very close to next point, just move to it
        this.drivingState.currentPointIndex++;
        if (this.drivingState.currentPointIndex < points.length) {
          const newPoint = points[this.drivingState.currentPointIndex];
          this.drivingState.currentPosition.x = newPoint.x;
          this.drivingState.currentPosition.z = newPoint.z;
        }
        continue;
      }
      
      // Move along the segment
      const moveDistance = Math.min(distanceToMove, segmentRemainingLength);
      const moveRatio = moveDistance / segmentRemainingLength;
      
      // Update position
      this.drivingState.currentPosition.x += dx * moveRatio;
      this.drivingState.currentPosition.z += dz * moveRatio;
      // Road surface is at terrain + 2, driver eye at terrain + 3.5 (1.5m above road)
      this.drivingState.currentPosition.y = this.getTerrainHeight(
        this.drivingState.currentPosition.x,
        this.drivingState.currentPosition.z
      ) + 3.5; // Driver eye height above road
      
      // Update camera position
      this.camera.position.set(
        this.drivingState.currentPosition.x,
        this.drivingState.currentPosition.y,
        this.drivingState.currentPosition.z
      );
      
      // Look ahead for smooth turning
      let lookAheadIndex = Math.min(this.drivingState.currentPointIndex + 3, points.length - 1);
      const lookAtPoint = points[lookAheadIndex];
      const lookY = this.getTerrainHeight(lookAtPoint.x, lookAtPoint.z) + 3; // Look at road level ahead
      this.camera.lookAt(lookAtPoint.x, lookY, lookAtPoint.z);
      
      // Check if we reached the next point
      if (moveDistance >= segmentRemainingLength - 0.01) {
        this.drivingState.currentPointIndex++;
      }
      
      break; // Only process one segment per frame for smooth movement
    }
    
    // Check if reached end of segment
    if (this.drivingState.currentPointIndex >= points.length - 1) {
      this.handleSegmentEnd();
    }
  }

  private handleSegmentEnd(): void {
    // Check for intersections (other segments that share endpoints)
    const currentSegment = this.drivingState.currentSegment!;
    const lastPoint = currentSegment.points[currentSegment.points.length - 1];
    
    const connectedSegments: RoadSegment[] = [];
    for (const segment of this.roadSegments) {
      if (segment === currentSegment) continue;
      
      // Check if this segment connects at either end
      const firstPoint = segment.points[0];
      const lastSegPoint = segment.points[segment.points.length - 1];
      
      const distToFirst = Math.sqrt(
        Math.pow(firstPoint.x - lastPoint.x, 2) +
        Math.pow(firstPoint.z - lastPoint.z, 2)
      );
      
      const distToLast = Math.sqrt(
        Math.pow(lastSegPoint.x - lastPoint.x, 2) +
        Math.pow(lastSegPoint.z - lastPoint.z, 2)
      );
      
      if (distToFirst < 5 || distToLast < 5) {
        connectedSegments.push(segment);
      }
    }
    
    if (connectedSegments.length > 0) {
      // Choose random connected segment
      const nextSegment = connectedSegments[Math.floor(Math.random() * connectedSegments.length)];
      
      // Determine if we need to reverse the segment
      const firstPoint = nextSegment.points[0];
      const distToFirst = Math.sqrt(
        Math.pow(firstPoint.x - lastPoint.x, 2) +
        Math.pow(firstPoint.z - lastPoint.z, 2)
      );
      
      if (distToFirst < 5) {
        // Start from beginning
        this.drivingState.currentSegment = nextSegment;
        this.drivingState.currentPointIndex = 0;
        this.showNotification(`Turning onto ${nextSegment.name}`);
      } else {
        // Start from end (reverse)
        this.drivingState.currentSegment = {
          ...nextSegment,
          points: [...nextSegment.points].reverse()
        };
        this.drivingState.currentPointIndex = 0;
        this.showNotification(`Turning onto ${nextSegment.name}`);
      }
    } else {
      // Dead end - turn around
      this.drivingState.currentSegment = {
        ...currentSegment,
        points: [...currentSegment.points].reverse()
      };
      this.drivingState.currentPointIndex = 0;
      this.showNotification(`Turning around on ${currentSegment.name}`);
    }
  }

  private lastAnimationTime = 0;
  
  private animate(): void {
    requestAnimationFrame((time) => {
      // Initialize time on first frame
      if (this.lastAnimationTime === 0) {
        this.lastAnimationTime = time;
      }
      
      const deltaTime = Math.min((time - this.lastAnimationTime) / 1000, 0.1); // Cap at 100ms
      this.lastAnimationTime = time;
      
      // Update driving if active
      if (this.drivingState.isDriving && deltaTime > 0) {
        this.updateDriving(deltaTime);
      }
      
      // Update road label sprites to face camera
      for (const sprite of this.roadLabels) {
        sprite.lookAt(this.camera.position);
      }
      
      this.renderer.render(this.scene, this.camera);
      this.animate();
    });
  }

  public start(): void {
    console.log('🚀 Starting Kinopticon');
  }
}

// Initialize and start the application
const app = new Kinopticon();
app.start();

// Make app globally available for debugging
(window as any).kinopticon = app;