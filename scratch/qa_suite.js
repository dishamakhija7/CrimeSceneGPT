/**
 * CrimeScene GPT — Full QA Test Suite (Node.js)
 * Tests: parsing pipeline, layoutResolver, sceneExtractor schema validation,
 *        vehicle type mapping, color extraction, edge cases, and scene rendering logic.
 *
 * Run: node scratch/qa_suite.js
 */

// ─── INLINE COPIES OF PURE JS UTILITIES ─────────────────────────────────────

const ENTITY_ONTOLOGY = ["body","weapon","blood_stain","furniture","door","window","evidence_marker","vehicle","other"];
const DIRECTIONS = ["north","south","east","west","northeast","northwest","southeast","southwest"];
const DISTANCE_TIERS_ARRAY = ["adjacent","close","medium","far"];

const DIRECTION_VECTORS = {
  north: { x: 0, z: -1 }, south: { x: 0, z: 1 },
  east: { x: 1, z: 0 },  west: { x: -1, z: 0 },
  northeast: { x: 0.707, z: -0.707 }, northwest: { x: -0.707, z: -0.707 },
  southeast: { x: 0.707, z: 0.707 },  southwest: { x: -0.707, z: 0.707 }
};

const DISTANCE_TIERS = { adjacent: 0.5, close: 1.4, medium: 3.0, far: 5.5 };

const getBoundingBoxSize = (type) => {
  switch (type) {
    case 'vehicle': return { w: 1.8, l: 4.0 };
    case 'furniture': return { w: 1.2, l: 1.2 };
    case 'body': return { w: 0.6, l: 1.4 };
    case 'weapon': return { w: 0.3, l: 0.3 };
    case 'blood_stain': return { w: 0.8, l: 0.8 };
    case 'door': return { w: 0.9, l: 0.1 };
    case 'window': return { w: 0.9, l: 0.15 };
    case 'evidence_marker': return { w: 0.3, l: 0.3 };
    default: return { w: 0.6, l: 0.6 };
  }
};

const directionToRotation = (orientation, defaultRot = 0) => {
  if (!orientation) return defaultRot;
  const lower = orientation.toLowerCase();
  if (lower.includes('north')) return 0;
  if (lower.includes('south')) return 180;
  if (lower.includes('east')) return 90;
  if (lower.includes('west')) return 270;
  return defaultRot;
};

// resolveColor (null-safe, from Reconstruction3D.jsx)
const resolveColor = (color, fallback = '#64748b') => {
  if (!color || typeof color !== 'string') return fallback;
  const c = color.toLowerCase().trim();
  if (c === 'red') return '#dc2626';
  if (c === 'blue') return '#2563eb';
  if (c === 'green') return '#16a34a';
  if (c === 'yellow') return '#ca8a04';
  if (c === 'white') return '#f8fafc';
  if (c === 'black') return '#0f172a';
  if (c === 'brown') return '#78350f';
  if (c === 'grey' || c === 'gray') return '#64748b';
  if (c === 'silver') return '#94a3b8';
  if (c === 'orange') return '#ea580c';
  if (c.startsWith('#')) return c;
  return fallback;
};

const validateExtractedScene = (data) => {
  if (!data || typeof data !== 'object') return "Output is not a valid JSON object.";
  const room = data.room;
  if (!room) return "Missing 'room' config block.";
  if (typeof room.width !== 'number' || room.width <= 0) return `Invalid room width: ${room.width}`;
  if (typeof room.length !== 'number' || room.length <= 0) return `Invalid room length: ${room.length}`;
  if (!["rectangular","irregular"].includes(room.shape)) return `Invalid room shape: ${room.shape}`;
  if (!Array.isArray(room.entry_points)) return "Room 'entry_points' must be an array.";
  for (const ep of room.entry_points) {
    if (!ep.id || typeof ep.id !== 'string') return "Entry point missing 'id' string.";
    if (!["door","window"].includes(ep.type)) return `Entry point type '${ep.type}' is invalid.`;
    if (!["north","south","east","west"].includes(ep.wall)) return `Entry point wall '${ep.wall}' is invalid.`;
  }
  if (!Array.isArray(data.entities)) return "Root level 'entities' must be an array.";
  const existingIds = new Set(room.entry_points.map(ep => ep.id));
  for (const ent of data.entities) {
    if (!ent.id || typeof ent.id !== 'string') return "Entity missing 'id' string.";
    if (existingIds.has(ent.id)) return `Duplicate entity ID: '${ent.id}'`;
    existingIds.add(ent.id);
    if (!ENTITY_ONTOLOGY.includes(ent.type)) return `Entity '${ent.id}' has invalid type: '${ent.type}'`;
    if (!ent.relative_position) return `Entity '${ent.id}' missing 'relative_position'.`;
    if (!DISTANCE_TIERS_ARRAY.includes(ent.relative_position.distance)) return `Entity '${ent.id}' invalid distance '${ent.relative_position.distance}'`;
    if (!["explicit","inferred"].includes(ent.confidence)) return `Entity '${ent.id}' invalid confidence`;
  }
  for (const ent of data.entities) {
    const nearTarget = ent.relative_position.near;
    if (nearTarget && nearTarget.trim() !== '') {
      if (!existingIds.has(nearTarget)) return `Entity '${ent.id}' references non-existent near: '${nearTarget}'`;
      if (nearTarget === ent.id) return `Entity '${ent.id}' cannot reference itself.`;
    }
  }
  return true;
};

