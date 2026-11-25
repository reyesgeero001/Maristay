# Project Overview

## 1.1 Introduction

Hotels still handle many guest services by hand: guests queue at the front desk to check in and out, housekeeping status is passed along by phone or paper, and room-service requests are written down and tracked manually. Information about one guest is scattered across reservations, billing, housekeeping and the kitchen.

**MariStay** is a hotel management and digital guest services backend that connects these departments through one REST API. It was proposed in Laboratory Activity 03, designed in Laboratory Activities 04 (database), 05 (REST API) and 06 (security), and implemented for this final project with NestJS, TypeORM and MySQL.

## 1.2 System description

MariStay unifies guest room reservations, digital check-in/check-out, keyless room access and real-time room-service ordering into a single platform (Lab 03, Part A). Guests register, browse available rooms, book a stay, check in from their phone, receive a digital room key, order food and amenities, and check out. Staff use the same API: the front desk records payments and assists guests, housekeepers receive and complete cleaning tasks, and managers maintain rooms and staff accounts.

The system is a **backend prototype**: it exposes 44 REST endpoints, stores everything in a MySQL database of 8 related tables, and protects the API with JWT authentication and role-based authorization. Payment gateways, SMS/e-mail and smart locks are simulated.

## 1.3 Background

Lab 03 identified the real-world problems MariStay addresses: long check-in lines at the front desk, slow updates on room cleaning status, and manual room-service tracking. These are *integration* problems — each department has the information another one needs. A reservation must know whether it is paid; a room cannot be given to a guest until housekeeping has cleaned it; a room key must stop working the moment the guest checks out. MariStay demonstrates how a well-designed backend makes these modules work together inside database transactions.

## 1.4 Objectives

**General objective:** to develop a working, secure and documented backend that integrates hotel reservations, payments, digital keys, housekeeping and guest services.

**Specific objectives:**
1. Implement a relational MySQL database of the 8 Lab 04 entities through TypeORM, with correct primary keys, foreign keys and relationships.
2. Expose at least 20 RESTful endpoints (44 delivered) using GET, POST, PUT, PATCH and DELETE with correct status codes, following Lab 05.
3. Secure the API with JWT authentication, bcrypt password hashing, role-based access control, ownership checks, input validation and rate limiting, following Lab 06.
4. Integrate the hotel workflow: reservation → payment → digital check-in → digital key → service orders → check-out → housekeeping → room availability.
5. Prevent double bookings, unpaid check-ins and unauthorized access with server-side business rules and transactions.
6. Test the system with automated tests and a Postman collection, and document it for presentation and defense.

## 1.5 Intended users

| User | Role in the system |
|---|---|
| Hotel guests | Register, book rooms, pay (via front desk), check in/out digitally, use digital keys, order services |
| Front desk staff | Manage reservations, confirm bookings, record and verify payments, assist check-in/check-out, view guests and orders |
| Housekeeping staff | View and update their own cleaning tasks; completing a task releases the room |
| Hotel management (manager) | Manage rooms, staff accounts, housekeeping assignments; view all operations |

## 1.6 Scope and limitations

**In scope**
* NestJS REST API with 9 functional modules and 44 endpoints; Swagger documentation.
* MySQL database (8 tables) with migrations, constraints and seed data.
* JWT authentication, RBAC with 4 roles, ownership checks, validation, rate limiting, security headers.
* Integrated workflows with transactional consistency and booking-conflict prevention.
* Automated unit and end-to-end tests; Postman collection; SQL export.

**Limitations**
* **Simulated integrations:** no real payment gateway (payments are recorded by the front desk; no card data), no real SMS/e-mail (messages are logged), no physical smart lock (key validation only returns a decision).
* **No front-end:** the API is used through Postman/Swagger. The optional React front-end was not built.
* **HTTP only locally:** HTTPS must be provided by a reverse proxy in deployment.
* **Single property, single currency (PHP)**, no taxes, discounts, invoices, or partial-night pricing; early check-out does not refund unused nights.
* **Service catalog** prices are defined in code, not in a database table.
* **Refresh tokens / logout blacklist** are not implemented; access tokens simply expire (1 h) and deactivation takes effect immediately.
* Developed and tested on MariaDB 10.4 (XAMPP's MySQL); MySQL 8 is expected to behave the same but was not tested.
