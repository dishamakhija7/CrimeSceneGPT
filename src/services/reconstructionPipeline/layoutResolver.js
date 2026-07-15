// --- DETERMINISTIC LAYOUT RESOLVER ---
// Pure JavaScript geometry and collision resolution logic. Zero AI calls.

const DIRECTION_VECTORS = {
  north: { x: 0, z: -1 },
  south: { x: 0, z: 1 },
  east: { x: 1, z: 0 },
  west: { x: -1, z: 0 },
  northeast: { x: 0.707, z: -0.707 },
  northwest: { x: -0.707, z: -0.707 },
  southeast: { x: 0.707, z: 0.707 },
  southwest: { x: -0.707, z: 0.707 }
};

const DISTANCE_TIERS = {
  adjacent: 0.5, // 0.3 - 0.8 meters
  close: 1.4,    // 0.8 - 2.0 meters
  medium: 3.0,   // 2.0 - 4.0 meters
  far: 5.5       // 4.0+ meters
};

/**
 * Returns a bounding box size { w, l } (width, length) for each object type.
 */
export const getBoundingBoxSize = (type) => {
  switch (type) {
    case 'vehicle':
      return { w: 1.8, l: 4.0 };
    case 'furniture':
      return { w: 1.2, l: 1.2 };
    case 'body':
      return { w: 0.6, l: 1.4 };
    case 'weapon':
      return { w: 0.3, l: 0.3 };
    case 'blood_stain':
      return { w: 0.8, l: 0.8 };
    case 'door':
      return { w: 0.9, l: 0.1 };
    case 'window':
      return { w: 0.9, l: 0.15 };
    case 'evidence_marker':
      return { w: 0.3, l: 0.3 };
    default:
      return { w: 0.6, l: 0.6 };
  }
};

/**
 * Maps direction words to rotation angles in degrees.
 */
const directionToRotation = (orientation, defaultRot = 0) => {
  if (!orientation) return defaultRot;
  const lower = orientation.toLowerCase();
  if (lower.includes('north')) return 0;
  if (lower.includes('south')) return 180;
  if (lower.includes('east')) return 90;
  if (lower.includes('west')) return 270;
  return defaultRot;
};

/**
 * Deterministically resolves coordinates and checks for overlapping collisions.
 * 
 * @param {Array} entities - Extracted Stage 1 scene entities list.
 * @param {Object} room - Extracted Stage 1 room configuration.
 * @returns {Array} List of resolved layout objects with precise coordinates.
 */