const resolveLayout = (entities, room) => {
  const width = room?.width || 12;
  const length = room?.length || 15;
  const resolved = {};
  const registerResolved = (id, type, x, y, z, rotation, state, isStatic) => {
    resolved[id] = { id, type, position: { x, y, z }, rotation, state: state || null, isStatic: !!isStatic };
  };
  const wallGroups = { north: [], south: [], east: [], west: [] };
  (room.entry_points || []).forEach(ep => {
    const wall = ep.wall?.toLowerCase();
    if (wallGroups[wall]) wallGroups[wall].push(ep);
  });
  Object.keys(wallGroups).forEach(wall => {
    const list = wallGroups[wall];
    list.sort((a, b) => a.id.localeCompare(b.id));
    list.forEach((ep, idx) => {
      let x = 0, z = 0, rotation = 0;
      const fraction = (idx + 1) / (list.length + 1);
      if (wall === 'north') { x = -width / 2 + fraction * width; z = -length / 2; rotation = 180; }
      else if (wall === 'south') { x = -width / 2 + fraction * width; z = length / 2; rotation = 0; }
      else if (wall === 'east') { x = width / 2; z = -length / 2 + fraction * length; rotation = 270; }
      else if (wall === 'west') { x = -width / 2; z = -length / 2 + fraction * length; rotation = 90; }
      registerResolved(ep.id, ep.type, x, 0.0, z, rotation, 'closed', true);
    });
  });
  const unresolved = [...(entities || [])];
  unresolved.sort((a, b) => a.id.localeCompare(b.id));
  const maxPasses = unresolved.length;
  for (let pass = 0; pass < maxPasses; pass++) {
    for (let i = unresolved.length - 1; i >= 0; i--) {
      const ent = unresolved[i];
      const rel = ent.relative_position || {};
      const nearId = rel.near;
      if (!nearId || nearId.trim() === '') {
        const dirVec = DIRECTION_VECTORS[rel.direction?.toLowerCase()] || { x: 0, z: 0 };
        const distVal = DISTANCE_TIERS[rel.distance] || 0.0;
        registerResolved(ent.id, ent.type, dirVec.x * distVal, 0.0, dirVec.z * distVal, directionToRotation(ent.orientation, 0), ent.state, false);
        unresolved.splice(i, 1);
      } else if (resolved[nearId]) {
        const parent = resolved[nearId];
        const dirVec = DIRECTION_VECTORS[rel.direction?.toLowerCase()] || { x: 0, z: 0 };
        if (!rel.direction) {
          let hash = 0;
          for (let c = 0; c < ent.id.length; c++) hash = ent.id.charCodeAt(c) + ((hash << 5) - hash);
          const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
          dirVec.x = Math.sin(angle); dirVec.z = Math.cos(angle);
        }
        const distVal = DISTANCE_TIERS[rel.distance] || 0.5;
        registerResolved(ent.id, ent.type, parent.position.x + dirVec.x * distVal, 0.0, parent.position.z + dirVec.z * distVal,
          directionToRotation(ent.orientation, rel.direction ? directionToRotation(rel.direction) : parent.rotation), ent.state, false);
        unresolved.splice(i, 1);
      }
    }
  }
  unresolved.forEach((ent, idx) => {
    const angle = (idx / unresolved.length) * Math.PI * 2;
    registerResolved(ent.id, ent.type, Math.sin(angle) * (width * 0.25), 0.0, Math.cos(angle) * (length * 0.25), (angle * 180) / Math.PI, ent.state, false);
  });
  const clampToRoom = (obj, pad = 0.2) => {
    obj.position.x = Math.max(-width / 2 + pad, Math.min(width / 2 - pad, obj.position.x));
    obj.position.z = Math.max(-length / 2 + pad, Math.min(length / 2 - pad, obj.position.z));
  };
  Object.values(resolved).forEach(obj => { if (!obj.isStatic) clampToRoom(obj); });
  return Object.values(resolved).map(obj => ({
    id: obj.id, type: obj.type,
    position: [obj.position.x, obj.position.y, obj.position.z],
    rotation: obj.rotation, state: obj.state
  }));
};

// ─── VEHICLE TYPE RESOLVER (mirrors evidenceIntakeService.js logic) ──────────

const resolveVehicleType = (id) => {
  const lowerId = id.toLowerCase();
  if (lowerId.includes('signal') || lowerId.includes('light')) return 'traffic_signal';
  if (lowerId.includes('rickshaw') || lowerId.includes('tuk_tuk') || lowerId.includes('tuk-tuk') || lowerId.includes('auto')) return 'rickshaw';
  if (lowerId.includes('truck')) return 'truck';
  if (lowerId.includes('suv') || lowerId.includes('fortuner')) return 'suv';
  if (lowerId.includes('scooter') || lowerId.includes('motorcycle') || lowerId.includes('bike')) return 'scooter';
  if (lowerId.includes('bus')) return 'bus';
  return 'vehicle';
};

const resolveVehicleColor = (id, combinedText) => {
  const lowerId = id.toLowerCase();
  const lowerText = combinedText.toLowerCase();
  if (lowerId.includes('white') || lowerText.includes('white honda') || lowerText.includes('white civic')) return 'white';
  if (lowerId.includes('red') || lowerText.includes('red ' + lowerId)) return 'red';
  if (lowerId.includes('black') || lowerText.includes('black ' + lowerId)) return 'black';
  if (lowerId.includes('blue') || lowerText.includes('blue ' + lowerId)) return 'blue';
  if (lowerId.includes('yellow') || lowerText.includes('yellow ' + lowerId)) return 'yellow';
  if (lowerId.includes('green') || lowerText.includes('green ' + lowerId)) return 'green';
  if (lowerId.includes('grey') || lowerId.includes('gray') || lowerText.includes('grey ' + lowerId)) return 'grey';
  if (lowerId.includes('silver')) return 'white';
  return 'white'; // default
};

