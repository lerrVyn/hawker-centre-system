USE [HawkerCentreDB];
GO

/*
  Sample database records for the Hawker Centre System.
  Run this file AFTER HawkerCentreDB.sql.

  Sample login password for the customer account:
  password
*/

-- =========================================================
-- 1. Parent accounts
-- =========================================================

SET IDENTITY_INSERT dbo.customers ON;
INSERT INTO dbo.customers
(customer_id, name, email, password_hash, phone, created_at)
VALUES
(1, N'Aisha Rahman', N'aisha@example.com',
 N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 N'91234567', '2026-07-01T09:00:00'),
(2, N'Ben Tan', N'ben@example.com',
 N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 N'92345678', '2026-07-02T10:00:00');
SET IDENTITY_INSERT dbo.customers OFF;
GO

SET IDENTITY_INSERT dbo.stall_owners ON;
INSERT INTO dbo.stall_owners
(owner_id, name, email, password_hash, phone)
VALUES
(1, N'Mei Lin', N'meilin@example.com',
 N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 N'93456789'),
(2, N'Arun Kumar', N'arun@example.com',
 N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
 N'94567890');
SET IDENTITY_INSERT dbo.stall_owners OFF;
GO

SET IDENTITY_INSERT dbo.nea_officers ON;
INSERT INTO dbo.nea_officers
(officer_id, name, email, password_hash)
VALUES
(1, N'Farah Abdullah', N'farah.nea@example.com',
 N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'),
(2, N'Daniel Lim', N'daniel.nea@example.com',
 N'$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
SET IDENTITY_INSERT dbo.nea_officers OFF;
GO

-- =========================================================
-- 2. Stalls and menu items
-- =========================================================

SET IDENTITY_INSERT dbo.stalls ON;
INSERT INTO dbo.stalls
(stall_id, stall_name, description, cuisine_type, operating_hours, hygiene_grade, owner_id)
VALUES
(1, N'Mei Lin Chicken Rice', N'Hainanese chicken rice with homemade chilli.',
 N'Chinese', N'08:00 - 20:00', 'A', 1),
(2, N'Arun''s Prata House', N'Freshly made prata and Indian-Muslim favourites.',
 N'Indian-Muslim', N'07:00 - 22:00', 'B', 2);
SET IDENTITY_INSERT dbo.stalls OFF;
GO

SET IDENTITY_INSERT dbo.menu_items ON;
INSERT INTO dbo.menu_items
(item_id, stall_id, item_name, description, price, is_available, image_url)
VALUES
(1, 1, N'Roasted Chicken Rice', N'Roasted chicken, fragrant rice, soup and chilli.', 4.50, 1, NULL),
(2, 1, N'Steamed Chicken Rice', N'Steamed chicken, fragrant rice, soup and chilli.', 4.50, 1, NULL),
(3, 1, N'Chicken Feet', N'Braised chicken feet side dish.', 2.00, 1, NULL),
(4, 2, N'Plain Prata', N'Crispy handmade plain prata.', 1.30, 1, NULL),
(5, 2, N'Egg Prata', N'Handmade prata with egg.', 2.00, 1, NULL),
(6, 2, N'Mutton Murtabak', N'Murtabak with seasoned mutton filling.', 7.50, 1, NULL);
SET IDENTITY_INSERT dbo.menu_items OFF;
GO

-- =========================================================
-- 3. Stall information
-- =========================================================

SET IDENTITY_INSERT dbo.hygiene_grades ON;
INSERT INTO dbo.hygiene_grades
(grade_id, stall_id, grade, issued_date, valid_until)
VALUES
(1, 1, 'A', '2026-01-01', '2026-12-31'),
(2, 2, 'B', '2026-02-01', '2027-01-31');
SET IDENTITY_INSERT dbo.hygiene_grades OFF;
GO

SET IDENTITY_INSERT dbo.inspections ON;
INSERT INTO dbo.inspections
(inspection_id, stall_id, officer_id, score, remarks, inspection_date)
VALUES
(1, 1, 1, 95, N'Excellent cleanliness and food handling practices.', '2026-01-01T10:30:00'),
(2, 2, 2, 82, N'Good overall. Reminder given to improve counter cleanliness.', '2026-02-01T11:15:00');
SET IDENTITY_INSERT dbo.inspections OFF;
GO

SET IDENTITY_INSERT dbo.promotions ON;
INSERT INTO dbo.promotions
(promo_id, stall_id, promo_name, discount_percent, start_date, end_date, description)
VALUES
(1, 1, N'Lunch Special', 10.00, '2026-07-01', '2026-07-31',
 N'10% off selected chicken rice meals during lunch.'),
(2, 2, N'Prata Weekend Deal', 15.00, '2026-07-05', '2026-07-31',
 N'15% off egg prata on weekends.');
SET IDENTITY_INSERT dbo.promotions OFF;
GO

-- =========================================================
-- 4. Customer activity
-- =========================================================

SET IDENTITY_INSERT dbo.carts ON;
INSERT INTO dbo.carts
(cart_id, customer_id, created_at)
VALUES
(1, 1, '2026-07-10T12:00:00'),
(2, 2, '2026-07-11T18:30:00');
SET IDENTITY_INSERT dbo.carts OFF;
GO

SET IDENTITY_INSERT dbo.cart_items ON;
INSERT INTO dbo.cart_items
(cart_item_id, cart_id, item_id, quantity, price)
VALUES
(1, 1, 1, 1, 4.50),
(2, 1, 3, 1, 2.00),
(3, 2, 5, 2, 2.00);
SET IDENTITY_INSERT dbo.cart_items OFF;
GO

SET IDENTITY_INSERT dbo.orders ON;
INSERT INTO dbo.orders
(order_id, customer_id, stall_id, total_price, status, created_at)
VALUES
(1, 1, 1, 6.50, N'Completed', '2026-07-03T12:15:00'),
(2, 2, 2, 9.50, N'Completed', '2026-07-04T18:45:00');
SET IDENTITY_INSERT dbo.orders OFF;
GO

SET IDENTITY_INSERT dbo.order_items ON;
INSERT INTO dbo.order_items
(order_item_id, order_id, item_id, quantity, price)
VALUES
(1, 1, 1, 1, 4.50),
(2, 1, 3, 1, 2.00),
(3, 2, 4, 1, 1.30),
(4, 2, 6, 1, 7.50);
SET IDENTITY_INSERT dbo.order_items OFF;
GO

SET IDENTITY_INSERT dbo.payments ON;
INSERT INTO dbo.payments
(payment_id, order_id, payment_method, amount, payment_status, paid_at)
VALUES
(1, 1, N'PayNow', 6.50, N'Paid', '2026-07-03T12:16:00'),
(2, 2, N'Card', 9.50, N'Paid', '2026-07-04T18:46:00');
SET IDENTITY_INSERT dbo.payments OFF;
GO

SET IDENTITY_INSERT dbo.feedback ON;
INSERT INTO dbo.feedback
(feedback_id, customer_id, stall_id, rating, comment, created_at)
VALUES
(1, 1, 1, 5, N'Chicken was tender and the rice was very fragrant.', '2026-07-03T13:00:00'),
(2, 2, 2, 4, N'Good prata. The murtabak was filling.', '2026-07-04T19:30:00');
SET IDENTITY_INSERT dbo.feedback OFF;
GO

SET IDENTITY_INSERT dbo.complaints ON;
INSERT INTO dbo.complaints
(complaint_id, customer_id, stall_id, category, description, status, created_at, updated_at)
VALUES
(1, 2, 2, N'Waiting Time',
 N'Waited longer than expected during the dinner rush.',
 N'Resolved', '2026-07-04T19:00:00', '2026-07-05T10:00:00');
SET IDENTITY_INSERT dbo.complaints OFF;
GO

SET IDENTITY_INSERT dbo.likes ON;
INSERT INTO dbo.likes
(like_id, customer_id, item_id, created_at)
VALUES
(1, 1, 1, '2026-07-03T13:05:00'),
(2, 1, 3, '2026-07-03T13:06:00'),
(3, 2, 5, '2026-07-04T19:35:00');
SET IDENTITY_INSERT dbo.likes OFF;
GO

-- =========================================================
-- Verification: these results should show sample data exists.
-- =========================================================

SELECT 'customers' AS table_name, COUNT(*) AS sample_rows FROM dbo.customers
UNION ALL
SELECT 'stall_owners', COUNT(*) FROM dbo.stall_owners
UNION ALL
SELECT 'nea_officers', COUNT(*) FROM dbo.nea_officers
UNION ALL
SELECT 'stalls', COUNT(*) FROM dbo.stalls
UNION ALL
SELECT 'menu_items', COUNT(*) FROM dbo.menu_items
UNION ALL
SELECT 'orders', COUNT(*) FROM dbo.orders
UNION ALL
SELECT 'payments', COUNT(*) FROM dbo.payments;
GO