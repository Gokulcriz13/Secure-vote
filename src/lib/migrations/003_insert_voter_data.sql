-- Insert sample voter data
INSERT INTO voters (
    name,
    aadhaar,
    voter_id,
    phone,
    address,
    gender,
    dob,
    constituency,
    ward_number,
    booth_number
) VALUES 
(
    'Gokul Murugappa',
    '567890123456',
    'GHI6789123',
    '9445965074',
    '10 Church Street, Chennai',
    'Male',
    '2004-01-24',
    'Chennai South',
    'Ward 12',
    'Booth 45'
),
(
    'Priya Ramesh',
    '678901234567',
    'JKL7890123',
    '9876543210',
    '25 Anna Nagar, Chennai',
    'Female',
    '1995-05-15',
    'Chennai North',
    'Ward 08',
    'Booth 32'
),
(
    'Rajesh Kumar',
    '789012345678',
    'MNO8901234',
    '8765432109',
    '7 T Nagar, Chennai',
    'Male',
    '1988-09-30',
    'Chennai Central',
    'Ward 15',
    'Booth 21'
),
(
    'Lakshmi Suresh',
    '890123456789',
    'PQR9012345',
    '7654321098',
    '42 Adyar, Chennai',
    'Female',
    '1992-12-10',
    'Chennai South',
    'Ward 18',
    'Booth 56'
);

-- Create candidates table if not exists
CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    party VARCHAR(100) NOT NULL,
    party_short_name VARCHAR(10) NOT NULL,
    symbol_path VARCHAR(200) NOT NULL,
    constituency VARCHAR(100) NOT NULL
);

-- Insert sample candidate data
INSERT INTO candidates (
    id,
    name,
    party,
    party_short_name,
    symbol_path,
    constituency
) VALUES 
(
    '1',
    'Narendra Modi',
    'Bharatiya Janata Party',
    'BJP',
    '/images/parties/bjp.svg',
    'Chennai South'
),
(
    '2',
    'Rahul Gandhi',
    'Indian National Congress',
    'INC',
    '/images/parties/congress.svg',
    'Chennai South'
),
(
    '3',
    'Arvind Kejriwal',
    'Aam Aadmi Party',
    'AAP',
    '/images/parties/aap.svg',
    'Chennai South'
),
(
    '4',
    'Mamata Banerjee',
    'All India Trinamool Congress',
    'TMC',
    '/images/parties/tmc.svg',
    'Chennai South'
); 