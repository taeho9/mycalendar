import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateScheduleDto } from './create-schedule.dto';
import { IsOptional, IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateScheduleDto extends PartialType(CreateScheduleDto) {}

export class UpdateScheduleStageDto {
  @ApiPropertyOptional({
    description: 'Target Workflow Stage UUID to transition this schedule to (null to detach)',
    example: 'e3f9a0b2-...',
  })
  @IsOptional()
  @IsUUID()
  stageId?: string | null;
}
