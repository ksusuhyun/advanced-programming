from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, TextGenerationPipeline
import torch

app = FastAPI()

MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.1"  # ✅ 모델 교체

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
    device_map="auto"
)

pipeline = TextGenerationPipeline(
    model=model,
    tokenizer=tokenizer,
    return_full_text=False  # ✅ 프롬프트 제거
)

class PromptRequest(BaseModel):
    prompt: str
    max_tokens: int = 512
    temperature: float = 0.7

@app.post("/v1/completions")
def complete(request: PromptRequest):
    try:
        outputs = pipeline(
            request.prompt,
            max_new_tokens=request.max_tokens,
            temperature=request.temperature,
            do_sample=True
        )
        return {"generated_text": outputs[0]["generated_text"].strip()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")