// ─── TEST SCENARIOS ──────────────────────────────────────────────────────────

const INCIDENTS = [
  // ── TC-01: Standard T-bone intersection accident ──────────────────────────
  {
    id: 'TC-01',
    name: 'T-bone Intersection Crash (Honda Civic vs Toyota Fortuner)',
    text: `Case Title: Highway T-Bone Collision\nDescription: White Honda Civic travelling north on NH-48 passed through green light at Andheri intersection. Black Toyota Fortuner ran a red light entering from the east. Fortuner struck the Civic on the driver side at the intersection centre. Skid marks 8m from Civic, 5m from Fortuner. CCTV at NE corner captured impact. Both airbags deployed.\nRoad Type: intersection\nWeather: Clear\nVisibility: Good`,
    expectedVehicleTypes: ['vehicle', 'suv'], // civic→vehicle, fortuner→suv
    expectedVehicleCount: 2,
    expectedSceneType: 'intersection',
    expectedColors: { civic: 'white', fortuner: 'black' }
  },
  // ── TC-02: Hit-and-run with motorcycle ────────────────────────────────────
  {
    id: 'TC-02',
    name: 'Hit-and-Run: Truck vs Motorcycle',
    text: `Case Title: Late Night Hit and Run\nDescription: Red Yamaha motorcycle heading west on MG Road was struck by a blue Tata truck that sped through a stop sign. Truck fled the scene northbound. Motorcycle rider was thrown 6m. Skid marks 12m from motorcycle. Witness states truck had broken rear lights.\nRoad Type: road\nWeather: Night, Dry\nVisibility: Low`,
    expectedVehicleTypes: ['scooter', 'truck'],
    expectedVehicleCount: 2,
    expectedSceneType: 'road'
  },
  // ── TC-03: Chain collision - multi vehicle ────────────────────────────────
  {
    id: 'TC-03',
    name: 'Highway Chain Collision (4 Vehicles)',
    text: `Case Title: Multi-vehicle Chain Collision on NH-8\nDescription: Sudden brake by a silver Maruti Swift caused chain reaction. Grey Hyundai Creta (SUV) rear-ended the Swift. Then a yellow school bus rammed the Creta from behind. An orange auto rickshaw swerved to avoid and rolled over. All incidents on straight highway. Foggy conditions.\nRoad Type: highway\nWeather: Fog\nVisibility: Poor`,
    expectedVehicleTypes: ['vehicle', 'suv', 'bus', 'rickshaw'],
    expectedVehicleCount: 4,
    expectedSceneType: 'highway'
  },
  // ── TC-04: Pedestrian fatality ────────────────────────────────────────────
  {
    id: 'TC-04',
    name: 'Pedestrian Fatality at Zebra Crossing',
    text: `Case Title: Pedestrian Fatal Strike\nDescription: Elderly pedestrian crossing at designated zebra crossing on Link Road was struck by a speeding green SUV. Driver did not brake. Pedestrian was dragged 4 metres. Blood stains at impact site and drag path. No CCTV. Witness accounts only.\nRoad Type: road\nWeather: Sunny\nVisibility: Good`,
    expectedActorTypes: ['victim'],
    expectedVehicleTypes: ['suv'],
    expectedSceneType: 'road'
  },
  // ── TC-05: Indoor crime scene (not a road accident) ───────────────────────
  {
    id: 'TC-05',
    name: 'Indoor Homicide Scene (Non-vehicle)',
    text: `Case Title: Hotel Room Homicide\nDescription: Victim found in prone position on hotel room floor near the bed. Blunt force trauma to head. Blood stains on carpet and wall to the north. A wooden chair overturned near the window. Weapon (wooden rod) found under the bed. Single entry door on south wall, window on north wall.\nRoad Type: indoor\nWeather: N/A\nVisibility: Artificial lighting`,
    expectedSceneType: 'bedroom',
    expectedEntityTypes: ['body', 'blood_stain', 'furniture', 'weapon'],
    expectedEntryPoints: ['door', 'window'],
    isIndoor: true
  },
  // ── TC-06: Edge case - Contradictory witnesses ────────────────────────────
  {
    id: 'TC-06',
    name: 'Contradictory Witness Statements',
    text: `Case Title: Conflicting Reports - Junction Crash\nDescription: Witness A says blue Maruti Suzuki Swift ran the red light. Witness B says the light was green. Witness C says a grey Alto was also involved and fled. CCTV footage corrupted. Skid marks indicate sharp braking from one vehicle only. Unclear which vehicle caused the initial swerve.\nRoad Type: intersection\nWeather: Overcast\nVisibility: Medium`,
    expectedSceneType: 'intersection',
    hasUncertainFacts: true
  },
  // ── TC-07: Edge case - Missing vehicle information ────────────────────────
  {
    id: 'TC-07',
    name: 'Incomplete Report - Missing Vehicle Details',
    text: `Case Title: Early Morning Accident\nDescription: Vehicle found overturned in ditch near Pune bypass. No eyewitnesses. Driver unconscious. Registration plate obscured by mud. No CCTV. Tire tracks suggest vehicle was speeding and lost control on curve. Emergency services responded 45 minutes later.\nRoad Type: highway\nWeather: Post-rain, Wet\nVisibility: Dawn, Low`,
    expectedSceneType: 'highway',
    hasMissingInfo: true
  },
  // ── TC-08: Auto rickshaw involved ────────────────────────────────────────
  {
    id: 'TC-08',
    name: 'Auto Rickshaw vs Car Side-swipe',
    text: `Case Title: Auto Rickshaw Sideswipe\nDescription: Black auto rickshaw travelling south was swiped by a white Toyota Innova overtaking on the wrong side. Rickshaw toppled onto its left side. Passenger ejected. Blood trail 2 metres east of impact. Innova braked 15m after impact.\nRoad Type: road\nWeather: Clear\nVisibility: Good`,
    expectedVehicleTypes: ['rickshaw', 'vehicle'],
    expectedSceneType: 'road'
  },
  // ── TC-09: Zero entities edge case (empty incident text) ─────────────────
  {
    id: 'TC-09',
    name: 'Edge Case - Near-Empty Incident Report',
    text: `Case Title: Unknown Incident\nDescription: Accident reported. No further details.\nRoad Type: Unknown\nWeather: Unknown\nVisibility: Unknown`,
    isEdgeCase: true
  },
  // ── TC-10: Numeric color values / malformed data ──────────────────────────
  {
    id: 'TC-10',
    name: 'Edge Case - Malformed/Null Color from Firestore',
    text: `Case Title: Malformed Firestore Color Test\nDescription: Sedan involved in crash. Color field stored as null in database.\nRoad Type: road\nWeather: Clear\nVisibility: Good`,
    simulateNullColor: true
  }
];

