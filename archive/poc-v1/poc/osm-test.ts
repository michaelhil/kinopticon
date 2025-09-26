// Quick test for OSM data fetching
import { fetchOSMData, haldenBounds, convertOSMToKinopticon } from './osm.ts';
import { createTerrain, createTerrainConfig } from './terrain.ts';

export const testOSMFetch = async (): Promise<void> => {
  console.log('🧪 Testing OSM data fetch...');
  console.log('📍 Bounds:', haldenBounds);
  
  try {
    // Create a terrain for conversion testing
    const terrainConfig = createTerrainConfig();
    const terrain = await createTerrain(terrainConfig);
    
    console.log('🌍 Fetching OSM data...');
    const osmData = await fetchOSMData(haldenBounds);
    console.log('📊 OSM Data received:', {
      nodes: osmData.nodes.size,
      ways: osmData.ways.length
    });
    
    console.log('🔄 Converting to Kinopticon format...');
    const roadNetwork = convertOSMToKinopticon(osmData, haldenBounds, terrain);
    console.log('🛣️ Road network created:', {
      mainRoad: roadNetwork.mainRoad.points.length,
      branchRoad: roadNetwork.branchRoad.points.length,
      dynamicRoads: roadNetwork.dynamicRoads.length,
      totalPoints: roadNetwork.allPoints.length
    });
    
    console.log('✅ OSM test completed successfully');
  } catch (error) {
    console.error('❌ OSM test failed:', error);
    throw error;
  }
};

// Run test if this module is imported
if (typeof window !== 'undefined') {
  // Add to window for debugging
  (window as any).testOSMFetch = testOSMFetch;
}