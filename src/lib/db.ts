import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getDatabaseUrl() {
  // Neon might use POSTGRES_URL or DATABASE_URL
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL
}

function createPrismaClient() {
  try {
    const dbUrl = getDatabaseUrl()
    
    if (!dbUrl) {
      console.warn('No database URL found. Using fallback.')
    }
    
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: dbUrl
        }
      }
    })
  } catch (error) {
    console.error('Failed to create Prisma client:', error)
    throw error
  }
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
