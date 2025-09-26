// Road graph system for proper connectivity
import { RoadPath, RoadNetwork, Vector3, TerrainData } from './types.ts';
import { OSMData, OSMNode, OSMWay } from './osm.ts';

export interface RoadNode {
  id: string;
  position: Vector3;
  connectedRoads: string[]; // IDs of connected road segments
  osmNodeId?: number;
}

export interface RoadSegment {
  id: string;
  startNodeId: string;
  endNodeId: string;
  points: Vector3[];
  width: number;
  length: number;
  name?: string;
  highway?: string;
  osmWayId?: number;
}

export interface ConnectedRoadNetwork {
  nodes: Map<string, RoadNode>;
  segments: Map<string, RoadSegment>;
  nodeIndex: Map<string, RoadNode>; // Spatial index for fast lookups
}

export const createConnectedRoadNetwork = (
  osmData: OSMData,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  terrain: TerrainData
): ConnectedRoadNetwork => {
  const nodes = new Map<string, RoadNode>();
  const segments = new Map<string, RoadSegment>();
  const nodeIndex = new Map<string, RoadNode>();
  
  console.log('🔗 Creating connected road network...');
  
  // Step 1: Create nodes from OSM nodes that are part of roads
  const roadNodeIds = new Set<number>();
  osmData.ways.forEach(way => {
    if (isRoadWay(way)) {
      way.nodes.forEach(nodeId => roadNodeIds.add(nodeId));
    }
  });
  
  roadNodeIds.forEach(osmNodeId => {
    const osmNode = osmData.nodes.get(osmNodeId);
    if (!osmNode) return;
    
    const worldPos = latLonToWorld(osmNode.lat, osmNode.lon, bounds, terrain.worldSize);
    const terrainHeight = sampleTerrainHeight(terrain.heightmap, worldPos.x, worldPos.z, terrain.worldSize);
    
    const roadNode: RoadNode = {
      id: `node-${osmNodeId}`,
      position: {
        x: worldPos.x,
        y: terrainHeight + 3,
        z: worldPos.z
      },
      connectedRoads: [],
      osmNodeId
    };
    
    nodes.set(roadNode.id, roadNode);
    
    // Add to spatial index (rounded to nearest unit for fast lookup)
    const indexKey = `${Math.round(worldPos.x)},${Math.round(worldPos.z)}`;
    nodeIndex.set(indexKey, roadNode);
  });
  
  console.log(`📍 Created ${nodes.size} road nodes`);
  
  // Debug: Show sample node positions
  const sampleNodes = Array.from(nodes.values()).slice(0, 3);
  console.log('📍 Sample node positions:', sampleNodes.map(n => ({ 
    id: n.id, 
    pos: `(${n.position.x.toFixed(1)}, ${n.position.z.toFixed(1)})` 
  })));
  
  // Step 2: Create road segments from OSM ways
  let segmentCount = 0;
  
  osmData.ways.forEach(way => {
    if (!isRoadWay(way) || way.nodes.length < 2) return;
    
    // Create segments between consecutive nodes
    for (let i = 0; i < way.nodes.length - 1; i++) {
      const startOsmNodeId = way.nodes[i];
      const endOsmNodeId = way.nodes[i + 1];
      
      const startNodeId = `node-${startOsmNodeId}`;
      const endNodeId = `node-${endOsmNodeId}`;
      
      const startNode = nodes.get(startNodeId);
      const endNode = nodes.get(endNodeId);
      
      if (!startNode || !endNode) continue;
      
      const segmentId = `segment-${way.id}-${i}`;
      
      // Create road segment with interpolated points for smooth curves
      const points = interpolateRoadSegment(startNode.position, endNode.position, 5);
      const length = calculatePathLength(points);
      
      const segment: RoadSegment = {
        id: segmentId,
        startNodeId,
        endNodeId,
        points,
        width: getRoadWidthFromTags(way.tags),
        length: Math.max(length, 1), // Ensure minimum length of 1 meter
        name: way.tags?.name || way.tags?.['name:en'],
        highway: way.tags?.highway,
        osmWayId: way.id
      };
      
      segments.set(segmentId, segment);
      
      // Update node connections
      startNode.connectedRoads.push(segmentId);
      endNode.connectedRoads.push(segmentId);
      
      segmentCount++;
    }
  });
  
  console.log(`🛣️ Created ${segmentCount} connected road segments`);
  console.log(`🔗 Network connectivity: ${Array.from(nodes.values()).reduce((sum, node) => sum + node.connectedRoads.length, 0)} total connections`);
  
  return { nodes, segments, nodeIndex };
};

export const findConnectedRoads = (
  currentSegmentId: string,
  currentNodeId: string,
  network: ConnectedRoadNetwork
): RoadSegment[] => {
  const currentNode = network.nodes.get(currentNodeId);
  if (!currentNode) return [];
  
  return currentNode.connectedRoads
    .filter(segmentId => segmentId !== currentSegmentId) // Exclude current road
    .map(segmentId => network.segments.get(segmentId))
    .filter(segment => segment !== undefined) as RoadSegment[];
};

