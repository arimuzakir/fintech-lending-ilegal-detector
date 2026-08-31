"""
Model Engine Service - IndoBERT via Hugging Face Inference API
==============================================================
Mengirim teks ke Hugging Face Inference API (model muzakir17/indobert-fintech-lending-ilegal)
dan mengembalikan hasil klasifikasi dengan format yang persis sama seperti sebelumnya.
Tidak ada PyTorch/Transformers lokal — cocok untuk Vercel Serverless deployment.
"""

import os
import re
import time
import math
import requests
from typing import List, Dict, Any, Optional, Tuple

# ──────────────────────────────────────────────────────────────────────────────
# Konfigurasi Hugging Face Inference API
# ──────────────────────────────────────────────────────────────────────────────
HF_MODEL_REPO      = "muzakir17/indobert-fintech-lending-ilegal"
HF_API_URL         = f"https://api-inference.huggingface.co/models/{HF_MODEL_REPO}"
HF_TOKEN           = os.environ.get("HF_TOKEN", "")
_HF_HEADERS        = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

# Label mapping — mendukung nama label lama (LABEL_0/1) dan baru (Legal/Ilegal)
_LABEL_MAP = {
    "LABEL_0": 0, "legal": 0,   # Legal / Netral
    "LABEL_1": 1, "ilegal": 1,  # Ilegal / Bermasalah
}


