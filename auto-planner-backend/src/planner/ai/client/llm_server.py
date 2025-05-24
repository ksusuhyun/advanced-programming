# llm_server.py (FastAPI 서버 - CPU + flan-t5-base 사용)

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import json
import re

# ✅ 모델 초기화: 경량 flan-t5-base + CPU 사용
try:
    generator = pipeline(
        "text2text-generation",
        model="google/flan-t5-base",
        device=-1  # ✅ CPU 강제 사용
    )
except Exception as e:
    print("❌ generator 초기화 실패:", e)
    generator = None

app = FastAPI()

class CompletionRequest(BaseModel):
    prompt: str
    max_tokens: int = 1024
    temperature: float = 0.7

class CompletionResponse(BaseModel):
    result: list

def extract_first_json_array(text: str):
    try:
        # 전체 문자열에서 첫 괄호 시작~끝을 찾아 파싱 시도
        start = text.index("[")
        end = text.rindex("]") + 1
        json_str = text[start:end]
        return json.loads(json_str)
    except Exception as e:
        print("❌ JSON 추출 실패:", e)
        return []


@app.post("/v1/completions", response_model=CompletionResponse)
async def complete(request: CompletionRequest):
    if generator is None:
        raise HTTPException(status_code=500, detail="❌ LLM 모델이 초기화되지 않았습니다.")

    try:
        outputs = generator(
            request.prompt,
            max_new_tokens=request.max_tokens,
            do_sample=True,
            temperature=request.temperature,
        )

        raw_output = outputs[0].get("generated_text") or outputs[0].get("output")
        print("\U0001f9ea Raw output:\n", raw_output)

        parsed = extract_first_json_array(raw_output)
        if not parsed:
            raise ValueError("❌ JSON 배열을 파싱할 수 없습니다.")

        return {"result": parsed}

    except Exception as e:
        print("❌ FastAPI LLM 처리 중 예외 발생:", e)
        raise HTTPException(status_code=500, detail=f"LLM 처리 실패: {str(e)}")