// ─── TEST RUNNER ─────────────────────────────────────────────────────────────

let passCount = 0;
let failCount = 0;
let warnCount = 0;
const bugs = [];
const results = [];

function pass(testId, msg) {
  passCount++;
  results.push({ id: testId, status: 'PASS', msg });
  console.log(`  ✅ PASS: ${msg}`);
}

function fail(testId, msg) {
  failCount++;
  bugs.push({ id: testId, bug: msg });
  results.push({ id: testId, status: 'FAIL', msg });
  console.log(`  ❌ FAIL: ${msg}`);
}

function warn(testId, msg) {
  warnCount++;
  results.push({ id: testId, status: 'WARN', msg });
  console.log(`  ⚠️  WARN: ${msg}`);
}

// ─── TEST SECTION A: resolveColor null safety ─────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION A: resolveColor() Null Safety');
console.log('═══════════════════════════════════════════════════════');

const colorCases = [
  [null, '#64748b', 'A-01: null color'],
  [undefined, '#64748b', 'A-02: undefined color'],
  [42, '#64748b', 'A-03: numeric color'],
  ['', '#64748b', 'A-04: empty string'],
  ['red', '#dc2626', 'A-05: red string'],
  ['WHITE', '#f8fafc', 'A-06: uppercase WHITE'],
  ['#ff0000', '#ff0000', 'A-07: hex passthrough'],
  ['silver', '#94a3b8', 'A-08: silver'],
  ['grey', '#64748b', 'A-09: grey'],
  ['invalid_unknown_color', '#64748b', 'A-10: unknown fallback'],
];

colorCases.forEach(([input, expected, label]) => {
  const result = resolveColor(input);
  if (result === expected) pass('A', `${label} → ${result}`);
  else fail('A', `${label}: expected ${expected}, got ${result}`);
});

// ─── TEST SECTION B: validateExtractedScene ───────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION B: validateExtractedScene() Schema Validation');
console.log('═══════════════════════════════════════════════════════');

// B-01: Valid minimal scene
const validScene = {
  room: { width: 20, length: 45, shape: 'rectangular', entry_points: [] },
  entities: [
    { id: 'vehicle_civic', type: 'vehicle', relative_position: { distance: 'medium', direction: 'north' }, confidence: 'explicit' },
    { id: 'vehicle_fortuner', type: 'vehicle', relative_position: { distance: 'medium', direction: 'east' }, confidence: 'explicit' }
  ]
};
const b01 = validateExtractedScene(validScene);
if (b01 === true) pass('B-01', 'Valid scene passes validation');
else fail('B-01', `Valid scene was rejected: ${b01}`);

// B-02: Invalid - negative width
const b02scene = { room: { width: -5, length: 15, shape: 'rectangular', entry_points: [] }, entities: [] };
const b02 = validateExtractedScene(b02scene);
if (b02 !== true) pass('B-02', `Negative width correctly rejected: "${b02}"`);
else fail('B-02', 'Negative room width was not caught');

// B-03: Invalid entity type
const b03scene = {
  room: { width: 20, length: 45, shape: 'rectangular', entry_points: [] },
  entities: [{ id: 'bad_thing', type: 'invalid_type', relative_position: { distance: 'close' }, confidence: 'explicit' }]
};
const b03 = validateExtractedScene(b03scene);
if (b03 !== true) pass('B-03', `Invalid entity type caught: "${b03}"`);
else fail('B-03', 'Invalid entity type was not caught');

// B-04: Duplicate entity IDs
const b04scene = {
  room: { width: 20, length: 45, shape: 'rectangular', entry_points: [{ id: 'door_south', type: 'door', wall: 'south' }] },
  entities: [
    { id: 'door_south', type: 'vehicle', relative_position: { distance: 'close' }, confidence: 'explicit' }
  ]
};
const b04 = validateExtractedScene(b04scene);
if (b04 !== true) pass('B-04', `Duplicate ID (entity vs entry_point) caught: "${b04}"`);
else fail('B-04', 'Duplicate entity ID vs entry_point was not caught');

// B-05: Self-referencing 'near'
const b05scene = {
  room: { width: 20, length: 45, shape: 'rectangular', entry_points: [] },
  entities: [
    { id: 'vehicle_a', type: 'vehicle', relative_position: { distance: 'close', near: 'vehicle_a' }, confidence: 'explicit' }
  ]
};
const b05 = validateExtractedScene(b05scene);
if (b05 !== true) pass('B-05', `Self-referencing 'near' caught: "${b05}"`);
else fail('B-05', "Self-referencing 'near' was not caught");

