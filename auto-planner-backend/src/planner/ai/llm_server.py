from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, TextGenerationPipeline

app = FastAPI()

# ✅ 경량 모델로 교체
tokenizer = AutoTokenizer.from_pretrained("tiiuae/falcon-rw-1b")
model = AutoModelForCausalLM.from_pretrained("tiiuae/falcon-rw-1b")
pipeline = TextGenerationPipeline(model=model, tokenizer=tokenizer)

class CompletionRequest(BaseModel):
    model: str
    prompt: str
    max_tokens: int
    temperature: float

@app.post("/v1/completions")
async def generate_completion(data: CompletionRequest):
    generated = pipeline(
        data.prompt,
        max_length=data.max_tokens,
        do_sample=False,       # 🔁 샘플링 제거
        temperature=0.0        # 🔁 결정적 응답
    )[0]["generated_text"]
    return [{"generated_text": generated}]



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("llm_server:app", host="0.0.0.0", port=8000, reload=True)
