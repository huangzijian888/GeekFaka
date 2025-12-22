import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Category
  const category = await prisma.category.upsert({
    where: { slug: 'streaming' },
    update: {},
    create: {
      name: 'Streaming Services',
      slug: 'streaming',
      priority: 10,
    },
  })

  // Create Product 1
  const netflix = await prisma.product.create({
    data: {
      name: 'Netflix 4K Ultra HD (1 Month)',
      description: 'Private profile, 4K support, 30 days warranty.',
      price: 3.50,
      categoryId: category.id,
      licenses: {
        create: [
          { code: 'NF-1111-2222-3333' },
          { code: 'NF-4444-5555-6666' },
          { code: 'NF-7777-8888-9999' },
        ]
      }
    }
  })

  // Create Product 2
  const spotify = await prisma.product.create({
    data: {
      name: 'Spotify Premium Individual (1 Month)',
      description: 'Upgrade your own account. No ads, offline listening.',
      price: 1.99,
      categoryId: category.id,
      licenses: {
        create: [
          { code: 'SP-AAAA-BBBB-CCCC' },
          { code: 'SP-DDDD-EEEE-FFFF' },
        ]
      }
    }
  })

  console.log({ category, netflix, spotify })
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