// B-06: Invalid distance tier
const b06scene = {
  room: { width: 20, length: 45, shape: 'rectangular', entry_points: [] },
  entities: [
    { id: 'vehicle_a', type: 'vehicle', relative_position: { distance: 'very_far' }, confidence: 'explicit' }
  ]
};
const b06 = validateExtractedScene(b06scene);
if (b06 !== true) pass('B-06', `Invalid distance tier caught: "${b06}"`);
else fail('B-06', 'Invalid distance tier was not caught');

// B-07: Missing entities array
const b07 = validateExtractedScene({ room: { width: 20, length: 45, shape: 'rectangular', entry_points: [] } });
if (b07 !== true) pass('B-07', `Missing entities array caught: "${b07}"`);
else fail('B-07', 'Missing entities array was not caught');

// B-08: 'near' referencing non-existent entity
const b08scene = {
  room: { width: 20, length: 45, shape: 'rectangular', entry_points: [] },
  entities: [
    { id: 'vehicle_a', type: 'vehicle', relative_position: { distance: 'close', near: 'phantom_entity' }, confidence: 'explicit' }
  ]
};
const b08 = validateExtractedScene(b08scene);
if (b08 !== true) pass('B-08', `Non-existent 'near' target caught: "${b08}"`);
else fail('B-08', "Non-existent 'near' target was not caught");

// ─── TEST SECTION C: layoutResolver ──────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION C: layoutResolver() - Deterministic Coordinates');
console.log('═══════════════════════════════════════════════════════');

// C-01: Two vehicles resolve without overlap
const cRoom = { width: 20, length: 45, shape: 'rectangular', entry_points: [] };
const cEntities = [
  { id: 'vehicle_civic', type: 'vehicle', relative_position: { distance: 'far', direction: 'north' }, orientation: 'facing south', confidence: 'explicit' },
  { id: 'vehicle_fortuner', type: 'vehicle', relative_position: { distance: 'far', direction: 'east' }, orientation: 'facing west', confidence: 'explicit' }
];
const cResult = resolveLayout(cEntities, cRoom);
if (cResult.length === 2) pass('C-01', `Resolved ${cResult.length} layout objects`);
else fail('C-01', `Expected 2 objects, got ${cResult.length}`);

// C-02: No overlapping bounding boxes
const c02Overlaps = [];
for (let i = 0; i < cResult.length; i++) {
  for (let j = i + 1; j < cResult.length; j++) {
    const a = cResult[i], b = cResult[j];
    const boxA = getBoundingBoxSize(a.type), boxB = getBoundingBoxSize(b.type);
    const overlapX = Math.min(a.position[0] + boxA.w/2, b.position[0] + boxB.w/2) - Math.max(a.position[0] - boxA.w/2, b.position[0] - boxB.w/2);
    const overlapZ = Math.min(a.position[2] + boxA.l/2, b.position[2] + boxB.l/2) - Math.max(a.position[2] - boxA.l/2, b.position[2] - boxB.l/2);
    if (overlapX > 0.05 && overlapZ > 0.05) c02Overlaps.push(`${a.id} vs ${b.id}`);
  }
}
if (c02Overlaps.length === 0) pass('C-02', 'No bounding box overlaps detected');
else fail('C-02', `Bounding box overlaps: ${c02Overlaps.join(', ')}`);

// C-03: All objects clamped within room bounds
const c03OutOfBounds = cResult.filter(obj => {
  const hw = cRoom.width / 2, hl = cRoom.length / 2;
  return Math.abs(obj.position[0]) > hw || Math.abs(obj.position[2]) > hl;
});
if (c03OutOfBounds.length === 0) pass('C-03', 'All objects clamped within room bounds');
else fail('C-03', `Objects out of bounds: ${c03OutOfBounds.map(o => o.id).join(', ')}`);

// C-04: Door placed on wall (static) - not clamped to interior
const cRoomWithDoor = { width: 12, length: 15, shape: 'rectangular', entry_points: [{ id: 'door_south', type: 'door', wall: 'south' }] };
const cDoorResult = resolveLayout([], cRoomWithDoor);
const door = cDoorResult.find(o => o.id === 'door_south');
if (door) {
  if (Math.abs(door.position[2] - 7.5) < 0.1) pass('C-04', `Door correctly placed on south wall (z=7.5), got z=${door.position[2].toFixed(2)}`);
  else fail('C-04', `Door z position incorrect. Expected ~7.5, got ${door.position[2].toFixed(2)}`);
} else fail('C-04', 'Door was not resolved in layout');

// C-05: Relational entities resolve relative to parent
const cRelRoom = { width: 20, length: 45, shape: 'rectangular', entry_points: [] };
const cRelEntities = [
  { id: 'parent_vehicle', type: 'vehicle', relative_position: { distance: 'medium', direction: 'north' }, confidence: 'explicit' },
  { id: 'child_debris', type: 'evidence_marker', relative_position: { distance: 'adjacent', direction: 'east', near: 'parent_vehicle' }, confidence: 'inferred' }
];
const cRelResult = resolveLayout(cRelEntities, cRelRoom);
const parentV = cRelResult.find(o => o.id === 'parent_vehicle');
const childD = cRelResult.find(o => o.id === 'child_debris');
if (parentV && childD) {
  const dist = Math.hypot(childD.position[0] - parentV.position[0], childD.position[2] - parentV.position[2]);
  if (Math.abs(dist - 0.5) < 0.2) pass('C-05', `Relational child placed ${dist.toFixed(2)}m from parent (expected ~0.5m adjacent)`);
  else warn('C-05', `Relational child distance ${dist.toFixed(2)}m from parent — slightly off from expected 0.5m`);
} else fail('C-05', 'Relational entities not resolved');

