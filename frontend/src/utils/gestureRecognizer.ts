export interface Point {
  x: number;
  y: number;
  z: number;
}

// Calculate Euclidean distance between two 3D landmarks
export const calculateDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
};

export interface GestureResult {
  gestureName: string;
  confidence: number;
}

export const recognizeGesture = (
  landmarks: Point[]
): GestureResult => {
  if (!landmarks || landmarks.length < 21) {
    return { gestureName: 'No Hand', confidence: 0 };
  }

  // Helper values
  const thumbTip = landmarks[4];
  const thumbBase = landmarks[2];
  
  const indexTip = landmarks[8];
  const indexPip = landmarks[6];
  const indexMcp = landmarks[5];

  const middleTip = landmarks[12];
  const middlePip = landmarks[10];
  const middleMcp = landmarks[9];

  const ringTip = landmarks[16];
  const ringPip = landmarks[14];

  const pinkyTip = landmarks[20];
  const pinkyPip = landmarks[18];

  // 1. Determine which fingers are extended
  // Standard finger is extended if tip y-coord is above pip y-coord (lower Y is higher in coordinate space)
  const isIndexExtended = indexTip.y < indexPip.y;
  const isMiddleExtended = middleTip.y < middlePip.y;
  const isRingExtended = ringTip.y < ringPip.y;
  const isPinkyExtended = pinkyTip.y < pinkyPip.y;

  // For thumb, it's extended if it's far from the base of the middle finger (MCP)
  const thumbIndexDist = calculateDistance(thumbTip, middleMcp);
  const isThumbExtended = thumbIndexDist > 0.08;

  // Calculate pinch distance between index tip and thumb tip
  const pinchDist = calculateDistance(thumbTip, indexTip);
  const isPinching = pinchDist < 0.035;

  // 2. Classify based on combination of finger states
  
  // Pinch Gesture - high priority, because thumb and index are touching
  if (isPinching) {
    // Return Pinch with higher confidence the closer they are
    const confidence = Math.max(0.6, 1.0 - (pinchDist / 0.035) * 0.4);
    return { gestureName: 'Pinch', confidence };
  }

  // Open Palm: all fingers extended
  if (isIndexExtended && isMiddleExtended && isRingExtended && isPinkyExtended && isThumbExtended) {
    return { gestureName: 'Open Palm', confidence: 0.95 };
  }

  // Closed Fist: all major fingers folded
  if (!isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    // Check if thumb is folded too (lying across palm/fingers)
    // If other fingers are folded, it's a fist regardless of thumb, but if thumb is folded too, confidence is higher
    const confidence = isThumbExtended ? 0.8 : 0.95;
    return { gestureName: 'Closed Fist', confidence };
  }

  // Thumbs Up / Down: Thumb is extended, other fingers folded
  if (isThumbExtended && !isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    // If thumb tip is significantly higher than thumb base
    if (thumbTip.y < thumbBase.y - 0.02) {
      return { gestureName: 'Thumbs Up', confidence: 0.9 };
    }
    // If thumb tip is significantly lower than thumb base
    if (thumbTip.y > thumbBase.y + 0.02) {
      return { gestureName: 'Thumbs Down', confidence: 0.9 };
    }
  }

  // Victory Sign: Index and Middle extended, Ring and Pinky folded
  if (isIndexExtended && isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    // Index and middle tip should be separated
    const tipSeparation = calculateDistance(indexTip, middleTip);
    if (tipSeparation > 0.04) {
      return { gestureName: 'Victory Sign', confidence: 0.92 };
    }
  }

  // Point Left or Right: Index extended, Middle, Ring, Pinky folded
  if (isIndexExtended && !isMiddleExtended && !isRingExtended && !isPinkyExtended) {
    // Check orientation of index finger relative to its base
    const dx = indexTip.x - indexMcp.x;
    const dy = indexTip.y - indexMcp.y;
    
    // Check if finger is pointing mostly horizontally
    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx < -0.04) {
        // Tip is to the left of the base in screen space
        // If image is mirrored, we might invert or align. Usually webcams are mirrored,
        // so pointing visually to the screen's left means dx is negative.
        return { gestureName: 'Point Left', confidence: 0.88 };
      }
      if (dx > 0.04) {
        return { gestureName: 'Point Right', confidence: 0.88 };
      }
    }
  }

  // Fallback
  return { gestureName: 'Unknown', confidence: 0.3 };
};