export const findNearestNetworkNode = (
  position: Vector3,
  network: ConnectedRoadNetwork,
  maxDistance: number = 50
): RoadNode | null => {
  let nearestNode: RoadNode | null = null;
  let minDistance = maxDistance;
  
  // Check spatial index first (faster lookup) with wider search
  const searchRadius = Math.ceil(maxDistance / 10); // More thorough spatial search
  for (let dx = -searchRadius; dx <= searchRadius; dx++) {
    for (let dz = -searchRadius; dz <= searchRadius; dz++) {
      const indexKey = `${Math.round(position.x) + dx},${Math.round(position.z) + dz}`;
      const node = network.nodeIndex.get(indexKey);
      
      if (node) {
        const distance = Math.sqrt(
          Math.pow(position.x - node.position.x, 2) +
          Math.pow(position.z - node.position.z, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestNode = node;
        }
      }
    }
  }
  
  // If spatial index failed, do brute force search (fallback)
  if (!nearestNode) {
    console.log('🔍 Spatial index failed, trying brute force search...');
    for (const [nodeId, node] of network.nodes) {
      const distance = Math.sqrt(
        Math.pow(position.x - node.position.x, 2) +
        Math.pow(position.z - node.position.z, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestNode = node;
      }
    }
    
    if (nearestNode) {
      console.log(`✅ Brute force found node at distance ${minDistance.toFixed(2)}`);
    }
  }
  
  return nearestNode;
};

export const convertNetworkToRoadPaths = (network: ConnectedRoadNetwork): RoadPath[] => {
  const roadPaths: RoadPath[] = [];
  
  network.segments.forEach(segment => {
    const roadPath: RoadPath = {
      points: segment.points,
      width: segment.width,
      length: segment.length,
      name: segment.name,
      highway: segment.highway
    };
    
    roadPaths.push(roadPath);
  });
  
  return roadPaths;
};

// Helper functions
const isRoadWay = (way: OSMWay): boolean => {
  const highway = way.tags?.highway;
  if (!highway) return false;
  
  const roadTypes = [
    'primary', 'secondary', 'tertiary', 'residential', 
    'unclassified', 'service', 'trunk', 'motorway',
    'primary_link', 'secondary_link', 'tertiary_link'
  ];
  
  return roadTypes.includes(highway);
};

const getRoadWidthFromTags = (tags: Record<string, string>): number => {
  const highway = tags?.highway;
  const lanes = parseInt(tags?.lanes || '2');
  
  const baseWidths: Record<string, number> = {
    'motorway': 25,
    'trunk': 22,
    'primary': 18,
    'secondary': 15,
    'tertiary': 12,
    'residential': 10,
    'unclassified': 8,
    'service': 6
  };
  
  const baseWidth = baseWidths[highway] || 10;
  return Math.max(6, baseWidth * (lanes / 2));
};

const interpolateRoadSegment = (start: Vector3, end: Vector3, numPoints: number): Vector3[] => {
  const points: Vector3[] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    points.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t,
      z: start.z + (end.z - start.z) * t
    });
  }
  
  return points;
};

const calculatePathLength = (points: Vector3[]): number => {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dz = curr.z - prev.z;
    length += Math.sqrt(dx * dx + dz * dz);
  }
  return length;
};

const latLonToWorld = (
  lat: number,
  lon: number,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  worldSize: number
): { x: number; z: number } => {
  const normX = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
  const normZ = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
  
  const x = (normX - 0.5) * worldSize;
  const z = (normZ - 0.5) * worldSize;
  
  return { x, z };
};

const sampleTerrainHeight = (
  heightmap: number[][],
  worldX: number,
  worldZ: number,
  worldSize: number
): number => {
  const size = heightmap.length;
  const x = Math.floor((worldX + worldSize / 2) / worldSize * size);
  const z = Math.floor((worldZ + worldSize / 2) / worldSize * size);
  
  if (x >= 0 && x < size && z >= 0 && z < size) {
    return heightmap[x][z];
  }
  return 0;
};

export const getNextSegmentAtNode = (
  currentSegmentId: string,
  nodeId: string,
  network: ConnectedRoadNetwork
): RoadSegment | null => {
  const connectedRoads = findConnectedRoads(currentSegmentId, nodeId, network);
  
  if (connectedRoads.length === 0) {
    return null; // Dead end
  }
  
  // For now, randomly select next road. Could implement better logic here.
  const randomIndex = Math.floor(Math.random() * connectedRoads.length);
  return connectedRoads[randomIndex];
};

export const findSegmentByRoadPath = (
  roadPath: RoadPath,
  network: ConnectedRoadNetwork
): RoadSegment | null => {
  // Find segment that matches this road path
  for (const [segmentId, segment] of network.segments) {
    if (segment.name === roadPath.name && 
        Math.abs(segment.length - roadPath.length) < 10 && // Allow small differences
        segment.points.length === roadPath.points.length) {
      return segment;
    }
  }
  return null;
};

export const debugNetworkConnectivity = (network: ConnectedRoadNetwork): void => {
  console.log('🔍 Network Connectivity Debug:');
  console.log(`📍 Total Nodes: ${network.nodes.size}`);
  console.log(`🛣️ Total Segments: ${network.segments.size}`);
  
  let totalConnections = 0;
  let deadEnds = 0;
  let intersections = 0;
  
  network.nodes.forEach((node, nodeId) => {
    const connections = node.connectedRoads.length;
    totalConnections += connections;
    
    if (connections === 1) deadEnds++;
    else if (connections > 2) intersections++;
    
    if (connections > 4) {
      console.log(`🔀 Major intersection at ${nodeId}: ${connections} roads`);
    }
  });
  
  console.log(`🔗 Total Connections: ${totalConnections}`);
  console.log(`🚧 Dead Ends: ${deadEnds}`);
  console.log(`🔀 Intersections: ${intersections}`);
  console.log(`📊 Average Connections per Node: ${(totalConnections / network.nodes.size).toFixed(2)}`);
};