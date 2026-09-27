import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsArray,
  ValidateNested,
  IsInt,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleScope, ScheduleStatus, BusyStatus, ReminderMethod } from '@prisma/client';

export class CreateAttendeeDto {
  @ApiProperty({ description: 'Attendee Email Address', example: 'colleague@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Attendee Display Name', example: '김동료' })
  @IsOptional()
  @IsString()
  displayName?: string;
}

export class CreateReminderDto {
  @ApiPropertyOptional({ enum: ReminderMethod, default: ReminderMethod.POPUP })
  @IsOptional()
  @IsEnum(ReminderMethod)
  method?: ReminderMethod;

  @ApiProperty({ description: 'Minutes before schedule to trigger reminder', example: 10, default: 10 })
  @IsInt()
  minutes: number;
}

export class CreateScheduleDto {
  @ApiProperty({ description: 'Schedule Title', example: '프로젝트 A1 백엔드 API 개발 스프린트' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Start Date & Time (ISO 8601 string)', example: '2026-09-28T09:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End Date & Time (ISO 8601 string)', example: '2026-09-28T18:00:00.000Z' })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Main Category UUID (e.g. 고객사 A). If omitted, falls back to default [미분류]',
    example: 'c1f7a8b0-...',
  })
  @IsOptional()
  @IsUUID()
  mainCategoryId?: string;

  @ApiPropertyOptional({
    description: 'Sub Category UUID (e.g. 프로젝트 A1). If omitted, falls back to default [미분류]',
    example: 'd2e8b9c1-...',
  })
  @IsOptional()
  @IsUUID()
  subCategoryId?: string;

  @ApiPropertyOptional({
    description: 'Workflow Stage UUID (e.g. 개발중). If omitted, automatically defaults to SubCategory default stage (e.g. 예정)',
    example: 'e3f9a0b2-...',
  })
  @IsOptional()
  @IsUUID()
  stageId?: string;

  @ApiPropertyOptional({ enum: ScheduleScope, default: ScheduleScope.USER })
  @IsOptional()
  @IsEnum(ScheduleScope)
  scopeType?: ScheduleScope;

  @ApiPropertyOptional({ description: 'Team ID if scopeType is TEAM', example: 't1u2v3w4-...' })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({
    enum: ScheduleStatus,
    default: ScheduleStatus.PLANNED,
    description: 'PLANNED (예정) or COMPLETED (완료 - 사후 등록 시)',
  })
  @IsOptional()
  @IsEnum(ScheduleStatus)
  status?: ScheduleStatus;

  @ApiPropertyOptional({ default: false, description: 'True for full-day event' })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiPropertyOptional({ default: false, description: 'True if this is a To-Do / Task' })
  @IsOptional()
  @IsBoolean()
  isTask?: boolean;

  @ApiPropertyOptional({ description: 'Event location', example: '회의실 B' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Detailed event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Google Calendar compatible color ID' })
  @IsOptional()
  @IsString()
  colorId?: string;

  @ApiPropertyOptional({ enum: BusyStatus, default: BusyStatus.BUSY })
  @IsOptional()
  @IsEnum(BusyStatus)
  busyStatus?: BusyStatus;

  @ApiPropertyOptional({ description: 'Recurrence Rule (RFC 5545 iCalendar RRULE)', example: 'RRULE:FREQ=WEEKLY;BYDAY=MO' })
  @IsOptional()
  @IsString()
  rrule?: string;

  @ApiPropertyOptional({ type: [CreateAttendeeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttendeeDto)
  attendees?: CreateAttendeeDto[];

  @ApiPropertyOptional({ type: [CreateReminderDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateReminderDto)
  reminders?: CreateReminderDto[];
}