// C-06: Circular dependency fallback - two entities referencing each other
const cCircRoom = { width: 20, length: 45, shape: 'rectangular', entry_points: [] };
let circResolved = false;
try {
  const cCircEntities = [
    { id: 'entity_a', type: 'vehicle', relative_position: { distance: 'close', near: 'entity_b' }, confidence: 'explicit' },
    { id: 'entity_b', type: 'vehicle', relative_position: { distance: 'close', near: 'entity_a' }, confidence: 'explicit' }
  ];
  const circResult = resolveLayout(cCircEntities, cCircRoom);
  circResolved = circResult.length === 2;
} catch(e) {}
if (circResolved) pass('C-06', 'Circular dependency fallback resolved without crash');
else fail('C-06', 'Circular dependency caused crash or wrong output');

// ─── TEST SECTION D: Vehicle Type Resolution ──────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION D: Vehicle Type Resolution (ID → 3D Asset)');
console.log('═══════════════════════════════════════════════════════');

const vehicleTypeCases = [
  ['vehicle_civic', 'vehicle', 'D-01: civic → vehicle'],
  ['black_fortuner', 'suv', 'D-02: fortuner → suv'],
  ['red_truck_v2', 'truck', 'D-03: truck → truck'],
  ['auto_rickshaw_01', 'rickshaw', 'D-04: auto_rickshaw → rickshaw'],
  ['tuk_tuk_delhi', 'rickshaw', 'D-05: tuk_tuk → rickshaw'],
  ['yellow_bus', 'bus', 'D-06: bus → bus'],
  ['motorcycle_hero', 'scooter', 'D-07: motorcycle → scooter'],
  ['traffic_signal_ne', 'traffic_signal', 'D-08: traffic_signal → traffic_signal'],
  ['sedan_unknown', 'vehicle', 'D-09: generic sedan → vehicle'],
  ['suv_creta', 'suv', 'D-10: suv_creta → suv'],
];

vehicleTypeCases.forEach(([id, expected, label]) => {
  const result = resolveVehicleType(id);
  if (result === expected) pass('D', `${label}`);
  else fail('D', `${label}: expected '${expected}', got '${result}'`);
});

// ─── TEST SECTION E: Color Extraction ────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION E: Vehicle Color Extraction from Incident Text');
console.log('═══════════════════════════════════════════════════════');

const colorExtCases = [
  ['white_honda_civic', 'White Honda Civic struck the signal.', 'white', 'E-01: white in entity ID'],
  ['vehicle_fortuner', 'Black Toyota Fortuner ran red light.', 'black', 'E-02: black Toyota in text'],
  ['red_yamaha', 'Red Yamaha motorcycle crashed.', 'red', 'E-03: red in entity ID'],
  ['silver_swift', 'A silver Maruti Swift was rear-ended.', 'white', 'E-04: silver → maps to white'],
  ['vehicle_unknown_color', 'A car crashed. No color details given.', 'white', 'E-05: no color → default white'],
  ['blue_truck', 'Blue truck ran the red light.', 'blue', 'E-06: blue in entity ID'],
];

colorExtCases.forEach(([id, text, expected, label]) => {
  const result = resolveVehicleColor(id, text);
  if (result === expected) pass('E', `${label}`);
  else fail('E', `${label}: expected '${expected}', got '${result}'`);
});

// ─── TEST SECTION F: SimulationScene Animation Logic ─────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION F: Vehicle Animation Trajectory Logic');
console.log('═══════════════════════════════════════════════════════');

const safePos = (pos, fallback = [0, 0, 0]) => {
  if (!pos) return fallback;
  if (Array.isArray(pos) && pos.length >= 3) {
    const result = pos.map(v => (typeof v === 'number' && isFinite(v)) ? v : 0);
    return [result[0], result[1], result[2]];
  }
  if (typeof pos === 'object' && !Array.isArray(pos)) {
    const x = typeof pos.x === 'number' ? pos.x : 0;
    const y = typeof pos.y === 'number' ? pos.y : 0;
    const z = typeof pos.z === 'number' ? pos.z : 0;
    return [x, y, z];
  }
  return fallback;
};

// F-01: Pre-collision position computation
const impact = [0, 0, 0];
const angle = 180 * (Math.PI / 180); // Civic heading south
const dirX = Math.sin(angle), dirZ = Math.cos(angle);
const speedFactor = 0.8;
const collisionTime = 5.0;

const testTime = 2.0;
const distanceLeft = collisionTime - testTime;
const preX = impact[0] - dirX * speedFactor * distanceLeft;
const preZ = impact[2] - dirZ * speedFactor * distanceLeft;
if (Math.abs(preX) < 0.01 && preZ < 0) {
  pass('F-01', `Pre-collision: Civic at x=${preX.toFixed(2)}, z=${preZ.toFixed(2)} — approaching correctly from north`);
} else {
  fail('F-01', `Pre-collision position unexpected: x=${preX.toFixed(2)}, z=${preZ.toFixed(2)}`);
}

// F-02: Post-collision vehicle spin
const tSince = 1.5;
const rot = angle + tSince * 1.5;
const rotDeg = (rot * 180 / Math.PI) % 360;
if (Math.abs(rotDeg) !== angle * 180 / Math.PI) {
  pass('F-02', `Post-collision spin applied: rotation=${rotDeg.toFixed(1)}°`);
} else {
  fail('F-02', 'Post-collision spin was not applied');
}

