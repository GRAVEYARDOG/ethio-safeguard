// prisma/seed.ts
import { PrismaClient, UserRole, VehicleType, VehicleStatus, DeliveryStatus } from '../src/generated/prisma';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@ethiosafeguard.org' },
    update: {},
    create: {
      email: 'admin@ethiosafeguard.org',
      passwordHash: adminPassword,
      name: 'System Administrator',
      role: UserRole.ADMIN,
      phoneNumber: '+251911223344',
    },
  });

  // Coordinator users
  const coordinatorPassword = await bcrypt.hash('coordinator123', 12);
  await prisma.user.upsert({
    where: { email: 'coordinator1@ethiosafeguard.org' },
    update: {},
    create: {
      email: 'coordinator1@ethiosafeguard.org',
      passwordHash: coordinatorPassword,
      name: 'Aid Coordinator 1',
      role: UserRole.COORDINATOR,
      phoneNumber: '+251911223345',
    },
  });

  await prisma.user.upsert({
    where: { email: 'coordinator2@ethiosafeguard.org' },
    update: {},
    create: {
      email: 'coordinator2@ethiosafeguard.org',
      passwordHash: coordinatorPassword,
      name: 'Aid Coordinator 2',
      role: UserRole.COORDINATOR,
      phoneNumber: '+251911223346',
    },
  });

  // Driver users
  const driverPassword = await bcrypt.hash('driver123', 12);
  const driver1 = await prisma.user.upsert({
    where: { email: 'driver1@ethiosafeguard.org' },
    update: {},
    create: {
      email: 'driver1@ethiosafeguard.org',
      passwordHash: driverPassword,
      name: 'Alemayehu Kebede',
      role: UserRole.DRIVER,
      phoneNumber: '+251911223347',
    },
  });

  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@ethiosafeguard.org' },
    update: {},
    create: {
      email: 'driver2@ethiosafeguard.org',
      passwordHash: driverPassword,
      name: 'Tewodros Getachew',
      role: UserRole.DRIVER,
      phoneNumber: '+251911223348',
    },
  });

  // Vehicles
  await prisma.vehicle.upsert({
    where: { id: 'vehicle-001' },
    update: {},
    create: {
      id: 'vehicle-001',
      name: 'Aid Truck 01',
      type: VehicleType.TRUCK,
      status: VehicleStatus.ACTIVE,
      currentDriverId: driver1.id,
    },
  });

  await prisma.vehicle.upsert({
    where: { id: 'vehicle-002' },
    update: {},
    create: {
      id: 'vehicle-002',
      name: 'Ambulance 01',
      type: VehicleType.AMBULANCE,
      status: VehicleStatus.ACTIVE,
      currentDriverId: driver2.id,
    },
  });

  await prisma.vehicle.upsert({
    where: { id: 'vehicle-003' },
    update: {},
    create: {
      id: 'vehicle-003',
      name: 'Supply Van 01',
      type: VehicleType.VAN,
      status: VehicleStatus.MAINTENANCE,
    },
  });

  // Deliveries
  await prisma.delivery.upsert({
    where: { id: 'delivery-001' },
    update: {},
    create: {
      id: 'delivery-001',
      vehicleId: 'vehicle-001',
      assignedDriverId: driver1.id,
      scheduledDeparture: new Date('2024-01-15T08:00:00Z'),
      scheduledArrival: new Date('2024-01-15T14:00:00Z'),
      status: DeliveryStatus.IN_PROGRESS,
      cargoDescription: 'Emergency food supplies for Tigray region - 5 tons',
    },
  });

  await prisma.delivery.upsert({
    where: { id: 'delivery-002' },
    update: {},
    create: {
      id: 'delivery-002',
      vehicleId: 'vehicle-002',
      assignedDriverId: driver2.id,
      scheduledDeparture: new Date('2024-01-16T09:00:00Z'),
      scheduledArrival: new Date('2024-01-16T12:00:00Z'),
      status: DeliveryStatus.PENDING,
      cargoDescription: 'Medical supplies and vaccines for Afar region',
    },
  });

  console.log('✅ Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
