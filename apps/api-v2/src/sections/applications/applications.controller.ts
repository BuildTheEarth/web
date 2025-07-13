import { Controller, Get, Query } from '@nestjs/common';
import { ApiDefaultResponse, ApiErrorResponse, ApiPaginatedResponseDto } from 'src/common/decorators/api-response.decorator';
import { SkipAuth } from 'src/common/decorators/skip-auth.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ControllerResponse } from 'src/typings';
import { PrismaService } from 'src/common/db/prisma.service';
import { ApplicationDto } from './dto/application.dto';
import { Sortable } from 'src/common/decorators/sortable.decorator';
import { Paginated } from 'src/common/decorators/paginated.decorator';
import { PaginatedDto } from 'src/common/dto/paginated.dto';

@Controller('applications')
export class ApplicationsController {

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Returns all applications of the currently authenticated team.
     */
    @Get('/')
    @SkipAuth()
    @ApiOperation({
        summary: 'Get All Applications',
        description: 'Returns all applications of the currently authenticated team.',
    })
    @Sortable({ defaultSortBy: 'createdAt', allowedFields: ['userId', 'reviewerId', 'status', 'createdAt', 'reviewedAt', 'reason', 'claimId', 'trial'], defaultOrder: 'desc' })
    @Paginated({ defaultPage: 1, defaultLimit: 2, maxLimit: 5 })

    @ApiQuery({ name: 'userId', required: false, type: String, description: 'Filter by user id', nullable: true })
    @ApiQuery({ name: 'reviewerId', required: false, type: String, description: 'Filter by reviewer id', nullable: true })
    @ApiQuery({ name: 'status', required: false, type: String, enum: ['SEND', 'ACCEPTED', 'DECLINED'], description: 'Filter by status', nullable: true })
    @ApiQuery({ name: 'createdAt', required: false, type: String, description: 'Filter by creation date', nullable: true })
    @ApiQuery({ name: 'reviewedAt', required: false, type: String, description: 'Filter by reviewed date', nullable: true })
    @ApiQuery({ name: 'reason', required: false, type: String, description: 'Filter by reason', nullable: true })
    @ApiQuery({ name: 'claimId', required: false, type: String, description: 'Filter by claim id', nullable: true })
    @ApiQuery({ name: 'trial', required: false, type: Boolean, description: 'Filter by trial flag', nullable: true })

    @ApiPaginatedResponseDto(ApplicationDto, { description: 'Success' })
    @ApiErrorResponse({ status: 500, description: 'Error: Internal Server Error' })
    async getClaims(
        @Query() pagination: PaginatedDto,
        @Query('sortBy') sortBy?: string,
        @Query('order') order?: 'asc' | 'desc',
        @Query() query?: Record<string, any>,
    ): ControllerResponse {
        const sortField = sortBy || 'createdAt';
        const sortOrder = order === 'desc' ? 'desc' : 'asc';
        
        console.log(pagination);

        const take = Math.max(Number(pagination.limit) || 20, 1);
        const skip = Math.max((Number(pagination.page) || 1) - 1, 0) * take;

        // Build where clause from query params (excluding pagination/sorting keys)
        const filterKeys = ['sortBy', 'order', 'page', 'limit'];
        const where: Record<string, any> = {};
        Object.entries(query || {}).forEach(([key, value]) => {
            if (!filterKeys.includes(key) && value !== undefined) {
                if (key === 'trial') {
                    where.trial = value === 'true';
                } else {
                    where[key] = value;
                }
            }
        });


        const applications = await this.prisma.application.findMany({
            where,
            orderBy: { [sortField]: sortOrder },
            skip,
            take,
        });

        return {
            applications,
        };
    }

}