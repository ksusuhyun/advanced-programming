import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';


@Injectable()
export class LLMClientService {
  async generate(prompt: string): Promise<any> {
    const HF_API_URL = 'http://127.0.0.1:8000/v1/completions';

    const response = await axios.post(HF_API_URL, {
      model: 'openchat',
      prompt,
      max_tokens: 1024,
      temperature: 0.3,
    });

    const rawText = response.data?.[0]?.generated_text;
    console.log('🔍 LLM raw output:', rawText);

    try {
      return JSON.parse(rawText);
    } catch (e) {
      console.error('❌ JSON 파싱 실패:', rawText);
      throw new InternalServerErrorException('JSON 파싱에 실패했습니다.');
    }
  }
}
