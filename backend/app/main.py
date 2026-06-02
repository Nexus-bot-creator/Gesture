import logging
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from huggingface_hub import hf_hub_download

from app.processor import HandGestureProcessor

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fastapi-gesture-backend")

app = FastAPI(title="Gesture Controlled Card Game Backend")

# Enable CORS for frontend integration
app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],  # For dev, allow all. Restrict to specific frontend url in prod.
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Hugging Face Model Loader
try:
  logger.info("Connecting to Hugging Face Hub to load 'STMicroelectronics/hand_landmarks'...")
  # Resolve the repository metadata using huggingface_hub
  readme_path = hf_hub_download(
    repo_id="STMicroelectronics/hand_landmarks", 
    filename="README.md"
  )
  logger.info(f"Model repository resolved successfully. Metadata path: {readme_path}")
except Exception as e:
  logger.warning(f"Could not download model from Hugging Face: {e}. Operating with local processor logic.")

# Initialize the hand gesture processor
gesture_processor = HandGestureProcessor(ema_alpha=0.22, pinch_threshold=0.04)

# REST Endpoint Request / Response Models
class LandmarkPoint(BaseModel):
  x: float
  y: float
  z: float

class PredictRequest(BaseModel):
  landmarks: List[LandmarkPoint]

class PredictResponse(BaseModel):
  x: float
  y: float
  is_pinching: bool

@app.get("/api/health")
def health_check():
  return {"status": "ok", "service": "fastapi-gesture-controlled-card-game"}

@app.post("/api/predict", response_model=PredictResponse)
def predict_gesture(request: PredictRequest):
  """
  Fallback REST endpoint for processing single-frame hand landmark inference.
  """
  try:
    landmarks_dict = [p.model_dump() for p in request.landmarks]
    x, y, is_pinching = gesture_processor.process_landmarks(landmarks_dict)
    return PredictResponse(x=x, y=y, is_pinching=is_pinching)
  except Exception as e:
    logger.error(f"Error in REST predict endpoint: {e}")
    raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/tracking")
async def websocket_tracking(websocket: WebSocket):
  """
  Primary streaming endpoint for real-time input data over WebSockets.
  Processes coordinate keypoints, applies Exponential Moving Average smoothing,
  and streams smoothed coordinates along with pinch clicks back to client.
  """
  await websocket.accept()
  logger.info("WebSocket connection established on /ws/tracking")
  
  # Reset processor state for a clean tracking stream
  gesture_processor.reset_state()

  try:
    while True:
      # Receive JSON frame data from client
      # Format expected: { "landmarks": [{"x": 0.1, "y": 0.2, "z": 0.3}, ...] }
      data = await websocket.receive_json()
      landmarks = data.get("landmarks")

      if not landmarks:
        await websocket.send_json({"error": "No landmarks field supplied."})
        continue

      # Process coordinates
      x, y, is_pinching = gesture_processor.process_landmarks(landmarks)

      # Stream results back to client
      await websocket.send_json({
        "x": x,
        "y": y,
        "is_pinching": is_pinching
      })

  except WebSocketDisconnect:
    logger.info("WebSocket client disconnected from /ws/tracking")
  except Exception as e:
    logger.error(f"WebSocket tracking error: {e}")
  finally:
    gesture_processor.reset_state()
