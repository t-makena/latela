-- Insert sample transactions for testing category filtering
INSERT INTO transactions (account_id, description, amount, transaction_code, transaction_date, balance, cleared) VALUES 
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Rent Payment - June', -1500000, 'DR', '2025-06-27', 5000000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Savings transfer to investment account', -50000, 'DR', '2025-06-27', 6500000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Futbol tickets - Stadium', -30000, 'DR', '2025-06-27', 6550000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Grocery shopping at Supermarket', -15000, 'DR', '2025-06-26', 6580000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Restaurant dinner downtown', -8000, 'DR', '2025-06-25', 6595000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Fuel at gas station', -5000, 'DR', '2025-06-24', 6603000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Shopping at retail store', -12000, 'DR', '2025-06-23', 6608000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Movie tickets and entertainment', -7000, 'DR', '2025-06-22', 6620000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Doctor visit and medical checkup', -10000, 'DR', '2025-06-21', 6627000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Monthly subscription payment', -2000, 'DR', '2025-06-20', 6637000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Electricity bill payment', -6000, 'DR', '2025-06-19', 6639000, true),
('fa39c20f-166d-476a-a231-0e5c9b86589d', 'Salary deposit', 800000, 'CR', '2025-06-15', 6645000, true);