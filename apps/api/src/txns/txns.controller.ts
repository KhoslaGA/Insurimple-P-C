import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { getCtx } from '../common/ctx';
import { OpenTxnDto, TxnsService } from './txns.service';

@Controller('txns')
export class TxnsController {
  constructor(private readonly txns: TxnsService) {}

  @Post()
  open(@Req() req: Request, @Body() dto: OpenTxnDto) {
    return this.txns.open(getCtx(req), dto);
  }

  @Get()
  list(@Req() req: Request) {
    return this.txns.list(getCtx(req));
  }

  @Get(':id')
  get(@Req() req: Request, @Param('id') id: string) {
    return this.txns.get(getCtx(req), id);
  }

  @Post(':id/generate')
  generate(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { docType: string; filename: string },
  ) {
    return this.txns.generateDocument(getCtx(req), id, body.docType, body.filename);
  }

  @Post(':id/request-signature')
  requestSignature(@Req() req: Request, @Param('id') id: string) {
    return this.txns.requestSignature(getCtx(req), id);
  }

  @Post(':id/sign')
  sign(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { signerPartyId?: string; signerIp?: string },
  ) {
    return this.txns.sign(getCtx(req), id, body?.signerPartyId, body?.signerIp);
  }

  @Post(':id/submit')
  submit(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { channel: string; payload?: Record<string, unknown> },
  ) {
    return this.txns.submit(getCtx(req), id, body.channel, body.payload);
  }

  @Post(':id/ack')
  ack(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: { carrierRef?: string; complete?: boolean },
  ) {
    return this.txns.acknowledge(getCtx(req), id, body?.carrierRef, body?.complete ?? false);
  }
}
