-- =====================================================================
-- MariStay: Hotel Management and Digital Guest Services System
-- ITEC 116 Final Project — MySQL database export
--
-- Generated with mysqldump (MariaDB 10.4.32 / XAMPP) from the live,
-- migrated and seeded `maristay_db` database on 2026-11-25.
-- Contents: all 8 tables (guests, rooms, reservations, payments,
-- digital_keys, housekeeping, staff, service_orders) + TypeORM
-- `migrations` bookkeeping table, primary keys, foreign keys, indexes,
-- CHECK constraints and fictional demonstration records.
--
-- Passwords are stored only as bcrypt hashes. The demo accounts' password
-- is NOT in this file or in the repository (see README "Demo accounts").
--
-- Import (command line):   mysql -u root -p < exports/maristay.sql
-- Import (phpMyAdmin):     Import tab -> choose this file -> Go
-- The script creates `maristay_db` if it does not exist. Import into an
-- empty server/database (it does not drop existing tables).
-- =====================================================================

-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: maristay_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `maristay_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `maristay_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;

USE `maristay_db`;

--
-- Table structure for table `digital_keys`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `digital_keys` (
  `keyId` int(11) NOT NULL AUTO_INCREMENT,
  `reservationId` int(11) NOT NULL,
  `keyCodeHash` varchar(255) NOT NULL,
  `issuedAt` datetime NOT NULL,
  `expiresAt` datetime NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (`keyId`),
  UNIQUE KEY `UQ_digital_keys_keyCodeHash` (`keyCodeHash`),
  KEY `IDX_digital_keys_reservation` (`reservationId`),
  CONSTRAINT `FK_digital_keys_reservation` FOREIGN KEY (`reservationId`) REFERENCES `reservations` (`reservationId`) ON UPDATE CASCADE,
  CONSTRAINT `CHK_digital_keys_status` CHECK (`status` in ('ACTIVE','EXPIRED','REVOKED')),
  CONSTRAINT `CHK_digital_keys_validity` CHECK (`expiresAt` > `issuedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `digital_keys`
--

LOCK TABLES `digital_keys` WRITE;
/*!40000 ALTER TABLE `digital_keys` DISABLE KEYS */;
/*!40000 ALTER TABLE `digital_keys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guests`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `guests` (
  `guestId` int(11) NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `phoneNumber` varchar(20) NOT NULL,
  `accountStatus` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`guestId`),
  UNIQUE KEY `UQ_guests_email` (`email`),
  CONSTRAINT `CHK_guests_accountStatus` CHECK (`accountStatus` in ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guests`
--

LOCK TABLES `guests` WRITE;
/*!40000 ALTER TABLE `guests` DISABLE KEYS */;
INSERT INTO `guests` (`guestId`, `firstName`, `lastName`, `email`, `passwordHash`, `phoneNumber`, `accountStatus`, `createdAt`, `updatedAt`) VALUES (1,'Juan','Dela Cruz','juan.delacruz@example.com','$2b$10$LuHVLMUbQ9kyI8hTsT2H0uoKX9c4TZSPy7y0pQ2tp0E0uKngpUkpy','09170000001','ACTIVE','2026-11-25 23:02:16.434682','2026-11-25 23:27:16.035091');
INSERT INTO `guests` (`guestId`, `firstName`, `lastName`, `email`, `passwordHash`, `phoneNumber`, `accountStatus`, `createdAt`, `updatedAt`) VALUES (2,'Ana','Mendoza','ana.mendoza@example.com','$2b$10$LuHVLMUbQ9kyI8hTsT2H0uoKX9c4TZSPy7y0pQ2tp0E0uKngpUkpy','09170000002','ACTIVE','2026-11-25 23:02:16.436569','2026-11-25 23:27:16.035091');
/*!40000 ALTER TABLE `guests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `housekeeping`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `housekeeping` (
  `hkId` int(11) NOT NULL AUTO_INCREMENT,
  `roomId` int(11) NOT NULL,
  `staffId` int(11) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `lastUpdate` datetime NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`hkId`),
  KEY `IDX_housekeeping_room_status` (`roomId`,`status`),
  KEY `IDX_housekeeping_staff_status` (`staffId`,`status`),
  CONSTRAINT `FK_housekeeping_room` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`) ON UPDATE CASCADE,
  CONSTRAINT `FK_housekeeping_staff` FOREIGN KEY (`staffId`) REFERENCES `staff` (`staffId`) ON UPDATE CASCADE,
  CONSTRAINT `CHK_housekeeping_status` CHECK (`status` in ('PENDING','IN_PROGRESS','COMPLETED'))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `housekeeping`
--

LOCK TABLES `housekeeping` WRITE;
/*!40000 ALTER TABLE `housekeeping` DISABLE KEYS */;
INSERT INTO `housekeeping` (`hkId`, `roomId`, `staffId`, `status`, `lastUpdate`, `createdAt`) VALUES (1,5,3,'COMPLETED','2026-11-17 23:02:16','2026-11-25 23:02:16.464314');
INSERT INTO `housekeeping` (`hkId`, `roomId`, `staffId`, `status`, `lastUpdate`, `createdAt`) VALUES (2,4,3,'PENDING','2026-11-25 23:02:16','2026-11-25 23:02:16.473791');
/*!40000 ALTER TABLE `housekeeping` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `timestamp` bigint(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` (`id`, `timestamp`, `name`) VALUES (1,1764086400000,'InitialSchema1764086400000');
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `paymentId` int(11) NOT NULL AUTO_INCREMENT,
  `reservationId` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(30) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `date` datetime DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  PRIMARY KEY (`paymentId`),
  KEY `IDX_payments_reservation` (`reservationId`),
  CONSTRAINT `FK_payments_reservation` FOREIGN KEY (`reservationId`) REFERENCES `reservations` (`reservationId`) ON UPDATE CASCADE,
  CONSTRAINT `CHK_payments_amount` CHECK (`amount` > 0),
  CONSTRAINT `CHK_payments_method` CHECK (`paymentMethod` in ('CASH','CARD','E_WALLET')),
  CONSTRAINT `CHK_payments_status` CHECK (`status` in ('PENDING','PAID','FAILED','REFUNDED'))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` (`paymentId`, `reservationId`, `amount`, `paymentMethod`, `status`, `date`, `createdAt`) VALUES (1,1,5900.00,'CARD','PAID','2026-11-15 23:02:16','2026-11-25 23:02:16.461864');
INSERT INTO `payments` (`paymentId`, `reservationId`, `amount`, `paymentMethod`, `status`, `date`, `createdAt`) VALUES (2,2,5000.00,'E_WALLET','PAID','2026-11-25 23:02:16','2026-11-25 23:02:16.467169');
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reservations` (
  `reservationId` int(11) NOT NULL AUTO_INCREMENT,
  `guestId` int(11) NOT NULL,
  `roomId` int(11) NOT NULL,
  `checkInDate` date NOT NULL,
  `checkOutDate` date NOT NULL,
  `reservationStatus` varchar(20) NOT NULL DEFAULT 'PENDING',
  `ratePerNight` decimal(10,2) NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`reservationId`),
  KEY `IDX_reservations_guest` (`guestId`),
  KEY `IDX_reservations_status` (`reservationStatus`),
  KEY `IDX_reservations_room_dates` (`roomId`,`checkInDate`,`checkOutDate`),
  CONSTRAINT `FK_reservations_guest` FOREIGN KEY (`guestId`) REFERENCES `guests` (`guestId`) ON UPDATE CASCADE,
  CONSTRAINT `FK_reservations_room` FOREIGN KEY (`roomId`) REFERENCES `rooms` (`roomId`) ON UPDATE CASCADE,
  CONSTRAINT `CHK_reservations_dates` CHECK (`checkOutDate` > `checkInDate`),
  CONSTRAINT `CHK_reservations_status` CHECK (`reservationStatus` in ('PENDING','CONFIRMED','CHECKED_IN','CHECKED_OUT','CANCELLED')),
  CONSTRAINT `CHK_reservations_amounts` CHECK (`ratePerNight` >= 0 and `totalAmount` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` (`reservationId`, `guestId`, `roomId`, `checkInDate`, `checkOutDate`, `reservationStatus`, `ratePerNight`, `totalAmount`, `createdAt`, `updatedAt`) VALUES (1,1,5,'2026-11-15','2026-11-17','CHECKED_OUT',2500.00,5000.00,'2026-11-25 23:02:16.458982','2026-11-25 23:02:16.458982');
INSERT INTO `reservations` (`reservationId`, `guestId`, `roomId`, `checkInDate`, `checkOutDate`, `reservationStatus`, `ratePerNight`, `totalAmount`, `createdAt`, `updatedAt`) VALUES (2,1,6,'2026-12-09','2026-12-11','CONFIRMED',2500.00,5000.00,'2026-11-25 23:02:16.466236','2026-11-25 23:02:16.466236');
INSERT INTO `reservations` (`reservationId`, `guestId`, `roomId`, `checkInDate`, `checkOutDate`, `reservationStatus`, `ratePerNight`, `totalAmount`, `createdAt`, `updatedAt`) VALUES (3,2,7,'2026-12-02','2026-12-05','PENDING',4500.00,13500.00,'2026-11-25 23:02:16.471474','2026-11-25 23:02:16.471474');
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `rooms` (
  `roomId` int(11) NOT NULL AUTO_INCREMENT,
  `roomNo` varchar(10) NOT NULL,
  `roomType` varchar(50) NOT NULL,
  `pricePerNight` decimal(10,2) NOT NULL,
  `roomStatus` varchar(20) NOT NULL DEFAULT 'AVAILABLE',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`roomId`),
  UNIQUE KEY `UQ_rooms_roomNo` (`roomNo`),
  KEY `IDX_rooms_status_type` (`roomStatus`,`roomType`),
  CONSTRAINT `CHK_rooms_pricePerNight` CHECK (`pricePerNight` >= 0),
  CONSTRAINT `CHK_rooms_roomStatus` CHECK (`roomStatus` in ('AVAILABLE','OCCUPIED','CLEANING','MAINTENANCE'))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (1,'101','Standard',1800.00,'AVAILABLE','2026-11-25 23:02:16.438511','2026-11-25 23:02:16.438511');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (2,'102','Standard',1800.00,'AVAILABLE','2026-11-25 23:02:16.440814','2026-11-25 23:02:16.440814');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (3,'103','Standard',1800.00,'AVAILABLE','2026-11-25 23:02:16.444581','2026-11-25 23:02:16.444581');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (4,'104','Standard',1800.00,'CLEANING','2026-11-25 23:02:16.446126','2026-11-25 23:02:16.446126');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (5,'201','Deluxe',2500.00,'AVAILABLE','2026-11-25 23:02:16.447431','2026-11-25 23:02:16.447431');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (6,'202','Deluxe',2500.00,'AVAILABLE','2026-11-25 23:02:16.448767','2026-11-25 23:02:16.448767');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (7,'301','Suite',4500.00,'AVAILABLE','2026-11-25 23:02:16.449903','2026-11-25 23:02:16.449903');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (8,'302','Family',3800.00,'AVAILABLE','2026-11-25 23:02:16.450893','2026-11-25 23:02:16.450893');
INSERT INTO `rooms` (`roomId`, `roomNo`, `roomType`, `pricePerNight`, `roomStatus`, `createdAt`, `updatedAt`) VALUES (9,'303','Family',3800.00,'MAINTENANCE','2026-11-25 23:02:16.451873','2026-11-25 23:02:16.451873');
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_orders`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `service_orders` (
  `orderId` int(11) NOT NULL AUTO_INCREMENT,
  `reservationId` int(11) NOT NULL,
  `serviceType` varchar(50) NOT NULL,
  `itemCode` varchar(50) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unitPrice` decimal(10,2) NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'PENDING',
  `date` datetime NOT NULL,
  `notes` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`orderId`),
  KEY `IDX_service_orders_reservation` (`reservationId`),
  KEY `IDX_service_orders_status` (`status`),
  CONSTRAINT `FK_service_orders_reservation` FOREIGN KEY (`reservationId`) REFERENCES `reservations` (`reservationId`) ON UPDATE CASCADE,
  CONSTRAINT `CHK_service_orders_amounts` CHECK (`unitPrice` >= 0 and `totalAmount` >= 0),
  CONSTRAINT `CHK_service_orders_quantity` CHECK (`quantity` >= 1),
  CONSTRAINT `CHK_service_orders_status` CHECK (`status` in ('PENDING','PREPARING','DELIVERED','CANCELLED'))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_orders`
--

LOCK TABLES `service_orders` WRITE;
/*!40000 ALTER TABLE `service_orders` DISABLE KEYS */;
INSERT INTO `service_orders` (`orderId`, `reservationId`, `serviceType`, `itemCode`, `quantity`, `unitPrice`, `totalAmount`, `status`, `date`, `notes`) VALUES (1,1,'Food','BREAKFAST_SET',2,450.00,900.00,'DELIVERED','2026-11-16 23:02:16',NULL);
/*!40000 ALTER TABLE `service_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staff` (
  `staffId` int(11) NOT NULL AUTO_INCREMENT,
  `firstName` varchar(50) NOT NULL,
  `lastName` varchar(50) NOT NULL,
  `role` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `accountStatus` varchar(20) NOT NULL DEFAULT 'ACTIVE',
  `createdAt` datetime(6) NOT NULL DEFAULT current_timestamp(6),
  `updatedAt` datetime(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`staffId`),
  UNIQUE KEY `UQ_staff_email` (`email`),
  CONSTRAINT `CHK_staff_role` CHECK (`role` in ('FRONT_DESK','HOUSEKEEPING','MANAGER')),
  CONSTRAINT `CHK_staff_accountStatus` CHECK (`accountStatus` in ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` (`staffId`, `firstName`, `lastName`, `role`, `email`, `passwordHash`, `accountStatus`, `createdAt`, `updatedAt`) VALUES (1,'Marco','Villanueva','MANAGER','manager@maristay.test','$2b$10$LuHVLMUbQ9kyI8hTsT2H0uoKX9c4TZSPy7y0pQ2tp0E0uKngpUkpy','ACTIVE','2026-11-25 23:02:16.418554','2026-11-25 23:27:16.032785');
INSERT INTO `staff` (`staffId`, `firstName`, `lastName`, `role`, `email`, `passwordHash`, `accountStatus`, `createdAt`, `updatedAt`) VALUES (2,'Fiona','Dizon','FRONT_DESK','frontdesk@maristay.test','$2b$10$LuHVLMUbQ9kyI8hTsT2H0uoKX9c4TZSPy7y0pQ2tp0E0uKngpUkpy','ACTIVE','2026-11-25 23:02:16.426379','2026-11-25 23:27:16.032785');
INSERT INTO `staff` (`staffId`, `firstName`, `lastName`, `role`, `email`, `passwordHash`, `accountStatus`, `createdAt`, `updatedAt`) VALUES (3,'Hector','Ramos','HOUSEKEEPING','housekeeping1@maristay.test','$2b$10$LuHVLMUbQ9kyI8hTsT2H0uoKX9c4TZSPy7y0pQ2tp0E0uKngpUkpy','ACTIVE','2026-11-25 23:02:16.430774','2026-11-25 23:27:16.032785');
INSERT INTO `staff` (`staffId`, `firstName`, `lastName`, `role`, `email`, `passwordHash`, `accountStatus`, `createdAt`, `updatedAt`) VALUES (4,'Helen','Castro','HOUSEKEEPING','housekeeping2@maristay.test','$2b$10$LuHVLMUbQ9kyI8hTsT2H0uoKX9c4TZSPy7y0pQ2tp0E0uKngpUkpy','ACTIVE','2026-11-25 23:02:16.432832','2026-11-25 23:27:16.032785');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
