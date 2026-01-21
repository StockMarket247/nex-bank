import { SetMetadata } from '@nestjs/common';
import { AdminRole } from '../../database/schemas/admin.schema';

export const Roles = (...roles: AdminRole[]) => SetMetadata('roles', roles);

