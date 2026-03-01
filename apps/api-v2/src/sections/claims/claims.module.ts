import { Module } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { ClaimsController } from './claims.controller';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService],
})
export class ClaimsModule {}
