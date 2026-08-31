---
name: nlp-realtime-engine
description: "Expert skill for optimizing PyTorch & Hugging Face Transformers for real-time inference, tokenization latency reduction, hybrid semantic-lexicon detection, confidence calibration, and batch evaluation."
---

# NLP Real-Time Inference & Evaluation Engine

Specialized skill for engineering low-latency, high-accuracy NLP pipelines using fine-tuned BERT/IndoBERT models, hybrid semantic-lexicon matching, and automated evaluation metrics.

---

## 🧠 1. Real-Time Inference Optimization

When serving deep learning models (BERT/IndoBERT) for real-time web testing:
1. **Evaluation Mode (`model.eval()`)**: Always deactivate dropout and batch normalization layers.
2. **Gradient Calculation Disabled (`with torch.no_grad():`)**: Essential to reduce memory usage by 60% and boost execution speed.
3. **Token Truncation & Max Length Tuning**:
   - For real-time chat/SMS text, set `max_length=128` (captures 99% of messages without unnecessary sequence padding overhead).
4. **Device Agnostic Execution**:
   - Dynamically select `cuda` if available, fallback gracefully to `cpu`.
   - On CPU, leverage PyTorch vectorization and multithreading.

```python
import time
import torch

def optimized_inference(model, tokenizer, text: str, device: str = "cpu", max_length: int = 128):
    start_time = time.perf_counter()
    
    # 1. Tokenize
    inputs = tokenizer(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=max_length,
        padding=True
    )
    inputs = {k: v.to(torch.device(device)) for k, v in inputs.items()}
    
    # 2. Forward pass with no_grad
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probs = torch.softmax(logits, dim=-1)[0].cpu().numpy()
        pred_label = int(torch.argmax(logits, dim=-1).item())
        
    duration = time.perf_counter() - start_time
    
    return {
        "label": pred_label,
        "confidence": float(probs[pred_label]),
        "probabilities": {
            "legal": float(probs[0]),
            "illegal": float(probs[1])
        },
        "latency_sec": round(duration, 4)
    }
```

---

## 🛡️ 2. Hybrid Semantic + Lexicon Red-Flag Matcher

For illegal fintech lending, pure neural networks benefit greatly from an auxiliary rule/lexicon extractor that surfaces explicit red flags to human evaluators.

### Core Red-Flag Taxonomy:
* **Contact Harassment**: `sebar data`, `sebar kontak`, `teror`, `hubungi seluruh kontak`, `ancam sebar foto`
* **Deceptive Offers**: `cair 5 menit`, `tanpa verifikasi`, `bunga 0%`, `tanpa jaminan`, `modal ktp langsung cair`
* **Predatory Repayment**: `bunga per hari`, `tenor 7 hari`, `potongan admin tinggi`, `transfer sepihak`
* **Technical Signals**: Links containing APK direct download, shortened URLs (`bit.ly`, `wa.me`), non-official Indonesian mobile numbers (`+628...`).

```python
import re

def extract_threat_indicators(text: str, illegal_keywords: list, legal_keywords: list):
    text_lower = text.lower()
    
    detected_illegal = [kw for kw in illegal_keywords if kw in text_lower]
    detected_legal = [kw for kw in legal_keywords if kw in text_lower]
    
    has_phone = bool(re.search(r'(\+62|08)[0-9]{8,12}', text))
    has_url = bool(re.search(r'https?://[^\s]+|bit\.ly/[^\s]+|wa\.me/[^\s]+', text))
    
    # Heuristic Risk Calculation
    risk_score = (len(detected_illegal) * 30) + (20 if has_phone else 0) + (20 if has_url else 0)
    
    return {
        "illegal_flags": detected_illegal,
        "legal_flags": detected_legal,
        "has_phone": has_phone,
        "has_url": has_url,
        "threat_level": "TINGGI" if risk_score >= 50 else ("SEDANG" if risk_score >= 20 else "RENDAH")
    }
```

---

## 📊 3. Metric Calculation Checklist

When benchmarking and evaluating NLP models for academic publication:
* **Accuracy**: Overall correct predictions / Total samples.
* **Macro Precision**: Average precision across all classes (crucial for imbalanced fraud datasets).
* **Macro Recall**: Average recall across all classes (minimizes false negatives for illegal loan alerts).
* **Macro F1-Score**: Harmonic mean of Precision and Recall.
* **Inference Latency Profile**: P50, P95, and P99 latency percentiles.
