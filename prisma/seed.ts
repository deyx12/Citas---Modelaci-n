import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.userProfile.upsert({
    where: { email: "admin@clinicabelen.local" },
    update: {},
    create: {
      email: "admin@clinicabelen.local",
      name: "Administrador",
      role: "ADMIN"
    }
  });

  const specialty = await prisma.specialty.upsert({
    where: { name: "Medicina General" },
    update: {},
    create: {
      name: "Medicina General",
      description: "Atencion primaria y consulta general."
    }
  });

  await prisma.doctor.upsert({
    where: { email: "juan.perez@clinicabelen.local" },
    update: {},
    create: {
      name: "Dr. Juan Perez",
      email: "juan.perez@clinicabelen.local",
      specialtyId: specialty.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
