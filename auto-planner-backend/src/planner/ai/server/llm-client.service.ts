import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class LlmClientService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * LLM 서버에 자연어 프롬프트를 보내고 요약/피드백 응답을 텍스트로 받음
   */
  async generateSummary(prompt: string): Promise<string> {
    const url = 'http://127.0.0.1:8000/v1/completions';

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          url,
          {
            prompt,
            max_tokens: 1024,
            temperature: 0.7,
          },
          { headers: { 'Content-Type': 'application/json' } }
        )
      );
      const raw = (response.data as any)?.generated_text || '';
      console.log('🧪 Raw LLM response:', raw);
      return raw.trim();
    } catch (err) {
      throw new HttpException('LLM 요약/피드백 생성 실패', HttpStatus.BAD_GATEWAY);
    }
  }
}





// interface CompletionResult {
//   subject: string;
//   date: string;
//   content: string;
// }

// @Injectable()
// export class LlmClientService {
//   constructor(private readonly httpService: HttpService) {}

//   /**
//    * FastAPI LLM 서버에 프롬프트 전송
//    * @param prompt LLM에 전달할 프롬프트
//    * @param maxTokens 최대 토큰 수 (기본값 1024)
//    * @param temperature 창의성 조절 파라미터 (기본값 0.0)
//    */
//   async generate(
//     prompt: string,
//     parseAsJson: boolean = true, // ✅ 옵션 추가
//     maxTokens: number = 1024,
//     temperature: number = 0.0,
//   ): Promise<CompletionResult[] | string> {
//     const url = 'http://127.0.0.1:8000/v1/completions';

//     try {
//       const response = await firstValueFrom(
//         this.httpService.post(
//           url,
//           { prompt, max_tokens: maxTokens, temperature },
//           { headers: { 'Content-Type': 'application/json' } },
//         )
//       );

//       const rawText = (response.data as any)?.generated_text || '';
//       console.log('🧾 Raw LLM response:', rawText);

//       if (!parseAsJson) return rawText.trim(); // ✅ 자연어 텍스트 그대로 반환

//       const jsonStart = rawText.indexOf('[');
//       const jsonEnd = rawText.lastIndexOf(']');

//       if (jsonStart === -1 || jsonEnd === -1) {
//         throw new Error('응답에서 유효한 JSON 배열을 찾을 수 없음');
//       }

//       const jsonString = rawText.substring(jsonStart, jsonEnd + 1).trim();
//       const parsed = JSON.parse(jsonString);
//       if (!Array.isArray(parsed)) throw new Error('파싱된 결과가 배열이 아님');

//       return parsed;
//     } catch (error: any) {
//       throw new HttpException(
//         'LLM 서버 요청 중 오류가 발생했습니다.',
//         HttpStatus.BAD_GATEWAY,
//       );
//     }
//   }

//   async generateSummary(prompt: string): Promise<string> {
//     const url = 'http://127.0.0.1:8000/v1/completions';

//     try {
//       const response = await firstValueFrom(
//         this.httpService.post(
//           url,
//           {
//             prompt,
//             max_tokens: 1024,
//             temperature: 0.7,
//           },
//           { headers: { 'Content-Type': 'application/json' } }
//         )
//       );
//       const raw = (response.data as any)?.generated_text || '';
//       return raw.trim();
//     } catch (err) {
//       throw new HttpException('요약 생성 실패', HttpStatus.BAD_GATEWAY);
//     }
//   }
// }
