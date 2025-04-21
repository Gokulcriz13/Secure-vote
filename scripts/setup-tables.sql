-- Create constituencies table
CREATE TABLE IF NOT EXISTS constituencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    party VARCHAR(100) NOT NULL,
    symbol VARCHAR(100) NOT NULL,
    image VARCHAR(255),
    constituency_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (constituency_id) REFERENCES constituencies(id)
);

-- Add constituency_id to voters table if it doesn't exist
ALTER TABLE voters ADD COLUMN IF NOT EXISTS constituency_id INT;
ALTER TABLE voters ADD FOREIGN KEY IF NOT EXISTS (constituency_id) REFERENCES constituencies(id);

-- Insert some sample constituencies
INSERT INTO constituencies (name, state, district) VALUES
('Bangalore South', 'Karnataka', 'Bangalore'),
('Bangalore North', 'Karnataka', 'Bangalore'),
('Bangalore Central', 'Karnataka', 'Bangalore');

-- Insert some sample candidates
INSERT INTO candidates (name, party, symbol, constituency_id) VALUES
('John Doe', 'Party A', 'symbol_a.png', 1),
('Jane Smith', 'Party B', 'symbol_b.png', 1),
('Bob Wilson', 'Party C', 'symbol_c.png', 1),
('Alice Brown', 'Party A', 'symbol_a.png', 2),
('Charlie Davis', 'Party B', 'symbol_b.png', 2),
('Eve Johnson', 'Party C', 'symbol_c.png', 2); 