import 'dotenv/config';
import { PrismaClient, OwnerType } from '@prisma/client';
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
  console.log('✅ Default [미분류][미분류] category mapping established.');

  // 3. Sample M:N Hierarchical Categories (as specified in architecture doc)
  // Main Categories: 업무, 운동, 취미
  const workMain = await prisma.categoryMain.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '업무',
      color: '#1A73E8',
    },
  });

  const workoutMain = await prisma.categoryMain.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '운동',
      color: '#FBBC04',
    },
  });

  const hobbyMain = await prisma.categoryMain.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '취미',
      color: '#EA4335',
    },
  });

  // Sub Categories: 개발, 회의, 하이킹 (운동과 취미 양쪽에 결속!)
  const devSub = await prisma.categorySub.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '개발',
    },
  });

  const meetingSub = await prisma.categorySub.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '회의',
    },
  });

  const hikingSub = await prisma.categorySub.create({
    data: {
      ownerType: OwnerType.USER,
      ownerId: demoUser.id,
      name: '하이킹',
    },
  });

  // M:N Hierarchy Mappings
  await prisma.categoryHierarchyMapping.createMany({
    data: [
      { mainCategoryId: workMain.id, subCategoryId: devSub.id },
      { mainCategoryId: workMain.id, subCategoryId: meetingSub.id },
      { mainCategoryId: workoutMain.id, subCategoryId: hikingSub.id }, // 운동 -> 하이킹
      { mainCategoryId: hobbyMain.id, subCategoryId: hikingSub.id },   // 취미 -> 하이킹 (다대다 검속!)
    ],
    skipDuplicates: true,
  });
  console.log('✅ Sample M:N Categories (업무->개발/회의, 운동->하이킹, 취미->하이킹) created.');

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
