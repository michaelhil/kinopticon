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

class Kinopticon {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private terrain?: THREE.Mesh;
  private roads: THREE.Group = new THREE.Group();
  private bumpiness: number = 0.3;
  private heightMap: Float32Array | null = null;
  private terrainSize: number = 2000;
  private terrainSegments: number = 100;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    
    this.init();
  }

  private init(): void {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x87CEEB, 1); // Light sky blue
    document.body.appendChild(this.renderer.domElement);

    // Setup scene
    this.setupLighting();
    this.createFlatGround();
    this.setupCamera();
    this.setupControls();

    // Load roads - focus on proper road rendering
    this.loadHaldenRoads();

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
    
    // Make it very visible with a solid color
    const material = new THREE.MeshLambertMaterial({ 
      color: 0x4a7c59, // Forest green
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
    
    // Create subtle bright green wireframe material
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x6fa86f, // Slightly brighter green
      wireframe: true,
      transparent: true,
      opacity: 0.3,
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
    const gridHelper = new THREE.GridHelper(terrainSize, 20, 0x7faf7f, 0x7faf7f);
    gridHelper.position.y = 0.2; // Just above terrain, below wireframe and roads
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.15; // Even more subtle
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
      for (const nodeId of way.nodes) {
        const node = osmData.nodes.get(nodeId);
        if (!node) continue;
        
        // Convert lat/lon to world coordinates for the 1km area
        // Center: 59.128, 11.392 (middle of our OSM bounds)
        const worldX = (node.lon - 11.392) * 100000; // Scale longitude 
        const worldZ = (node.lat - 59.128) * 111000; // Scale latitude
        
        // Get terrain height and place roads slightly above it
        const terrainHeight = this.getTerrainHeight(worldX, worldZ);
        // Debug: Log first few road points
        if (points.length < 3) {
          console.log(`🛣️ Road point at (${worldX.toFixed(1)}, ${worldZ.toFixed(1)}) → height ${terrainHeight.toFixed(1)}`);
        }
        points.push({ x: worldX, y: terrainHeight + 1, z: worldZ });
      }
      
      if (points.length < 2) continue;
      
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
      centerVertices.push(point.x, point.y + 2.5, point.z); // Above road surface
    }
    centerGeometry.setAttribute('position', new THREE.Float32BufferAttribute(centerVertices, 3));
    const centerLine = new THREE.Line(centerGeometry, centerMaterial);
    roadGroup.add(centerLine);
    
    // Create left side line
    const leftGeometry = new THREE.BufferGeometry();
    const leftVertices: number[] = [];
    for (const point of leftPoints) {
      leftVertices.push(point.x, point.y + 0.5, point.z); // Above road surface
    }
    leftGeometry.setAttribute('position', new THREE.Float32BufferAttribute(leftVertices, 3));
    const leftLine = new THREE.Line(leftGeometry, sideMaterial);
    roadGroup.add(leftLine);
    
    // Create right side line
    const rightGeometry = new THREE.BufferGeometry();
    const rightVertices: number[] = [];
    for (const point of rightPoints) {
      rightVertices.push(point.x, point.y + 0.5, point.z); // Above road surface
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
    
    // Create a small cylinder as base
    const baseGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1);
    const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(x, terrainHeight + 1, z);
    group.add(base);
    
    // Note: In a real implementation, you'd add 3D text here
    // For now, we'll just use a distinct marker
    const topGeometry = new THREE.SphereGeometry(0.3, 6, 4);
    const topMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(x, terrainHeight + 2, z);
    group.add(top);
    
    return group;
  }





  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
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