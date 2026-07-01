import { IsArray, ArrayMinSize, IsString } from 'class-validator';

export class UpdateRosterDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  proPlayerIds!: string[];
}