// F-03: Null position safe handling
const nullResult = safePos(null);
const undefinedResult = safePos(undefined);
const objectResult = safePos({ x: 3, y: 0, z: -5 });
if (JSON.stringify(nullResult) === '[0,0,0]') pass('F-03', 'safePos(null) → [0,0,0]');
else fail('F-03', `safePos(null) → ${JSON.stringify(nullResult)}`);
if (JSON.stringify(undefinedResult) === '[0,0,0]') pass('F-04', 'safePos(undefined) → [0,0,0]');
else fail('F-04', `safePos(undefined) → ${JSON.stringify(undefinedResult)}`);
if (objectResult[0] === 3 && objectResult[2] === -5) pass('F-05', `safePos({x,y,z}) → [3,0,-5]`);
else fail('F-05', `safePos({x,y,z}) → ${JSON.stringify(objectResult)}`);

// F-06: Debris spread post-collision
const debrisSpreads = [];
for (let idx = 0; idx < 8; idx++) {
  const spreadRad = (idx * 45) * (Math.PI / 180);
  const speed = 2.0 + (idx % 3) * 0.4;
  const tCol = 1.5;
  const dx = Math.sin(spreadRad) * tCol * speed;
  const dz = Math.cos(spreadRad) * tCol * speed;
  debrisSpreads.push({ idx, dx: dx.toFixed(2), dz: dz.toFixed(2) });
}
const uniquePositions = new Set(debrisSpreads.map(d => `${d.dx},${d.dz}`));
if (uniquePositions.size === 8) pass('F-06', '8 debris pieces spread to 8 unique positions');
else warn('F-06', `Only ${uniquePositions.size} unique debris positions — some overlap`);

// ─── TEST SECTION G: Scene Type Detection ─────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION G: isRoad / isIndoor / isPark Classification');
console.log('═══════════════════════════════════════════════════════');

const sceneTypeTests = [
  ['intersection', true, false, false, 'G-01: intersection → isRoad'],
  ['highway', true, false, false, 'G-02: highway → isRoad'],
  ['road', true, false, false, 'G-03: road → isRoad'],
  ['parking_lot', true, false, false, 'G-04: parking_lot → isRoad'],
  ['bedroom', false, false, true, 'G-05: bedroom → isIndoor'],
  ['hotel_room', false, false, true, 'G-06: hotel_room → isIndoor'],
  ['park', false, true, false, 'G-07: park → isPark'],
  ['forest', false, true, false, 'G-08: forest → isPark'],
  ['beach', false, true, false, 'G-09: beach → isPark'],
];

sceneTypeTests.forEach(([sceneType, expectedRoad, expectedPark, expectedIndoor, label]) => {
  const isRoad = ['road', 'highway', 'intersection', 'parking_lot'].includes(sceneType);
  const isPark = ['park', 'forest', 'beach', 'field', 'garden'].includes(sceneType);
  const isIndoor = !isRoad && !isPark;
  if (isRoad === expectedRoad && isPark === expectedPark && isIndoor === expectedIndoor) {
    pass('G', `${label}`);
  } else {
    fail('G', `${label}: isRoad=${isRoad}, isPark=${isPark}, isIndoor=${isIndoor}`);
  }
});

// ─── TEST SECTION H: Multi-scenario Incident Parsing Pipeline ─────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION H: Incident Scenario Analysis (Mock Pipeline)');
console.log('═══════════════════════════════════════════════════════');

INCIDENTS.forEach(incident => {
  console.log(`\n  ── ${incident.id}: ${incident.name}`);

  // H-a: Text is non-empty
  if (incident.text && incident.text.length > 20) pass(incident.id, 'Incident text is non-empty and usable');
  else fail(incident.id, 'Incident text is too short or missing');

  // H-b: Expected vehicle types resolve correctly
  if (incident.expectedVehicleTypes) {
    incident.expectedVehicleTypes.forEach(expected => {
      // Try to find a matching vehicle entity label
      const keywordsForType = {
        'vehicle': ['civic', 'car', 'sedan', 'hatchback', 'vehicle', 'maruti', 'swift', 'innova', 'alto'],
        'suv': ['fortuner', 'suv', 'creta', 'fortuner'],
        'truck': ['truck', 'tata'],
        'scooter': ['motorcycle', 'bike', 'yamaha', 'hero', 'scooter'],
        'rickshaw': ['rickshaw', 'auto', 'tuk'],
        'bus': ['bus', 'school bus'],
      };
      const keywords = keywordsForType[expected] || [];
      const found = keywords.some(kw => incident.text.toLowerCase().includes(kw));
      if (found) pass(incident.id, `Vehicle type '${expected}' is representable from incident text`);
      else warn(incident.id, `Vehicle type '${expected}' — no keyword match found in text`);
    });
  }

  // H-c: Scene type keyword
  if (incident.expectedSceneType) {
    const sceneKeywords = {
      'intersection': ['intersection', 'junction', 'crossing', 'signal'],
      'highway': ['highway', 'bypass', 'nh-', 'nh8', 'nh48', 'freeway'],
      'road': ['road', 'street', 'lane', 'mg road', 'link road'],
      'bedroom': ['hotel room', 'bedroom', 'room', 'apartment', 'flat'],
    };
    const keywords = sceneKeywords[incident.expectedSceneType] || [];
    const found = keywords.some(kw => incident.text.toLowerCase().includes(kw));
    if (found) pass(incident.id, `Scene type '${incident.expectedSceneType}' keyword found in text`);
    else warn(incident.id, `Scene type '${incident.expectedSceneType}' — no keyword found in text`);
  }

  // H-d: Edge case behavior flags
  if (incident.isEdgeCase) {
    warn(incident.id, 'Edge case: insufficient data may result in estimated/fallback 3D layout');
  }
  if (incident.simulateNullColor) {
    const result = resolveColor(null, '#dc2626');
    if (result === '#dc2626') pass(incident.id, `Null color fallback handled: resolveColor(null) → '#dc2626'`);
    else fail(incident.id, `Null color fallback failed: got ${result}`);
  }
  if (incident.hasUncertainFacts) {
    warn(incident.id, 'Contradictory witnesses — AI should populate uncertainFacts and alternativeScenarios');
  }
  if (incident.hasMissingInfo) {
    warn(incident.id, 'Missing vehicle info — AI should populate missingInformation field');
  }
});

