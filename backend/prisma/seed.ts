import 'dotenv/config';
import { PrismaClient, OwnerType, ScheduleScope, ScheduleStatus, BusyStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/mycalendar?schema=public';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Create or ensure demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@godlife.io' },
    update: {},
    create: {
      email: 'demo@godlife.io',
      name: '데모 사용자',
      profileImage: null,
    },
  });
  console.log(`✅ Demo User ready: ${demoUser.name} (${demoUser.id})`);

  // 2. Default System Uncategorized Category (Main & Sub)
  const defaultMain = await prisma.categoryMain.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '미분류',
      color: '#9AA0A6',
      isDefault: true,
    },
  });

  const defaultSub = await prisma.categorySub.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '미분류',
      isDefault: true,
    },
  });

  // Default Sub Stages (예정, 진행중, 완료)
  const defaultStages = [
    { name: '예정', sequence: 1, isDefault: true, color: '#6B7280' },
    { name: '진행중', sequence: 2, isDefault: false, color: '#3B82F6' },
    { name: '완료', sequence: 3, isDefault: false, color: '#10B981' },
  ];
  for (const st of defaultStages) {
    await prisma.categoryStage.create({
      data: {
        subCategoryId: defaultSub.id,
        name: st.name,
        sequence: st.sequence,
        isDefault: st.isDefault,
        color: st.color,
      },
    });
  }

  // Map Default Main <-> Default Sub
  await prisma.categoryHierarchyMapping.upsert({
    where: {
      mainCategoryId_subCategoryId: {
        mainCategoryId: defaultMain.id,
        subCategoryId: defaultSub.id,
      },
    },
    update: {},
    create: {
      mainCategoryId: defaultMain.id,
      subCategoryId: defaultSub.id,
    },
  });
  console.log('✅ Default [미분류][미분류] category mapping & default stages established.');

  // 3. Business Scenario: 고객사(대분류) - 프로젝트(소분류: 기간 지정 및 6단계 워크플로우)
  const clientMain = await prisma.categoryMain.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '고객사 A',
      color: '#1A73E8',
    },
  });

  const projectSub = await prisma.categorySub.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '프로젝트 A1 (스마트 캘린더 구축)',
      startDate: new Date('2026-03-01T00:00:00Z'),
      endDate: new Date('2026-12-31T23:59:59Z'),
    },
  });

  // Project A1 Custom Workflow Stages: 기획중-설계중-개발중-시험중-배포중-완료
  const projectStageDefs = [
    { name: '기획중', sequence: 1, isDefault: true, color: '#8B5CF6' },
    { name: '설계중', sequence: 2, isDefault: false, color: '#EC4899' },
    { name: '개발중', sequence: 3, isDefault: false, color: '#3B82F6' },
    { name: '시험중', sequence: 4, isDefault: false, color: '#F59E0B' },
    { name: '배포중', sequence: 5, isDefault: false, color: '#10B981' },
    { name: '완료', sequence: 6, isDefault: false, color: '#6B7280' },
  ];

  const projectStages: any[] = [];
  for (const st of projectStageDefs) {
    const createdStage = await prisma.categoryStage.create({
      data: {
        subCategoryId: projectSub.id,
        name: st.name,
        sequence: st.sequence,
        isDefault: st.isDefault,
        color: st.color,
      },
    });
    projectStages.push(createdStage);
  }

  await prisma.categoryHierarchyMapping.create({
    data: {
      mainCategoryId: clientMain.id,
      subCategoryId: projectSub.id,
    },
  });

  // 4. Internal Business Scenario: 내부 업무 (경리) - 월말결산 (기한 무제한, 기본 3단계: 예정-진행중-완료)
  const accountingMain = await prisma.categoryMain.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '경리',
      color: '#059669',
    },
  });

  const monthlyClosingSub = await prisma.categorySub.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '월말결산',
      // startDate, endDate 는 기본값 ('0001-01-01' ~ '9999-12-31') 자동 적용
    },
  });

  // 기본 3단계 자동 적용
  for (const st of defaultStages) {
    await prisma.categoryStage.create({
      data: {
        subCategoryId: monthlyClosingSub.id,
        name: st.name,
        sequence: st.sequence,
        isDefault: st.isDefault,
        color: st.color,
      },
    });
  }

  await prisma.categoryHierarchyMapping.create({
    data: {
      mainCategoryId: accountingMain.id,
      subCategoryId: monthlyClosingSub.id,
    },
  });

  // 5. Sample Schedules linked to Categories & Specific Stages
  // 일정 1: 고객사 A -> 프로젝트 A1 -> [개발중] 단계 일정
  const devStage = projectStages.find((s) => s.name === '개발중');
  await prisma.schedule.create({
    data: {
      creatorId: demoUser.id,
      mainCategoryId: clientMain.id,
      subCategoryId: projectSub.id,
      stageId: devStage?.id,
      title: '프로젝트 A1 백엔드 API & DB 마이그레이션 개발',
      status: ScheduleStatus.PLANNED,
      startTime: new Date('2026-09-28T09:00:00+09:00'),
      endTime: new Date('2026-09-28T18:00:00+09:00'),
      description: '카테고리 2레벨 계층화 및 진행단계(Workflow) DB 적용 작업',
      scopeType: ScheduleScope.USER,
      busyStatus: BusyStatus.BUSY,
    },
  });

  console.log('✅ Sample Business Scenarios & Schedules with Stages seeded.');
  console.log('✨ Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
