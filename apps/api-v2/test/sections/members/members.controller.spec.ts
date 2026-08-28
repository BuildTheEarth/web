import { Test, TestingModule } from '@nestjs/testing';
import { MembersController } from 'src/sections/members/members.controller';
import { MembersService } from 'src/sections/members/members.service';

describe('MembersController', () => {
	let membersController: MembersController;
	let membersService: {
		findAll: jest.Mock;
		findOne: jest.Mock;
		create: jest.Mock;
		add: jest.Mock;
		delete: jest.Mock;
		findAllPermissions: jest.Mock;
		upsertPermissions: jest.Mock;
		deletePermission: jest.Mock;
	};

	const pagination = { page: 1, limit: 20 };
	const sorting = { sortBy: 'username', order: 'asc' };

	beforeEach(async () => {
		membersService = {
			findAll: jest.fn(),
			findOne: jest.fn(),
			create: jest.fn(),
			add: jest.fn(),
			delete: jest.fn(),
			findAllPermissions: jest.fn(),
			upsertPermissions: jest.fn(),
			deletePermission: jest.fn(),
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [MembersController],
			providers: [{ provide: MembersService, useValue: membersService }],
		}).compile();

		membersController = module.get<MembersController>(MembersController);
	});

	it('should list the members of the authenticated team', async () => {
		membersService.findAll.mockResolvedValue({ data: [], meta: {} });

		await membersController.getMembers(
			pagination as never,
			sorting as never,
			{ filter: { minecraft: 'Notch' } } as never,
			'team-123',
		);

		expect(membersService.findAll).toHaveBeenCalledWith('team-123', pagination, 'username', 'asc', {
			minecraft: 'Notch',
		});
	});

	it('should add a member by reference', async () => {
		membersService.create.mockResolvedValue({ id: 'user-1' });

		const result = await membersController.addMember({ minecraft: 'Notch' }, 'team-123');

		expect(membersService.create).toHaveBeenCalledWith({ minecraft: 'Notch' }, 'team-123');
		expect(result).toEqual({ id: 'user-1' });
	});

	it('should return a single member', async () => {
		membersService.findOne.mockResolvedValue({ id: 'user-1' });

		await membersController.getMember('user-1', 'team-123');

		expect(membersService.findOne).toHaveBeenCalledWith('user-1', 'team-123');
	});

	it('should put a membership by user id', async () => {
		membersService.add.mockResolvedValue({ id: 'user-1' });

		await membersController.putMember('user-1', 'team-123');

		expect(membersService.add).toHaveBeenCalledWith('user-1', 'team-123');
	});

	it('should remove a member', async () => {
		membersService.delete.mockResolvedValue({ id: 'user-1' });

		await membersController.deleteMember('user-1', 'team-123');

		expect(membersService.delete).toHaveBeenCalledWith('user-1', 'team-123');
	});

	it('should list a member permissions', async () => {
		membersService.findAllPermissions.mockResolvedValue([]);

		await membersController.getMemberPermissions('user-1', 'team-123');

		expect(membersService.findAllPermissions).toHaveBeenCalledWith('user-1', 'team-123');
	});

	it('should grant permissions to a member', async () => {
		membersService.upsertPermissions.mockResolvedValue([]);

		const dtos = [{ permissionId: 'team.claim.list' }];
		await membersController.upsertMemberPermissions('user-1', dtos, 'team-123');

		expect(membersService.upsertPermissions).toHaveBeenCalledWith('user-1', dtos, 'team-123');
	});

	it('should revoke a single grant', async () => {
		membersService.deletePermission.mockResolvedValue({ id: 'grant-1' });

		await membersController.deleteMemberPermission('user-1', 'grant-1', 'team-123');

		expect(membersService.deletePermission).toHaveBeenCalledWith('user-1', 'grant-1', 'team-123');
	});
});
