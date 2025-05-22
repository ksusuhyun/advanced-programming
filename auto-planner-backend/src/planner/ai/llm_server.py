from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM, TextGenerationPipeline

app = FastAPI()

tokenizer = AutoTokenizer.from_pretrained("openchat/openchat-3.5-1210")
model = AutoModelForCausalLM.from_pretrained("openchat/openchat-3.5-1210")
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
        do_sample=True,
        temperature=data.temperature
    )[0]["generated_text"]
    return [{"generated_text": generated}]
