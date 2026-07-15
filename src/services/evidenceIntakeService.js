import { getEvidenceByCase } from './evidenceService';
import { getCaseById } from './firestore';
import { callGeminiWithStructuredOutput } from './geminiService';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { extractSceneEntities } from './reconstructionPipeline/sceneExtractor';
import { resolveLayout } from './reconstructionPipeline/layoutResolver';

// Schema for extracting textual analysis details (excluding 3D scene)
const incidentDetailsSchema = {
  type: "OBJECT",
  properties: {
    executiveSummary: { type: "STRING" },
    incidentType: { type: "STRING" },
    vehiclesDetected: { type: "ARRAY", items: { type: "STRING" } },
    peopleDetected: { type: "ARRAY", items: { type: "STRING" } },
    roadLayout: { type: "STRING" },
    trafficSignsSignals: { type: "ARRAY", items: { type: "STRING" } },
    weather: { type: "STRING" },
    lightingConditions: { type: "STRING" },
    timelineClues: { type: "ARRAY", items: { type: "STRING" } },
    objectsDetected: { type: "ARRAY", items: { type: "STRING" } },
    knownFacts: { type: "ARRAY", items: { type: "STRING" } },
    uncertainFacts: { type: "ARRAY", items: { type: "STRING" } },
    missingInformation: { type: "ARRAY", items: { type: "STRING" } },
    observations: { type: "ARRAY", items: { type: "STRING" } },
    confidenceScore: { type: "NUMBER" },
    additionalNotes: { type: "STRING" },
    alternativeScenarios: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: { type: "STRING", description: "Scenario ID/Title, e.g. Scenario A, Scenario B" },
          probability: { type: "NUMBER", description: "Probability percentage (0-100)" },
          description: { type: "STRING", description: "Explanation of how the accident happened in this scenario" },
          isMostLikely: { type: "BOOLEAN", description: "Whether this is the most likely scenario" },
          parameters: { type: "ARRAY", items: { type: "STRING" }, description: "Tags of key factors, e.g. Speeding, Red Light, Distraction" }
        },
        required: ["title", "probability", "description", "isMostLikely", "parameters"]
      }
    }
  },
  required: [
    "executiveSummary",
    "incidentType",
    "vehiclesDetected",
    "peopleDetected",
    "weather",
    "lightingConditions",
    "confidenceScore",
    "alternativeScenarios"
  ]
};

