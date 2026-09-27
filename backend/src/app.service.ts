import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'MyCalendar Collaboration API Server is running!';
  }

  getHealth(): { status: string; timestamp: string; timezone: string } {
    const tz = process.env.TZ || 'Asia/Seoul';
    const now = new Date();

    // 로컬 타임존 오프셋 계산 (KST 기준 UTC+9 -> +09:00)
    const offsetMinutes = now.getTimezoneOffset();
    const localTime = new Date(now.getTime() - offsetMinutes * 60 * 1000);
    const sign = offsetMinutes <= 0 ? '+' : '-';
    const absMinutes = Math.abs(offsetMinutes);
    const hours = String(Math.floor(absMinutes / 60)).padStart(2, '0');
    const mins = String(absMinutes % 60).padStart(2, '0');
    const offsetStr = `${sign}${hours}:${mins}`;

    const timestamp = localTime.toISOString().replace('Z', offsetStr);

    return {
      status: 'ok',
      timestamp,
      timezone: tz,
    };
  }
}