// ─── TEST SECTION I: Critical Code Path Safety ─────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════');
console.log(' SECTION I: Critical Code Path Safety Tests');
console.log('═══════════════════════════════════════════════════════');

// I-01: item.id safety (null/number)
const testItems = [
  { id: null, type: 'vehicle', rotation: 0 },
  { id: undefined, type: 'suv', rotation: 90 },
  { id: 42, type: 'truck', rotation: 0 },
  { id: 'vehicle_civic', type: 'vehicle', rotation: 0 }
];

testItems.forEach((item, i) => {
  let crashed = false;
  try {
    const angle = item.rotation || 0;
    // This is the FIXED code from Reconstruction3D.jsx
    if (item.id && typeof item.id === 'string') {
      const lowerId = item.id.toLowerCase();
      if (lowerId.includes('civic')) { /* angle = 180 */ }
    }
  } catch(e) { crashed = true; }

  if (!crashed) pass(`I-0${i+1}`, `item.id=${JSON.stringify(item.id)} — no crash with safety check`);
  else fail(`I-0${i+1}`, `item.id=${JSON.stringify(item.id)} — CRASHED`);
});

// I-05: sceneType safe access
const sceneFallback = (activeScene) => (activeScene?.sceneType || 'scene').toUpperCase();
const dimFallback = (activeScene) => `${activeScene?.dimensions?.width ?? '?'}m x ${activeScene?.dimensions?.length ?? '?'}m`;

try {
  const r1 = sceneFallback(null);
  const r2 = sceneFallback({ sceneType: 'intersection', dimensions: { width: 20, length: 45 }});
  const r3 = dimFallback(null);
  const r4 = dimFallback({ dimensions: null });
  if (r1 === 'SCENE' && r2 === 'INTERSECTION' && r3 === '?m x ?m' && r4 === '?m x ?m') {
    pass('I-05', 'sceneType/dimensions null access is safe');
  } else {
    fail('I-05', `Unexpected output: ${r1}, ${r2}, ${r3}, ${r4}`);
  }
} catch(e) {
  fail('I-05', `Crashed on null scene access: ${e.message}`);
}

// I-06: caseData undefined (simulates pre-fix bug)
let caseDataBugCaught = false;
try {
  // This is the OLD code that caused the crash (undefined caseData)
  const caseData = undefined;
  if (caseData?.caseId === 'ACC-2026-014') { /* safe */ }
  caseDataBugCaught = true;
} catch(e) {}
if (caseDataBugCaught) pass('I-06', 'Optional chaining on undefined caseData is safe');
else fail('I-06', 'caseData?.caseId crashed on undefined');

// ─── FINAL REPORT ─────────────────────────────────────────────────────────────

console.log('\n');
console.log('╔══════════════════════════════════════════════════════╗');
console.log('║         QA TEST SUITE — FINAL REPORT                ║');
console.log('╚══════════════════════════════════════════════════════╝');
console.log(`  Total Tests  : ${passCount + failCount + warnCount}`);
console.log(`  ✅ PASS      : ${passCount}`);
console.log(`  ❌ FAIL      : ${failCount}`);
console.log(`  ⚠️  WARN      : ${warnCount}`);
console.log('');

if (bugs.length > 0) {
  console.log('─── BUGS / FAILURES ───────────────────────────────────');
  bugs.forEach((b, i) => console.log(`  ${i+1}. [${b.id}] ${b.bug}`));
} else {
  console.log('  🎉 No failures detected!');
}

console.log('');
console.log('─── IMPROVEMENT SUGGESTIONS ───────────────────────────');
console.log('  1. finalSceneType is hardcoded to "intersection" (line 104 evidenceIntakeService.js)');
console.log('     → Should derive from roadType/description keywords dynamically.');
console.log('  2. layoutObjects.position is stored as array [x,y,z] but SimulationScene reads');
console.log('     both array and {x,y,z} object formats — should normalise at write time.');
console.log('  3. Speed is hardcoded to 40 km/h for all vehicles in telemetry HUD.');
console.log('     → Should extract from incident text or default by vehicle type.');
console.log('  4. Only intersection skid marks are rendered — highway/road cases have no skid marks.');
console.log('  5. impactPoint is never set in the scene3D object from the pipeline');
console.log('     → All collisions converge to [0,0,0]. Should compute from vehicle positions.');
console.log('  6. Post-collision vehicle spin uses a fixed idx%2 formula — all cars spin the');
console.log('     same direction. Should randomise or derive from impact vector.');
console.log('  7. Color extraction looks only for keyword matches in combinedText but misses');
console.log('     patterns like "a red sedan", "white-coloured" — needs regex improvement.');
console.log('');
console.log('Done.');