export const analyzeEvidence = async (caseId) => {
  if (!caseId) throw new Error("No case ID provided for analysis.");

  try {
    const caseData = await getCaseById(caseId);
    const evidenceList = await getEvidenceByCase(caseId);

    // 1. Gather all case text for the LLM context
    let combinedText = `Case Title: ${caseData?.caseTitle || caseData?.title || 'Accident Investigation'}\n`;
    combinedText += `Description: ${caseData?.description || 'No description'}\n`;
    combinedText += `Road Type: ${caseData?.roadType || 'Unknown'}\n`;
    combinedText += `Weather: ${caseData?.weather || 'Clear'}\n`;
    combinedText += `Visibility: ${caseData?.visibility || 'Good'}\n`;
    combinedText += `Officer notes: ${caseData?.additionalNotes || ''}\n`;

    if (caseData?.chatInvestigation?.conversation) {
      combinedText += `Chat observations:\n`;
      caseData.chatInvestigation.conversation.forEach(m => {
        combinedText += `${m.sender}: ${m.text}\n`;
      });
    }

    combinedText += `Uploaded Evidence:\n`;
    evidenceList.forEach((ev, idx) => {
      combinedText += `- Evidence ${idx + 1}: Type: ${ev.type}, Name: ${ev.originalName || 'Unnamed'}\n`;
    });

    let contextPrompt = `You are an expert forensic investigator. Analyze the following evidence case context to provide incident analysis:\n\n`;
    contextPrompt += combinedText;
    contextPrompt += `\nProvide a comprehensive structured analysis of the incident. Note: Return ONLY the JSON structure matching the schema.`;

    // 2. Call Gemini for incident textual details
    console.log("Analyzing general incident details...");
    const generalDetails = await callGeminiWithStructuredOutput({
      prompt: contextPrompt,
      schema: incidentDetailsSchema,
      model: 'gemini-3.1-flash-lite'
    });

    // 3. Stage 1: Call sceneExtractor to get structured entities (no raw coordinates)
    console.log("Stage 1: Extracting structured scene entities...");
    const extraction = await extractSceneEntities(combinedText);

    // 4. Stage 2: Call layoutResolver to deterministically compute coordinates & rotations
    console.log("Stage 2: Resolving deterministic layout...");
    const resolvedLayout = resolveLayout(extraction.entities, extraction.room);

    // 5. Derive sceneType from caseData.roadType or description keywords
    const roadTypeRaw = (caseData?.roadType || caseData?.description || '').toLowerCase();
    let finalSceneType = 'intersection'; // default
    if (roadTypeRaw.includes('highway') || roadTypeRaw.includes('nh-') || roadTypeRaw.includes('nh8') || roadTypeRaw.includes('bypass') || roadTypeRaw.includes('freeway')) {
      finalSceneType = 'highway';
    } else if (roadTypeRaw.includes('parking') || roadTypeRaw.includes('car park')) {
      finalSceneType = 'parking_lot';
    } else if (roadTypeRaw.includes('indoor') || roadTypeRaw.includes('room') || roadTypeRaw.includes('apartment') || roadTypeRaw.includes('hotel') || roadTypeRaw.includes('house') || roadTypeRaw.includes('flat') || roadTypeRaw.includes('bedroom') || roadTypeRaw.includes('office')) {
      finalSceneType = 'bedroom';
    } else if (roadTypeRaw.includes('intersection') || roadTypeRaw.includes('junction') || roadTypeRaw.includes('crossing') || roadTypeRaw.includes('signal')) {
      finalSceneType = 'intersection';
    } else if (roadTypeRaw.includes('road') || roadTypeRaw.includes('street') || roadTypeRaw.includes('lane') || roadTypeRaw.includes('avenue')) {
      finalSceneType = 'road';
    }

    const layoutObjects = [];
    const actors = [];
    const evidenceListMapped = [];

    resolvedLayout.forEach(item => {
      // Find original entity to check classification
      const originalEntity = extraction.entities.find(e => e.id === item.id) ||
                             extraction.room.entry_points.find(ep => ep.id === item.id);
      
      const typeStr = originalEntity?.type || item.type;

      if (typeStr === 'body') {
        const isVictim = item.id.toLowerCase().includes('victim') || item.id.toLowerCase().includes('body');
        actors.push({
          id: item.id,
          type: isVictim ? 'victim' : 'suspect',
          label: item.id.replace(/_/g, ' '),
          posture: originalEntity?.state || 'prone',
          position: item.position
        });
      } else if (['blood_stain', 'weapon', 'evidence_marker'].includes(typeStr)) {
        evidenceListMapped.push({
          type: typeStr,
          position: item.position,
          label: `${item.id.replace(/_/g, ' ')} (${originalEntity?.state || 'recorded'})`
        });
      } else {
        // furniture, vehicle, door, window, other
        let resolvedType = item.type;
        const lowerId = item.id.toLowerCase();
        if (lowerId.includes('signal') || lowerId.includes('light')) {
          resolvedType = 'traffic_signal';
        } else if (lowerId.includes('rickshaw') || lowerId.includes('tuk_tuk') || lowerId.includes('tuk-tuk') || lowerId.includes('auto')) {
          resolvedType = 'rickshaw';
        } else if (lowerId.includes('truck')) {
          resolvedType = 'truck';
        } else if (lowerId.includes('suv') || lowerId.includes('fortuner')) {
          resolvedType = 'suv';
        }

        let color = 'white';
        const isVehicleObj = ['vehicle', 'car', 'suv', 'truck', 'scooter', 'rickshaw', 'bus'].includes(resolvedType);
        if (isVehicleObj) {
          // Detect color from entity ID and full incident narration using robust regex
          const idStr = item.id.toLowerCase();
          const text = combinedText.toLowerCase();

          // Priority 1: Color keyword directly in entity ID
          const colorInId = (() => {
            if (idStr.includes('white') || idStr.includes('silver')) return 'white';
            if (idStr.includes('black')) return 'black';
            if (idStr.includes('red')) return 'red';
            if (idStr.includes('blue')) return 'blue';
            if (idStr.includes('yellow')) return 'yellow';
            if (idStr.includes('green')) return 'green';
            if (idStr.includes('grey') || idStr.includes('gray')) return 'grey';
            if (idStr.includes('orange')) return 'orange';
            return null;
          })();

          if (colorInId) {
            color = colorInId;
          } else {
            // Priority 2: Regex scan for "<color> <vehicle_brand_or_type>" patterns in narration text
            const colorMap = {
              white: /\b(white|silver|pearl|ivory)\b/,
              black: /\b(black|dark|charcoal)\b/,
              red: /\b(red|crimson|maroon|scarlet)\b/,
              blue: /\b(blue|navy|cobalt|azure)\b/,
              yellow: /\b(yellow|gold|golden)\b/,
              green: /\b(green|olive|teal|lime)\b/,
              grey: /\b(grey|gray|graphite|slate)\b/,
              orange: /\b(orange|amber)\b/,
              brown: /\b(brown|beige|tan)\b/,
            };
            // Extract the vehicle name hint from entity ID (e.g. 'civic', 'fortuner', 'yamaha')
            const idWords = idStr.replace(/_/g, ' ').replace(/vehicle|car|auto|v[0-9]+/g, '').trim();
            // Scan 40 characters around any vehicle keyword mention in the text
            let detectedColor = null;
            for (const [col, regex] of Object.entries(colorMap)) {
              if (idWords.length > 2 && text.includes(idWords) && regex.test(text.substring(Math.max(0, text.indexOf(idWords) - 30), text.indexOf(idWords) + 30))) {
                detectedColor = col;
                break;
              }
            }
            // Priority 3: Scan entire text for first colour mention near any vehicle keyword
            if (!detectedColor) {
              const vehicleKeywords = ['honda', 'toyota', 'maruti', 'tata', 'yamaha', 'hyundai', 'mahindra', 'ford', 'swift', 'civic', 'creta', 'fortuner', 'innova', 'bus', 'truck', 'motorcycle', 'bike', 'scooter', 'car', 'sedan', 'suv', 'vehicle'];
              for (const vkw of vehicleKeywords) {
                const idx = text.indexOf(vkw);
                if (idx !== -1) {
                  const snippet = text.substring(Math.max(0, idx - 25), idx + 25);
                  for (const [col, regex] of Object.entries(colorMap)) {
                    if (regex.test(snippet)) { detectedColor = col; break; }
                  }
                  if (detectedColor) break;
                }
              }
            }
            color = detectedColor || 'white'; // fallback to white
          }
        } else if (resolvedType === 'traffic_signal') {
          color = 'black';
        } else if (resolvedType === 'blood_stain') {
          color = 'red';
        } else if (resolvedType === 'furniture') {
          color = 'brown';
        }

        layoutObjects.push({
          id: item.id,
          type: resolvedType,
          position: item.position,
          scale: [1, 1, 1],
          rotation: item.rotation,
          color: color
        });
      }
    });

    // Construct final compatible scene3D block
    const scene3D = {
      sceneType: finalSceneType,
      dimensions: {
        width: extraction.room.width,
        length: extraction.room.length
      },
      layoutObjects,
      actors,
      evidenceList: evidenceListMapped,
      isEstimated: extraction.entities.some(e => e.confidence === 'inferred')
    };

    // Bundle analysis
    const finalAnalysis = {
      ...generalDetails,
      scene3D
    };

    // Save to Firestore
    const caseRef = doc(db, 'cases', caseId);
    await updateDoc(caseRef, {
      aiAnalysis: finalAnalysis,
      updatedAt: new Date().toISOString()
    });

    console.log("Analysis completed successfully!");
    return finalAnalysis;
  } catch (error) {
    console.error("Evidence Intake Service error:", error);
    throw error;
  }
};