export const resolveLayout = (entities, room) => {
  const width = room?.width || 12;
  const length = room?.length || 15;
  
  // 1. Initialize resolved object registry
  const resolved = {};

  // Helper to register resolved entries
  const registerResolved = (id, type, x, y, z, rotation, state, isStatic) => {
    resolved[id] = {
      id,
      type,
      position: { x, y, z },
      rotation,
      state: state || null,
      isStatic: !!isStatic
    };
  };

  // 2. Resolve entry points (doors/windows) strictly on boundary walls
  const wallGroups = { north: [], south: [], east: [], west: [] };
  
  (room.entry_points || []).forEach(ep => {
    const wall = ep.wall?.toLowerCase();
    if (wallGroups[wall]) {
      wallGroups[wall].push(ep);
    }
  });

  // Position on walls: sort alphabetically by ID first to ensure determinism
  Object.keys(wallGroups).forEach(wall => {
    const list = wallGroups[wall];
    list.sort((a, b) => a.id.localeCompare(b.id));
    const count = list.length;
    
    list.forEach((ep, idx) => {
      let x = 0;
      let z = 0;
      let rotation = 0;

      // Spacing out multiple entry points evenly along the wall line segment
      const fraction = (idx + 1) / (count + 1);

      if (wall === 'north') {
        x = -width / 2 + fraction * width;
        z = -length / 2;
        rotation = 180; // Inward facing
      } else if (wall === 'south') {
        x = -width / 2 + fraction * width;
        z = length / 2;
        rotation = 0; // Inward facing
      } else if (wall === 'east') {
        x = width / 2;
        z = -length / 2 + fraction * length;
        rotation = 270; // Inward facing
      } else if (wall === 'west') {
        x = -width / 2;
        z = -length / 2 + fraction * length;
        rotation = 90; // Inward facing
      }

      registerResolved(ep.id, ep.type, x, 0.0, z, rotation, 'closed', true);
    });
  });

  // 3. Resolve non-entry entities using Dependency Ordering
  const unresolved = [...(entities || [])];
  
  // Sort unresolved initially by ID to ensure order consistency
  unresolved.sort((a, b) => a.id.localeCompare(b.id));

  // Run up to entities.length passes to resolve relational dependencies
  const maxPasses = unresolved.length;
  for (let pass = 0; pass < maxPasses; pass++) {
    for (let i = unresolved.length - 1; i >= 0; i--) {
      const ent = unresolved[i];
      const rel = ent.relative_position || {};
      const nearId = rel.near;

      // Case A: No relational dependency (absolute/relative to center)
      if (!nearId || nearId.trim() === '') {
        const dirVec = DIRECTION_VECTORS[rel.direction?.toLowerCase()] || { x: 0, z: 0 };
        const distVal = DISTANCE_TIERS[rel.distance] || 0.0;
        
        const x = dirVec.x * distVal;
        const z = dirVec.z * distVal;
        const rotation = directionToRotation(ent.orientation, 0);

        registerResolved(ent.id, ent.type, x, 0.0, z, rotation, ent.state, false);
        unresolved.splice(i, 1);
      } 
      // Case B: Relational dependency
      else if (resolved[nearId]) {
        // Parent is resolved! Place relative to parent coordinates
        const parent = resolved[nearId];
        const dirVec = DIRECTION_VECTORS[rel.direction?.toLowerCase()] || { x: 0, z: 0 };
        
        // If direction is missing, use a deterministic offset angle based on string hashing of entity ID
        if (!rel.direction) {
          let hash = 0;
          for (let c = 0; c < ent.id.length; c++) {
            hash = ent.id.charCodeAt(c) + ((hash << 5) - hash);
          }
          const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
          dirVec.x = Math.sin(angle);
          dirVec.z = Math.cos(angle);
        }

        const distVal = DISTANCE_TIERS[rel.distance] || 0.5;
        
        const x = parent.position.x + dirVec.x * distVal;
        const z = parent.position.z + dirVec.z * distVal;
        
        const defaultHeading = rel.direction ? directionToRotation(rel.direction) : parent.rotation;
        const rotation = directionToRotation(ent.orientation, defaultHeading);

        registerResolved(ent.id, ent.type, x, 0.0, z, rotation, ent.state, false);
        unresolved.splice(i, 1);
      }
    }
  }

  // Fallback pass: Circular fallback placement for any entities with cycles or missing targets
  unresolved.forEach((ent, idx) => {
    // Distribute them evenly in a circle around the room center
    const angle = (idx / unresolved.length) * Math.PI * 2;
    const x = Math.sin(angle) * (width * 0.25);
    const z = Math.cos(angle) * (length * 0.25);
    const rotation = (angle * 180) / Math.PI;

    registerResolved(ent.id, ent.type, x, 0.0, z, rotation, ent.state, false);
  });

  // Clamp initial coordinates to room bounds
  const clampToRoom = (obj, pad = 0.2) => {
    obj.position.x = Math.max(-width / 2 + pad, Math.min(width / 2 - pad, obj.position.x));
    obj.position.z = Math.max(-length / 2 + pad, Math.min(length / 2 - pad, obj.position.z));
  };

  Object.values(resolved).forEach(obj => {
    if (!obj.isStatic) {
      clampToRoom(obj);
    }
  });

  // 4. Collision-Avoidance Nudging Pass (Deterministic overlap solver)
  const maxCollisionPasses = 10;
  for (let step = 0; step < maxCollisionPasses; step++) {
    let didResolveOverlap = false;

    const list = Object.values(resolved);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];

        // Skip check if both are stationary sills
        if (a.isStatic && b.isStatic) continue;

        const boxA = getBoundingBoxSize(a.type);
        const boxB = getBoundingBoxSize(b.type);

        // AABB box limits (2D ground footprint coordinates)
        const minAx = a.position.x - boxA.w / 2;
        const maxAx = a.position.x + boxA.w / 2;
        const minAz = a.position.z - boxA.l / 2;
        const maxAz = a.position.z + boxA.l / 2;

        const minBx = b.position.x - boxB.w / 2;
        const maxBx = b.position.x + boxB.w / 2;
        const minBz = b.position.z - boxB.l / 2;
        const maxBz = b.position.z + boxB.l / 2;

        // Check 2D bounding box overlap
        const overlapX = Math.min(maxAx, maxBx) - Math.max(minAx, minBx);
        const overlapZ = Math.min(maxAz, maxBz) - Math.max(minAz, minBz);

        if (overlapX > 0 && overlapZ > 0) {
          didResolveOverlap = true;

          // Nudge along the shortest overlap axis to minimize visual drift
          if (overlapX < overlapZ) {
            const nudgeDir = a.position.x < b.position.x ? 1 : -1;
            const nudgeAmount = overlapX + 0.05; // Add tiny padding to prevent floating point limits

            if (a.isStatic) {
              b.position.x += nudgeAmount * nudgeDir;
            } else if (b.isStatic) {
              a.position.x -= nudgeAmount * nudgeDir;
            } else {
              a.position.x -= (nudgeAmount / 2) * nudgeDir;
              b.position.x += (nudgeAmount / 2) * nudgeDir;
            }
          } else {
            const nudgeDir = a.position.z < b.position.z ? 1 : -1;
            const nudgeAmount = overlapZ + 0.05;

            if (a.isStatic) {
              b.position.z += nudgeAmount * nudgeDir;
            } else if (b.isStatic) {
              a.position.z -= nudgeAmount * nudgeDir;
            } else {
              a.position.z -= (nudgeAmount / 2) * nudgeDir;
              b.position.z += (nudgeAmount / 2) * nudgeDir;
            }
          }

          // Re-clamp positions to bounds after nudging
          if (!a.isStatic) clampToRoom(a);
          if (!b.isStatic) clampToRoom(b);
        }
      }
    }

    // Stop early if a pass completes with zero overlapping boxes
    if (!didResolveOverlap) break;
  }

  // Convert resolved registry object to flat list format
  return Object.values(resolved).map(obj => ({
    id: obj.id,
    type: obj.type,
    position: [obj.position.x, obj.position.y, obj.position.z],
    rotation: obj.rotation,
    state: obj.state
  }));
};
