import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CompletionResult {
  subject: string;
  date: string;
  content: string;
}

@Injectable()
export class LlmClientService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * FastAPI LLM 서버에 프롬프트 전송
   * @param prompt LLM에 전달할 프롬프트
   * @param maxTokens 최대 토큰 수 (기본값 1024)
   * @param temperature 창의성 조절 파라미터 (기본값 0.0)
   */
  async generate(
    prompt: string,
    maxTokens: number = 1024,
    temperature: number = 0.0,
  ): Promise<CompletionResult[]> {
    const url = 'http://127.0.0.1:8000/v1/completions';

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            prompt,
            max_tokens: maxTokens,
            temperature,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        )
      );

      const rawText = (response.data as any)?.generated_text || '';
      console.log('🧾 Raw LLM response:', rawText);
      
      const jsonStart = rawText.indexOf('[');
      const jsonEnd = rawText.lastIndexOf(']');

      if (jsonStart === -1 || jsonEnd === -1) {
        console.warn('❗ JSON 배열 시작/끝을 찾을 수 없음:', rawText);
        throw new Error('응답에서 유효한 JSON 배열을 찾을 수 없음');
      }

      const jsonString = rawText.substring(jsonStart, jsonEnd + 1).trim();
      let parsed: CompletionResult[];

      try {
        parsed = JSON.parse(jsonString);
        if (!Array.isArray(parsed)) {
          throw new Error('파싱된 결과가 배열이 아님');
        }
      } catch (parseErr) {
        console.error('❌ JSON 파싱 실패:', parseErr);
        console.error('🔎 원본 문자열:', jsonString);
        throw new Error('LLM 응답 파싱 오류');
      }

      return parsed;
    } catch (error: any) {
      console.error('❌ LLM 서버 요청 실패:', error.message || error);
      throw new HttpException(
        'LLM 서버 요청 중 오류가 발생했습니다.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
