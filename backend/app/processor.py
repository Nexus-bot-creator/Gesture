import math
from typing import List, Dict, Tuple, Optional

class HandGestureProcessor:
  def __init__(self, ema_alpha: float = 0.25, pinch_threshold: float = 0.04):
    """
    ema_alpha: Smoothing factor for Exponential Moving Average (0 < alpha <= 1). Lower means smoother.
    pinch_threshold: 3D Euclidean distance threshold for thumb and index tip touch.
    """
    self.ema_alpha = ema_alpha
    self.pinch_threshold = pinch_threshold
    
    # State tracking for smoothing cursor coordinates
    self.last_x: Optional[float] = None
    self.last_y: Optional[float] = None

  def calculate_distance_3d(self, p1: Dict[str, float], p2: Dict[str, float]) -> float:
    """Calculates 3D Euclidean distance between two points."""
    return math.sqrt(
      (p1['x'] - p2['x']) ** 2 +
      (p1['y'] - p2['y']) ** 2 +
      (p1['z'] - p2['z']) ** 2
    )

  def process_landmarks(self, landmarks: List[Dict[str, float]]) -> Tuple[float, float, bool]:
    """
    Processes the list of 21 hand landmarks.
    landmarks: A list of dicts with keys 'x', 'y', 'z' (normalized 0 to 1).
    Returns:
      smoothed_x (float): Mirrored & smoothed cursor X coordinate (0 to 1).
      smoothed_y (float): Smoothed cursor Y coordinate (0 to 1).
      is_pinching (bool): Whether a pinch-click is detected.
    """
    if not landmarks or len(landmarks) < 21:
      # Return default values if no hand detected or incomplete points
      return 0.5, 0.5, False

    # Get Index Tip (Landmark 8) and Thumb Tip (Landmark 4)
    thumb_tip = landmarks[4]
    index_tip = landmarks[8]

    # 1. Calculate 3D Euclidean pinch distance
    pinch_dist = self.calculate_distance_3d(thumb_tip, index_tip)
    is_pinching = pinch_dist < self.pinch_threshold

    # 2. Mirror and smooth cursor coordinates
    # We use the Index Finger Tip (Landmark 8) as the cursor pointer.
    # Mirror the X coordinate: (1 - index_tip['x']) so that pointing right moves cursor right
    raw_cursor_x = 1.0 - index_tip['x']
    raw_cursor_y = index_tip['y']

    # Apply Exponential Moving Average (EMA) smoothing
    if self.last_x is None or self.last_y is None:
      # Initialize state
      smoothed_x = raw_cursor_x
      smoothed_y = raw_cursor_y
    else:
      smoothed_x = self.ema_alpha * raw_cursor_x + (1.0 - self.ema_alpha) * self.last_x
      smoothed_y = self.ema_alpha * raw_cursor_y + (1.0 - self.ema_alpha) * self.last_y

    # Save state
    self.last_x = smoothed_x
    self.last_y = smoothed_y

    return smoothed_x, smoothed_y, is_pinching

  def reset_state(self):
    """Resets cursor smoothing history when tracking is lost."""
    self.last_x = None
    self.last_y = None
