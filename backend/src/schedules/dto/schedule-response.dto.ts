import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ScheduleScope,
  ScheduleStatus,
  BusyStatus,
  AttendeeResponseStatus,
  ReminderMethod,
} from '@prisma/client';
import {
  CategoryMainResponseDto,
  CategorySubResponseDto,
  StageResponseDto,
} from '../../categories/dto/category-response.dto';

export class ScheduleAttendeeResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-...' })
  id: string;

  @ApiProperty({ example: 'colleague@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '김동료' })
  displayName?: string | null;

  @ApiProperty({ enum: AttendeeResponseStatus, example: AttendeeResponseStatus.NEEDS_ACTION })
  responseStatus: AttendeeResponseStatus;
}

export class ScheduleReminderResponseDto {
  @ApiProperty({ example: 'r1e2m3i4-...' })
  id: string;

  @ApiProperty({ enum: ReminderMethod, example: ReminderMethod.POPUP })
  method: ReminderMethod;

  @ApiProperty({ example: 10 })
  minutes: number;
}

export class ScheduleResponseDto {
  @ApiProperty({ example: 's1c2h3e4-...' })
  id: string;

  @ApiProperty({ example: '프로젝트 A1 백엔드 개발 스프린트' })
  title: string;

  @ApiProperty({ enum: ScheduleScope, example: ScheduleScope.USER })
  scopeType: ScheduleScope;

  @ApiPropertyOptional({ example: 't1e2a3m4-...' })
  teamId?: string | null;

  @ApiProperty({ example: 'u1s2e3r4-...' })
  creatorId: string;

  @ApiProperty({ enum: ScheduleStatus, example: ScheduleStatus.PLANNED })
  status: ScheduleStatus;

  @ApiProperty({ example: '2026-09-28T09:00:00.000Z' })
  startTime: Date;

  @ApiProperty({ example: '2026-09-28T18:00:00.000Z' })
  endTime: Date;

  @ApiProperty({ example: false })
  isAllDay: boolean;

  @ApiProperty({ example: false })
  isTask: boolean;

  @ApiPropertyOptional({ example: '회의실 B' })
  location?: string | null;

  @ApiPropertyOptional({ example: '카테고리 2레벨 계층화 및 진행단계 DB 적용' })
  description?: string | null;

  @ApiPropertyOptional({ example: '1' })
  colorId?: string | null;

  @ApiProperty({ enum: BusyStatus, example: BusyStatus.BUSY })
  busyStatus: BusyStatus;

  @ApiPropertyOptional({ example: 'RRULE:FREQ=WEEKLY' })
  rrule?: string | null;

  @ApiProperty({ example: 1 })
  version: number;

  @ApiPropertyOptional({ type: CategoryMainResponseDto })
  mainCategory?: CategoryMainResponseDto;

  @ApiPropertyOptional({ type: CategorySubResponseDto })
  subCategory?: CategorySubResponseDto;

  @ApiPropertyOptional({ type: StageResponseDto })
  stage?: StageResponseDto | null;

  @ApiProperty({ type: [ScheduleAttendeeResponseDto] })
  attendees: ScheduleAttendeeResponseDto[];

  @ApiProperty({ type: [ScheduleReminderResponseDto] })
  reminders: ScheduleReminderResponseDto[];

  @ApiProperty({ example: '2026-09-27T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-27T00:00:00.000Z' })
  updatedAt: Date;
}