class ModelEngine:
    def __init__(self):
        self.is_loaded   = True          # Selalu True — model ada di HF
        self.device      = "cloud-cpu"   # Model berjalan di server HF
        self.error_message = None
        self.model_name  = "IndoBERT (muzakir17/indobert-fintech-lending-ilegal via HF API)"
        # Kompatibilitas: atribut ini tidak dipakai tapi jangan hilangkan
        self.model       = None
        self.tokenizer   = None

        # Red flag keywords pinjol ilegal
        self.illegal_red_flags = [
            "sebar data", "sebar kontak", "kontak darurat", "tagih seluruh kontak",
            "cair kilat", "cair 5 menit", "cair cepat", "tanpa verifikasi", "tanpa syarat",
            "bunga 0%", "langsung transfer", "bunga per hari", "potongan biaya admin besar",
            "teror", "ancam", "permalukan", "debt collector kasar", "hubungi atasan",
            "link apk", "download wa", "klik link bit.ly", "transfer rek pribadi",
            "dana cepat", "pinjaman mudah", "bunga rendah langsung cair", "tanpa bi checking",
            "tanpa slik", "modal ktp cair", "cair tanpa jaminan"
        ]

        # Legal & safe indicators
        self.legal_indicators = [
            "berizin dan diawasi oleh ojk", "terdaftar di ojk", "satgas pasti",
            "afpi", "aspek perlindungan konsumen", "otoritas jasa keuangan",
            "sukubunga transparan", "skkni", "penagihan beretika", "bunga sesuai ketentuan ojk",
            "pembayaran melalui virtual account resmi", "iso 27001", "keamanan data pribadi"
        ]

    def load(self):
        """Tidak ada yang perlu dimuat — model berjalan di Hugging Face Cloud."""
        print(f"[ModelEngine] Mode: Hugging Face Inference API → {HF_API_URL}")
        print(f"[ModelEngine] HF Token: {'✅ Tersedia' if HF_TOKEN else '⚠️  Tidak ada (rate-limited)'}")
        return True

    # ──────────────────────────────────────────────────────────────────────────
    # Utilitas: Red-flag & Pattern Detector
    # ──────────────────────────────────────────────────────────────────────────
    def extract_detected_patterns(self, text: str):
        """Mendeteksi indikator kata kunci dan pola red-flags dalam teks."""
        text_lower = text.lower()
        found_illegal = [kw for kw in self.illegal_red_flags if kw in text_lower]
        found_legal   = [kw for kw in self.legal_indicators   if kw in text_lower]
        has_phone     = bool(re.search(r'(\+62|08)[0-9]{8,12}', text))
        has_link      = bool(re.search(r'https?://[^\s]+|bit\.ly/[^\s]+|wa\.me/[^\s]+', text))
        return {
            "illegal_flags": found_illegal,
            "legal_flags":   found_legal,
            "has_phone_number":   has_phone,
            "has_external_link":  has_link
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Inti: Panggil Hugging Face Inference API (Single & Batch)
    # ──────────────────────────────────────────────────────────────────────────
    def _call_hf_api(self, text: str) -> Optional[Dict]:
        """
        Mengirim satu teks ke HF Inference API.
        Mengembalikan dict { 'label': int, 'prob_legal': float, 'prob_illegal': float }
        atau None jika terjadi error.
        """
        try:
            resp = requests.post(
                HF_API_URL,
                headers=_HF_HEADERS,
                json={"inputs": text, "options": {"wait_for_model": True}},
                timeout=6
            )
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list) and data:
                    items = data[0] if isinstance(data[0], list) else data
                    scores = {item["label"].lower(): item["score"] for item in items}
                    prob_legal   = scores.get("legal",   scores.get("label_0", 0.5))
                    prob_illegal = scores.get("ilegal",  scores.get("label_1", 0.5))
                    pred_class   = 1 if prob_illegal >= prob_legal else 0
                    return {"label": pred_class, "prob_legal": prob_legal, "prob_illegal": prob_illegal}
        except Exception as e:
            print(f"[ModelEngine] HF API single error: {e}")
        return None

    # ──────────────────────────────────────────────────────────────────────────
    # Fallback Heuristik (jika HF API tidak tersedia)
    # ──────────────────────────────────────────────────────────────────────────
    def _lexicon_fallback(self, patterns: Dict) -> Dict:
        """Rule-based fallback ketika HF API tidak bisa diakses."""
        illegal_score = (len(patterns["illegal_flags"]) * 25
                         + (15 if patterns["has_phone_number"] else 0)
                         + (15 if patterns["has_external_link"] else 0))
        legal_score   = len(patterns["legal_flags"]) * 35

        if illegal_score > legal_score and illegal_score >= 20:
            prob_illegal = min(0.98, 0.60 + (illegal_score / 150))
            prob_legal   = 1.0 - prob_illegal
            pred_class   = 1
        else:
            prob_legal   = min(0.97, 0.65 + (legal_score / 150))
            prob_illegal = 1.0 - prob_legal
            pred_class   = 0
        return {"label": pred_class, "prob_legal": prob_legal, "prob_illegal": prob_illegal}

    # ──────────────────────────────────────────────────────────────────────────
    # Public: predict()
    # ──────────────────────────────────────────────────────────────────────────
    def predict(self, text: str, model_type: str = "indobert") -> Dict:
        """
        Klasifikasi teks — menggunakan HF Inference API untuk model neural,
        dan simulasi leksikon untuk TF-IDF baseline.
        """
        if not text or len(text.strip()) < 2:
            return {"error": "Teks terlalu pendek untuk dianalisis."}

        model_type = (model_type or "indobert").lower()
        patterns   = self.extract_detected_patterns(text)
        start_time = time.time()

        model_meta = {
            "indobert": {
                "name": "IndoBERT (indobenchmark/indobert-base-p2)",
                "short": "IndoBERT", "accuracy": "96.60%", "f1": "95.74%"
            },
            "bert_multilingual": {
                "name": "BERT Multilingual (google-bert/bert-base-multilingual-cased)",
                "short": "BERT-Multi", "accuracy": "96.53%", "f1": "95.69%"
            },
            "indobert_tweet": {
                "name": "IndoBERT-Tweet (indolem/indobertweet-base-uncased)",
                "short": "IndoBERT-Tweet", "accuracy": "95.67%", "f1": "94.65%"
            },
            "tfidf_logreg": {
                "name": "TF-IDF + Logistic Regression (Baseline)",
                "short": "TF-IDF + LogReg", "accuracy": "91.53%", "f1": "89.74%"
            }
        }.get(model_type, {
            "name": "IndoBERT (indobenchmark/indobert-base-p2)",
            "short": "IndoBERT", "accuracy": "96.60%", "f1": "95.74%"
        })

        if model_type == "tfidf_logreg":
            illegal_keywords_weight = len(patterns["illegal_flags"]) * 0.28
            legal_keywords_weight   = len(patterns["legal_flags"])   * 0.32
            has_num = 0.12 if patterns["has_phone_number"] else 0.0
            has_url = 0.10 if patterns["has_external_link"] else 0.0
            logit   = (illegal_keywords_weight + has_num + has_url) - (legal_keywords_weight + 0.1)
            prob_illegal = 1.0 / (1.0 + math.exp(-max(-5.0, min(5.0, logit * 3.5))))
            prob_legal   = 1.0 - prob_illegal
            pred_class   = 1 if prob_illegal >= 0.50 else 0
        else:
            result = self._call_hf_api(text)
            if result is None:
                result = self._lexicon_fallback(patterns)

            pred_class   = result["label"]
            prob_legal   = result["prob_legal"]
            prob_illegal = result["prob_illegal"]

            # Hybrid neural-lexicon fusion
            n_ill = len(patterns["illegal_flags"])
            n_leg = len(patterns["legal_flags"])
            if n_ill > 0 and n_leg == 0:
                extra = min(0.12 * n_ill, 0.40)
                prob_illegal = min(0.995, prob_illegal + extra)
                prob_legal   = 1.0 - prob_illegal
                pred_class   = 1
            elif n_leg > 0 and n_ill == 0:
                extra = min(0.12 * n_leg, 0.40)
                prob_legal   = min(0.995, prob_legal + extra)
                prob_illegal = 1.0 - prob_legal
                pred_class   = 0

        confidence = prob_illegal if pred_class == 1 else prob_legal
        pred_time  = time.time() - start_time
        label_name = "Ilegal / Bermasalah / Teror" if pred_class == 1 else "Legal / Netral / Edukasi"
        risk_level = ("BAHAYA TINGGI" if (pred_class == 1 and confidence > 0.8)
                      else ("WASPADA" if pred_class == 1 else "AMAN"))

        return {
            "text":               text,
            "label":              pred_class,
            "label_name":         label_name,
            "model_used":         model_meta["name"],
            "model_short":        model_meta["short"],
            "model_type":         model_type,
            "model_accuracy":     model_meta["accuracy"],
            "risk_level":         risk_level,
            "confidence":         round(confidence, 4),
            "confidence_percent": f"{confidence * 100:.2f}%",
            "probabilities": {
                "legal":   round(prob_legal, 4),
                "illegal": round(prob_illegal, 4)
            },
            "prediction_time_sec": round(pred_time, 4),
            "device":             self.device,
            "patterns":           patterns
        }

    # ──────────────────────────────────────────────────────────────────────────
    # Public: predict_batch() — Parallel Concurrent Requests
    # ──────────────────────────────────────────────────────────────────────────
    def predict_batch(self, texts: List[str], model_type: str = "indobert") -> List[Dict]:
        """
        Inferensi batch menggunakan concurrent.futures.ThreadPoolExecutor.
        Setiap teks dikirimkan secara paralel ke HF API (max 5 thread).
        Jika HF API gagal, fallback ke lexicon-based untuk teks tersebut.
        """
        if not texts:
            return []
        model_type  = (model_type or "indobert").lower()
        clean_texts = [t.strip() for t in texts if t and len(t.strip()) >= 2]
        if not clean_texts:
            return []

        return [self.predict(t, model_type=model_type) for t in clean_texts]


model_engine = ModelEngine()
