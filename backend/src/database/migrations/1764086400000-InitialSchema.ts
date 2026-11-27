import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial MariStay schema — the eight Lab 04 tables.
 *
 * Generated from the TypeORM entities (`migration:generate --dryrun`) and then
 * extended by hand with CHECK constraints, which TypeORM's MySQL driver does
 * not manage. CHECK constraints are enforced by MySQL 8.0.16+ and MariaDB 10.2+.
 *
 * Every foreign key uses ON DELETE RESTRICT so reservation and payment
 * history can never be removed by a cascading delete.
 */
export class InitialSchema1764086400000 implements MigrationInterface {
  name = 'InitialSchema1764086400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ---------- Table 1: guests ----------
    await queryRunner.query(`
      CREATE TABLE \`guests\` (
        \`guestId\` int NOT NULL AUTO_INCREMENT,
        \`firstName\` varchar(50) NOT NULL,
        \`lastName\` varchar(50) NOT NULL,
        \`email\` varchar(100) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`phoneNumber\` varchar(20) NOT NULL,
        \`accountStatus\` varchar(20) NOT NULL DEFAULT 'ACTIVE',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_guests_email\` (\`email\`),
        PRIMARY KEY (\`guestId\`),
        CONSTRAINT \`CHK_guests_accountStatus\` CHECK (\`accountStatus\` IN ('ACTIVE','INACTIVE'))
      ) ENGINE = InnoDB
    `);

    // ---------- Table 2: rooms ----------
    await queryRunner.query(`
      CREATE TABLE \`rooms\` (
        \`roomId\` int NOT NULL AUTO_INCREMENT,
        \`roomNo\` varchar(10) NOT NULL,
        \`roomType\` varchar(50) NOT NULL,
        \`pricePerNight\` decimal(10,2) NOT NULL,
        \`roomStatus\` varchar(20) NOT NULL DEFAULT 'AVAILABLE',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_rooms_roomNo\` (\`roomNo\`),
        INDEX \`IDX_rooms_status_type\` (\`roomStatus\`, \`roomType\`),
        PRIMARY KEY (\`roomId\`),
        CONSTRAINT \`CHK_rooms_pricePerNight\` CHECK (\`pricePerNight\` >= 0),
        CONSTRAINT \`CHK_rooms_roomStatus\` CHECK (\`roomStatus\` IN ('AVAILABLE','OCCUPIED','CLEANING','MAINTENANCE'))
      ) ENGINE = InnoDB
    `);

    // ---------- Table 7: staff ----------
    await queryRunner.query(`
      CREATE TABLE \`staff\` (
        \`staffId\` int NOT NULL AUTO_INCREMENT,
        \`firstName\` varchar(50) NOT NULL,
        \`lastName\` varchar(50) NOT NULL,
        \`role\` varchar(20) NOT NULL,
        \`email\` varchar(100) NOT NULL,
        \`passwordHash\` varchar(255) NOT NULL,
        \`accountStatus\` varchar(20) NOT NULL DEFAULT 'ACTIVE',
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_staff_email\` (\`email\`),
        PRIMARY KEY (\`staffId\`),
        CONSTRAINT \`CHK_staff_role\` CHECK (\`role\` IN ('FRONT_DESK','HOUSEKEEPING','MANAGER')),
        CONSTRAINT \`CHK_staff_accountStatus\` CHECK (\`accountStatus\` IN ('ACTIVE','INACTIVE'))
      ) ENGINE = InnoDB
    `);

    // ---------- Table 3: reservations ----------
    await queryRunner.query(`
      CREATE TABLE \`reservations\` (
        \`reservationId\` int NOT NULL AUTO_INCREMENT,
        \`guestId\` int NOT NULL,
        \`roomId\` int NOT NULL,
        \`checkInDate\` date NOT NULL,
        \`checkOutDate\` date NOT NULL,
        \`reservationStatus\` varchar(20) NOT NULL DEFAULT 'PENDING',
        \`ratePerNight\` decimal(10,2) NOT NULL,
        \`totalAmount\` decimal(10,2) NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX \`IDX_reservations_guest\` (\`guestId\`),
        INDEX \`IDX_reservations_status\` (\`reservationStatus\`),
        INDEX \`IDX_reservations_room_dates\` (\`roomId\`, \`checkInDate\`, \`checkOutDate\`),
        PRIMARY KEY (\`reservationId\`),
        CONSTRAINT \`CHK_reservations_dates\` CHECK (\`checkOutDate\` > \`checkInDate\`),
        CONSTRAINT \`CHK_reservations_status\` CHECK (\`reservationStatus\` IN ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED')),
        CONSTRAINT \`CHK_reservations_amounts\` CHECK (\`ratePerNight\` >= 0 AND \`totalAmount\` >= 0),
        CONSTRAINT \`FK_reservations_guest\` FOREIGN KEY (\`guestId\`) REFERENCES \`guests\`(\`guestId\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_reservations_room\` FOREIGN KEY (\`roomId\`) REFERENCES \`rooms\`(\`roomId\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE = InnoDB
    `);

