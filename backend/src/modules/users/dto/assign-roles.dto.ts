import { ArrayNotEmpty, IsArray } from "class-validator";
import { RoleName } from "../../../common/constant/roles.constants";

export class AssignRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  roles!: RoleName[];
}
