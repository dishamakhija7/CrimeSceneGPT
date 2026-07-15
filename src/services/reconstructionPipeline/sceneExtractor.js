import { callGeminiWithStructuredOutput } from '../geminiService';

// Ontology of entity types defined by requirements
export const ENTITY_ONTOLOGY = [
  "body",
  "weapon",
  "blood_stain",
  "furniture",
  "door",
  "window",
  "evidence_marker",
  "vehicle",
  "other"
];

// Compass directions enum
export const DIRECTIONS = [
  "north",
  "south",
  "east",
  "west",
  "northeast",
  "northwest",
  "southeast",
  "southwest"
];

// Distance tiers enum
export const DISTANCE_TIERS = [
  "adjacent",
  "close",
  "medium",
  "far"
];

// Strict JSON Schema matching the specified entities ontology and room bounds
export const extractionSchema = {
  type: "OBJECT",
  properties: {
    room: {
      type: "OBJECT",
      properties: {
        width: { 
          type: "NUMBER", 
          description: "Width of the room/road segment in meters (default 12 if indoor, 20 if outdoor/road)" 
        },
        length: { 
          type: "NUMBER", 
          description: "Length of the room/road segment in meters (default 15 if indoor, 45 if outdoor/road)" 
        },
        shape: { 
          type: "STRING", 
          enum: ["rectangular", "irregular"],
          description: "Basic outline geometry shape of the scene space"
        },
        entry_points: {
          type: "ARRAY",
          description: "Doors, windows, or entrance paths on boundaries",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "STRING", description: "Unique entry point name, e.g. door_front, window_west" },
              type: { type: "STRING", enum: ["door", "window"] },
              wall: { type: "STRING", enum: ["north", "south", "east", "west"] }
            },
            required: ["id", "type", "wall"]
          }
        }
      },
      required: ["width", "length", "shape", "entry_points"]
    },
    entities: {
      type: "ARRAY",
      description: "List of physical objects, markers, or actors inside the scene space",
      items: {
        type: "OBJECT",
        properties: {
          id: { 
            type: "STRING", 
            description: "Unique ID for reference, e.g. victim_body, primary_vehicle, handgun_01" 
          },
          type: { 
            type: "STRING", 
            enum: ENTITY_ONTOLOGY,
            description: "Ontology classification type"
          },
          relative_position: {
            type: "OBJECT",
            properties: {
              near: { 
                type: "STRING", 
                description: "ID of another entity this object is close to. Leave blank/null or empty string if positioned relative to room center." 
              },
              direction: { 
                type: "STRING", 
                enum: ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest"],
                description: "Direction offset relative to room center or the target reference in 'near'"
              },
              distance: { 
                type: "STRING", 
                enum: DISTANCE_TIERS,
                description: "Distance tier offset scale" 
              }
            },
            required: ["distance"]
          },
          orientation: { 
            type: "STRING", 
            description: "Heading or rotation notes, e.g. facing north, angled 45 degrees, or null if unknown" 
          },
          state: { 
            type: "STRING", 
            description: "Condition state, e.g. broken, open, overturned, skid_marks, or null" 
          },
          confidence: { 
            type: "STRING", 
            enum: ["explicit", "inferred"],
            description: "Explicit if stated directly in case text, inferred if deduced by forensic context"
          }
        },
        required: ["id", "type", "relative_position", "confidence"]
      }
    }
  },
  required: ["room", "entities"]
};

/**
 * Validates the raw JSON output from the LLM against our strict business requirements.
 * Returns true if valid, or a string describing the error if invalid.
 */
