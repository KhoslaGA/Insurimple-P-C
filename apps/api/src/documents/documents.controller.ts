import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { DocumentsService, IssueProofDto } from './documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Get()
  list(@Req() req: Request, @Query('accountId') accountId?: string) {
    return this.documents.list(getCtx(req), accountId);
  }

  @Get('templates')
  templates(@Req() req: Request) {
    return this.documents.templates(getCtx(req));
  }

  @Post('issue')
  issue(@Req() req: Request, @Body() dto: IssueProofDto) {
    return this.documents.issue(getCtx(req), dto);
  }
}
