from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
import json
import re

# ✅ 모델 초기화
try:
    generator = pipeline("text2text-generation", model="google/flan-t5-base", device=-1)
except Exception as e:
    print("❌ generator 초기화 실패:", e)
    generator = None

app = FastAPI()

class CompletionRequest(BaseModel):
    prompt: str
    max_tokens: int = 256
    temperature: float = 0.0  # 선택적

class CompletionResponse(BaseModel):
    result: list

def extract_first_json_array(text: str):
    """
    텍스트에서 첫 번째 JSON 배열([])만 추출
    """
    pattern = r"\[\s*{[\s\S]*?}\s*]"
    matches = re.finditer(pattern, text)
    for match in matches:
        try:
            parsed = json.loads(match.group())
            if isinstance(parsed, list):
                return parsed
        except json.JSONDecodeError:
            continue
    return []

@app.post("/v1/completions", response_model=CompletionResponse)
async def complete(request: CompletionRequest):
    if generator is None:
        raise HTTPException(status_code=500, detail="❌ LLM 모델이 초기화되지 않았습니다.")

    try:
        outputs = generator(
            request.prompt,
            max_new_tokens=request.max_tokens,
            do_sample=False,
            temperature=request.temperature,
        )

        raw_output = outputs[0].get("generated_text") or outputs[0].get("output")
        print("🧪 Raw output:\n", raw_output)

        parsed = extract_first_json_array(raw_output)
        if not parsed:
            raise ValueError("❌ JSON 배열을 파싱할 수 없습니다.")

        return {"generated_text": parsed}

    except Exception as e:
        print("❌ FastAPI LLM 처리 중 예외 발생:", e)
        raise HTTPException(status_code=500, detail=f"LLM 처리 실패: {str(e)}")
