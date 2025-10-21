// FIX: Changed to a namespace import to resolve issues where named exports were not being found, likely due to module resolution problems.
import * as PrismaAll from '@prisma/client';

const { PrismaClient } = PrismaAll;

const prisma = new PrismaClient();

export default prisma;
