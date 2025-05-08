import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SyncToNotionDto } from './dto/sync-to-notion.dto';
import { NotionService } from './notion.service';

@ApiTags('notion')
@Controller('notion')
export class NotionController {
  constructor(private readonly notionService: NotionService) {}

  @Post('sync')
  @ApiOperation({ summary: '확정된 계획을 Notion에 연동' })
  sync(@Body() dto: SyncToNotionDto) {
    return this.notionService.syncToNotion(dto);
  }
}
