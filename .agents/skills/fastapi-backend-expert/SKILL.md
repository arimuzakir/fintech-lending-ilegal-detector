---
name: fastapi-backend-expert
description: "Expert skill for developing high-performance FastAPI backends, asynchronous ML model serving (PyTorch/Transformers), Pydantic v2 schemas, RESTful architecture, middleware, CORS, rate limiting, and OpenAPI Swagger documentation."
---

# FastAPI Backend Expert - Production Architecture & ML Serving

Comprehensive guidelines, design patterns, and best practices for building robust, scalable, and high-speed Python FastAPI backends, especially for machine learning inferencing and real-time data processing.

---

## 🏛️ Core Architecture Principles

1. **Modern Lifespan Pattern**: Always use `@asynccontextmanager` with FastAPI `lifespan` parameter rather than deprecated `@app.on_event("startup")`.
2. **Strict Pydantic v2 Typing**: Use `BaseModel`, `Field(..., description=...)`, `Annotated`, and typed responses for 100% type safety and automatic Swagger documentation.
3. **Non-Blocking Inference**:
   - For CPU-bound ML tasks, run heavy PyTorch inference in threadpools (`asyncio.to_thread`) or synchronous handler functions where FastAPI natively runs them in an external threadpool.
   - Cache models in memory at startup, never reload weights per request.
4. **Structured Error Handling**: Use `HTTPException` with informative `detail` JSON payloads and proper HTTP status codes (`400 Bad Request`, `422 Validation Error`, `500 Server Error`).
5. **Production CORS & Security**: Configure `CORSMiddleware` with explicit origins, methods, and headers for secure web client communication.

---

## 🚀 Fast Pattern: ML Model Serving with FastAPI

```python
import os
import time
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

# 1. State Singleton / Service Engine
class ModelEngine:
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cpu"
        self.is_loaded = False

    def load(self, model_path: str):
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.to(torch.device(self.device))
        self.model.eval()
        self.is_loaded = True

    def predict(self, text: str) -> Dict[str, Any]:
        import torch
        start = time.time()
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, max_length=128, padding=True)
        inputs = {k: v.to(torch.device(self.device)) for k, v in inputs.items()}
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.softmax(outputs.logits, dim=-1)[0].cpu().numpy()
            pred_class = int(torch.argmax(outputs.logits, dim=-1).item())
        
        return {
            "label": pred_class,
            "confidence": float(probs[pred_class]),
            "probabilities": {"class_0": float(probs[0]), "class_1": float(probs[1])},
            "latency_ms": round((time.time() - start) * 1000, 2)
        }

engine = ModelEngine()

# 2. Lifespan Handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    model_dir = os.path.abspath("model")
    if os.path.exists(model_dir):
        engine.load(model_dir)
    yield
    # Cleanup if needed

# 3. Application Setup
app = FastAPI(
    title="Real-Time NLP Classifier API",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# 4. Request / Response Schemas
class SinglePredictRequest(BaseModel):
    text: str = Field(..., min_length=2, max_length=5000, description="Input text to classify")

class BatchPredictRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=100, description="List of texts for batch analysis")

# 5. Endpoints
@app.get("/api/health")
async def health_check():
    return {
        "status": "online",
        "model_loaded": engine.is_loaded,
        "device": engine.device
    }

@app.post("/api/predict")
async def predict_single(req: SinglePredictRequest):
    try:
        return engine.predict(req.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 📋 Checklist for Production FastAPI

- [ ] Startup model loading under `lifespan`
- [ ] Explicit input validation with `min_length` & `max_length`
- [ ] Safe fallback if model fails to load or hardware OOM occurs
- [ ] Response latency logging and profiling
- [ ] CORS middleware configured
- [ ] Static files mounted safely with `os.path.exists` validation
- [ ] Interactive Swagger UI accessible at `/docs`
- [ ] Unit testing with `fastapi.testclient.TestClient`
