from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch

app = FastAPI()

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 모델 로드
model_name = "tiiuae/falcon-rw-1b"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name, torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32)

device = 0 if torch.cuda.is_available() else -1
generator = pipeline("text-generation", model=model, tokenizer=tokenizer, device=device)

@app.post("/v1/completions")
async def generate_completion(request: Request):
    body = await request.json()
    prompt = body.get("prompt", "")
    max_tokens = body.get("max_tokens", 256)

    output = generator(
        prompt,
        max_new_tokens=max_tokens,
        do_sample=False,
        temperature=0.3,
    )

    generated_text = output[0]["generated_text"]
    truncated_text = generated_text.split("###")[0].strip()

    return [{"generated_text": truncated_text}]