    // ---------- Table 4: payments ----------
    await queryRunner.query(`
      CREATE TABLE \`payments\` (
        \`paymentId\` int NOT NULL AUTO_INCREMENT,
        \`reservationId\` int NOT NULL,
        \`amount\` decimal(10,2) NOT NULL,
        \`paymentMethod\` varchar(30) NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'PENDING',
        \`date\` datetime NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_payments_reservation\` (\`reservationId\`),
        PRIMARY KEY (\`paymentId\`),
        CONSTRAINT \`CHK_payments_amount\` CHECK (\`amount\` > 0),
        CONSTRAINT \`CHK_payments_method\` CHECK (\`paymentMethod\` IN ('CASH','CARD','E_WALLET')),
        CONSTRAINT \`CHK_payments_status\` CHECK (\`status\` IN ('PENDING','PAID','FAILED','REFUNDED')),
        CONSTRAINT \`FK_payments_reservation\` FOREIGN KEY (\`reservationId\`) REFERENCES \`reservations\`(\`reservationId\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE = InnoDB
    `);

    // ---------- Table 5: digital_keys ----------
    await queryRunner.query(`
      CREATE TABLE \`digital_keys\` (
        \`keyId\` int NOT NULL AUTO_INCREMENT,
        \`reservationId\` int NOT NULL,
        \`keyCodeHash\` varchar(255) NOT NULL,
        \`issuedAt\` datetime NOT NULL,
        \`expiresAt\` datetime NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'ACTIVE',
        INDEX \`IDX_digital_keys_reservation\` (\`reservationId\`),
        UNIQUE INDEX \`UQ_digital_keys_keyCodeHash\` (\`keyCodeHash\`),
        PRIMARY KEY (\`keyId\`),
        CONSTRAINT \`CHK_digital_keys_status\` CHECK (\`status\` IN ('ACTIVE','EXPIRED','REVOKED')),
        CONSTRAINT \`CHK_digital_keys_validity\` CHECK (\`expiresAt\` > \`issuedAt\`),
        CONSTRAINT \`FK_digital_keys_reservation\` FOREIGN KEY (\`reservationId\`) REFERENCES \`reservations\`(\`reservationId\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE = InnoDB
    `);

    // ---------- Table 6: housekeeping ----------
    await queryRunner.query(`
      CREATE TABLE \`housekeeping\` (
        \`hkId\` int NOT NULL AUTO_INCREMENT,
        \`roomId\` int NOT NULL,
        \`staffId\` int NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'PENDING',
        \`lastUpdate\` datetime NOT NULL,
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX \`IDX_housekeeping_room_status\` (\`roomId\`, \`status\`),
        INDEX \`IDX_housekeeping_staff_status\` (\`staffId\`, \`status\`),
        PRIMARY KEY (\`hkId\`),
        CONSTRAINT \`CHK_housekeeping_status\` CHECK (\`status\` IN ('PENDING','IN_PROGRESS','COMPLETED')),
        CONSTRAINT \`FK_housekeeping_room\` FOREIGN KEY (\`roomId\`) REFERENCES \`rooms\`(\`roomId\`) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT \`FK_housekeeping_staff\` FOREIGN KEY (\`staffId\`) REFERENCES \`staff\`(\`staffId\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE = InnoDB
    `);

    // ---------- Table 8: service_orders ----------
    await queryRunner.query(`
      CREATE TABLE \`service_orders\` (
        \`orderId\` int NOT NULL AUTO_INCREMENT,
        \`reservationId\` int NOT NULL,
        \`serviceType\` varchar(50) NOT NULL,
        \`itemCode\` varchar(50) NOT NULL,
        \`quantity\` int NOT NULL DEFAULT '1',
        \`unitPrice\` decimal(10,2) NOT NULL,
        \`totalAmount\` decimal(10,2) NOT NULL,
        \`status\` varchar(20) NOT NULL DEFAULT 'PENDING',
        \`date\` datetime NOT NULL,
        \`notes\` varchar(255) NULL,
        INDEX \`IDX_service_orders_reservation\` (\`reservationId\`),
        INDEX \`IDX_service_orders_status\` (\`status\`),
        PRIMARY KEY (\`orderId\`),
        CONSTRAINT \`CHK_service_orders_amounts\` CHECK (\`unitPrice\` >= 0 AND \`totalAmount\` >= 0),
        CONSTRAINT \`CHK_service_orders_quantity\` CHECK (\`quantity\` >= 1),
        CONSTRAINT \`CHK_service_orders_status\` CHECK (\`status\` IN ('PENDING','PREPARING','DELIVERED','CANCELLED')),
        CONSTRAINT \`FK_service_orders_reservation\` FOREIGN KEY (\`reservationId\`) REFERENCES \`reservations\`(\`reservationId\`) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE = InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Children first, then parents.
    for (const table of [
      'service_orders',
      'housekeeping',
      'digital_keys',
      'payments',
      'reservations',
      'staff',
      'rooms',
      'guests',
    ]) {
      await queryRunner.query(`DROP TABLE \`${table}\``);
    }
  }
}
