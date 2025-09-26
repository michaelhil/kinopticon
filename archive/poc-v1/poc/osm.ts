// OpenStreetMap data integration
import { RoadPath, RoadNetwork, TerrainData, Vector3 } from './types.ts';
import { sampleTerrainHeight } from './terrain.ts';

export interface OSMNode {
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

export interface OSMWay {
  id: number;
  nodes: number[];
  tags: Record<string, string>;
  name?: string;
  highway?: string;
}

export interface OSMData {
  nodes: Map<number, OSMNode>;
  ways: OSMWay[];
}

export interface OSMBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

// Halden, Norway coordinates (approximately 1km x 1km area)
export const haldenBounds: OSMBounds = {
  minLat: 59.120,
  maxLat: 59.129,
  minLon: 11.385,
  maxLon: 11.400
};

export const buildOverpassQuery = (bounds: OSMBounds): string => {
  return `
    [out:json][timeout:25];
    (
      way["highway"~"^(primary|secondary|tertiary|residential|unclassified|service|trunk|motorway)$"]
      (${bounds.minLat},${bounds.minLon},${bounds.maxLat},${bounds.maxLon});
    );
    (._;>;);
    out geom;
  `;
};

export const fetchOSMData = async (bounds: OSMBounds): Promise<OSMData> => {
  const query = buildOverpassQuery(bounds);
  const encodedQuery = encodeURIComponent(query);
  const url = `https://overpass-api.de/api/interpreter?data=${encodedQuery}`;
  
  console.log('🌍 Fetching OSM data from Halden, Norway...');
  console.log('📍 Bounds:', bounds);
  console.log('🔗 API URL:', url.substring(0, 100) + '...');
  
  try {
    const response = await fetch(url);
    console.log('📡 Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('📊 Raw OSM data:', data);
    
    return parseOSMResponse(data);
  } catch (error) {
    console.error('❌ Failed to fetch OSM data:', error);
    throw error;
  }
};

const parseOSMResponse = (data: any): OSMData => {
  const nodes = new Map<number, OSMNode>();
  const ways: OSMWay[] = [];
  
  // Process elements
  for (const element of data.elements) {
    if (element.type === 'node') {
      nodes.set(element.id, {
        id: element.id,
        lat: element.lat,
        lon: element.lon,
        tags: element.tags || {}
      });
    } else if (element.type === 'way') {
      const way: OSMWay = {
        id: element.id,
        nodes: element.nodes,
        tags: element.tags || {},
        name: element.tags?.name || element.tags?.['name:en'] || undefined,
        highway: element.tags?.highway
      };
      ways.push(way);
    }
  }
  
  console.log(`✅ Parsed ${nodes.size} nodes and ${ways.size} ways from OSM`);
  return { nodes, ways };
};

export const convertOSMToKinopticon = (
  osmData: OSMData,
  bounds: OSMBounds,
  terrain: TerrainData
): RoadNetwork => {
  const roads: RoadPath[] = [];
  
  for (const way of osmData.ways) {
    // Filter for road types
    if (!isRoadWay(way)) continue;
    
    const points: Vector3[] = [];
    let validWay = true;
    
    for (const nodeId of way.nodes) {
      const node = osmData.nodes.get(nodeId);
      if (!node) {
        validWay = false;
        break;
      }
      
      // Convert lat/lon to world coordinates
      const worldCoords = latLonToWorld(node.lat, node.lon, bounds, terrain.worldSize);
      
      // Sample terrain height at this position
      const terrainHeight = sampleTerrainHeight(
        terrain.heightmap,
        worldCoords.x,
        worldCoords.z,
        terrain.worldSize
      );
      
      points.push({
        x: worldCoords.x,
        y: terrainHeight + 3,
        z: worldCoords.z
      });
    }
    
    if (validWay && points.length >= 2) {
      const roadWidth = getRoadWidthFromTags(way.tags);
      const roadLength = calculatePathLength(points);
      
      roads.push({
        points,
        width: roadWidth,
        length: roadLength,
        name: way.name,
        highway: way.highway
      });
    }
  }
  
  console.log(`🛣️  Created ${roads.length} roads from OSM data`);
  
  // Use first road as main, second as branch, rest as dynamic
  const mainRoad = roads[0] || { points: [], width: 20, length: 0 };
  const branchRoad = roads[1] || { points: [], width: 20, length: 0 };
  const dynamicRoads = roads.slice(2);
  
  return {
    mainRoad,
    branchRoad,
    dynamicRoads,
    allPoints: roads.flatMap(road => road.points)
  };
};

const isRoadWay = (way: OSMWay): boolean => {
  const highway = way.tags.highway;
  if (!highway) return false;
  
  const roadTypes = [
    'primary', 'secondary', 'tertiary', 'residential', 
    'unclassified', 'service', 'trunk', 'motorway',
    'primary_link', 'secondary_link', 'tertiary_link'
  ];
  
  return roadTypes.includes(highway);
};

const getRoadWidthFromTags = (tags: Record<string, string>): number => {
  const highway = tags.highway;
  const lanes = parseInt(tags.lanes || '2');
  
  // Estimate road width based on highway type and lanes
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
  bounds: OSMBounds,
  worldSize: number
): { x: number; z: number } => {
  // Normalize to 0-1 range within bounds
  const normX = (lon - bounds.minLon) / (bounds.maxLon - bounds.minLon);
  const normZ = (lat - bounds.minLat) / (bounds.maxLat - bounds.minLat);
  
  // Convert to world coordinates (-worldSize/2 to +worldSize/2)
  const x = (normX - 0.5) * worldSize;
  const z = (normZ - 0.5) * worldSize;
  
  return { x, z };
};