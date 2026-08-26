import { ApiProperty } from '@nestjs/swagger';

export class ApplicationTemplateDto {
	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The unique ID of the response template.',
	})
	id: string;

	@ApiProperty({
		example: '00000000-0000-0000-0000-000000000000',
		description: 'The ID of the build team this template belongs to.',
	})
	buildteamId: string;

	@ApiProperty({
		example: 'Response Template',
		description: 'The name of the template, used to identify it while reviewing.',
	})
	name: string;

	@ApiProperty({
		example: 'Thanks for applying! Unfortunately we cannot accept you at this time.',
		description: 'The message that is sent to the applicant.',
	})
	content: string;
}
