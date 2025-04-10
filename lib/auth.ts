import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export async function createUser(username: string, password: string, email: string, role: string = 'customer') {
  const hashedPassword = await hashPassword(password);
  
  return prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      email,
      role
    }
  });
}

export async function createClient(userId: number, name: string, bio: string | null = null, slug: string, clientTypeId: number) {
  return prisma.client.create({
    data: {
      userId,
      name,
      bio,
      slug,
      clientTypeId
    }
  });
}
