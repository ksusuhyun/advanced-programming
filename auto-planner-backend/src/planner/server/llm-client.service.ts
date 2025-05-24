import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface CompletionResult {
  subject: string;
  date: string;
  content: string;
}

interface CompletionResponse {
  result: CompletionResult[];
}

@Injectable()
export class LlmClientService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * FastAPI LLM 서버에 프롬프트 전송
   * @param prompt LLM에 전달할 프롬프트
   * @param maxTokens 최대 토큰 수 (기본값 512)
   * @param temperature 창의성 조절 파라미터 (기본값 0.0)
   */
  async generate(
    prompt: string,
    maxTokens: number = 512,
    temperature: number = 0.0,
  ): Promise<CompletionResult[]> {
    const url = 'http://127.0.0.1:8000/v1/completions';

    try {
      const response = await firstValueFrom(
        this.httpService.post<CompletionResponse>(
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

      const result = response.data?.result;
      if (!Array.isArray(result)) {
        console.warn('❗ FastAPI 응답 형식 오류:', response.data);
        throw new Error('응답이 JSON 배열 형식이 아님');
      }

      return result;
    } catch (error: any) {
      console.error('❌ LLM 서버 요청 실패:', error.message || error);
      throw new HttpException(
        'LLM 서버 요청 중 오류가 발생했습니다.',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