export const validateExtractedScene = (data) => {
  if (!data || typeof data !== 'object') {
    return "Output is not a valid JSON object.";
  }

  // Validate Room Object
  const room = data.room;
  if (!room) return "Missing 'room' config block.";
  if (typeof room.width !== 'number' || room.width <= 0) {
    return `Invalid room width: ${room.width}. Must be a positive number.`;
  }
  if (typeof room.length !== 'number' || room.length <= 0) {
    return `Invalid room length: ${room.length}. Must be a positive number.`;
  }
  if (!["rectangular", "irregular"].includes(room.shape)) {
    return `Invalid room shape: ${room.shape}. Must be 'rectangular' or 'irregular'.`;
  }
  if (!Array.isArray(room.entry_points)) {
    return "Room 'entry_points' must be an array.";
  }
  for (const ep of room.entry_points) {
    if (!ep.id || typeof ep.id !== 'string') return "Entry point missing 'id' string.";
    if (!["door", "window"].includes(ep.type)) return `Entry point type '${ep.type}' is invalid.`;
    if (!["north", "south", "east", "west"].includes(ep.wall)) return `Entry point wall location '${ep.wall}' is invalid.`;
  }

  // Validate Entities List
  if (!Array.isArray(data.entities)) {
    return "Root level 'entities' must be an array.";
  }

  const existingIds = new Set(room.entry_points.map(ep => ep.id));

  for (const ent of data.entities) {
    if (!ent.id || typeof ent.id !== 'string') {
      return "Entity is missing a unique 'id' string.";
    }
    if (existingIds.has(ent.id)) {
      return `Duplicate entity ID detected: '${ent.id}'. All IDs must be globally unique.`;
    }
    existingIds.add(ent.id);

    if (!ENTITY_ONTOLOGY.includes(ent.type)) {
      return `Entity '${ent.id}' has invalid type: '${ent.type}'. Must be one of: ${ENTITY_ONTOLOGY.join(', ')}`;
    }

    if (!ent.relative_position || typeof ent.relative_position !== 'object') {
      return `Entity '${ent.id}' is missing a 'relative_position' object.`;
    }

    const rel = ent.relative_position;
    if (!DISTANCE_TIERS.includes(rel.distance)) {
      return `Entity '${ent.id}' has invalid relative distance '${rel.distance}'. Must be one of: ${DISTANCE_TIERS.join(', ')}`;
    }

    if (rel.direction && !DIRECTIONS.includes(rel.direction)) {
      return `Entity '${ent.id}' has invalid relative direction '${rel.direction}'. Must be one of: ${DIRECTIONS.join(', ')}`;
    }

    if (!["explicit", "inferred"].includes(ent.confidence)) {
      return `Entity '${ent.id}' has invalid confidence '${ent.confidence}'. Must be 'explicit' or 'inferred'.`;
    }
  }

  // Verify that all 'near' references correspond to existing entity IDs
  for (const ent of data.entities) {
    const nearTarget = ent.relative_position.near;
    if (nearTarget && nearTarget.trim() !== '') {
      if (!existingIds.has(nearTarget)) {
        return `Entity '${ent.id}' references a non-existent 'near' entity target ID: '${nearTarget}'.`;
      }
      if (nearTarget === ent.id) {
        return `Entity '${ent.id}' cannot have 'near' point to itself.`;
      }
    }
  }

  return true;
};

/**
 * Stage 1 scene extractor. Calls Gemini with structured output, verifies schema,
 * and retries once with detailed errors if validation fails.
 * 
 * @param {string} incidentText - Incident text narration or combined case description.
 * @returns {Promise<Object>} The validated extracted schema with rooms and entities.
 */
export const extractSceneEntities = async (incidentText) => {
  const basePrompt = `You are a forensic scene investigator AI. Extract the room details and all physical entities described in the accident or crime scene narration below.
  
  Do NOT estimate coordinates, rotations, or positions as coordinates. You must only describe relative relationships using the JSON schema.
  
  Ontology types to map:
  - body (Victims, pedestrians, or suspects)
  - vehicle (Cars, trucks, scooters, etc.)
  - weapon (Guns, knives, blunt objects)
  - blood_stain (Fluid splatters or drip patterns)
  - furniture (Beds, desks, chairs, tables, shelves, crates)
  - door / window (Openings, exit points)
  - evidence_marker (Cell phones, casings, skid marks, debris)
  - other (Other mentioned items)

  Case Text Narration:
  "${incidentText}"`;

  let prompt = `${basePrompt}\n\nReturn the result matching the provided JSON schema.`;
  
  try {
    // Attempt 1
    const response = await callGeminiWithStructuredOutput({
      prompt,
      schema: extractionSchema,
      model: 'gemini-3.1-flash-lite'
    });

    const validationResult = validateExtractedScene(response);
    if (validationResult === true) {
      return response;
    }

    // Validation failed, retry once with validation error context
    console.warn(`Structured extraction validation failed on attempt 1: ${validationResult}. Retrying...`);
    const retryPrompt = `${basePrompt}
    
    WARNING: Your previous response was invalid.
    Validation Error details: ${validationResult}
    Please output corrected data strictly adhering to the schema and constraints.`;

    const retryResponse = await callGeminiWithStructuredOutput({
      prompt: retryPrompt,
      schema: extractionSchema,
      model: 'gemini-3.1-flash-lite'
    });

    const finalValidation = validateExtractedScene(retryResponse);
    if (finalValidation === true) {
      return retryResponse;
    }

    throw new Error(`Stage 1 scene extraction failed schema validation on retry: ${finalValidation}`);
  } catch (error) {
    console.error("Stage 1 Extraction Error:", error);
    throw error;
  }
};
