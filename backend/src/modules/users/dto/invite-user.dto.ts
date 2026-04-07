import { ArrayNotEmpty, IsArray, IsEmail, IsIn, IsOptional } from 'class-validator';
import { ROLES, RoleName } from '../../../common/constant/roles.constants';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(Object.values(ROLES), { each: true })
  roles?: RoleName[];
}