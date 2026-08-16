import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  // In production, you would use a separate test database
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data before each test
  // await prisma.usuario.deleteMany();
});

afterEach(async () => {
  // Clean up test data after each test
  // await prisma.usuario.deleteMany();
});
