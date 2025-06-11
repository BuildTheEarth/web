import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/db/prisma.service';

@Injectable()
export class UtilityService {
	constructor(private prisma: PrismaService) {}
}
