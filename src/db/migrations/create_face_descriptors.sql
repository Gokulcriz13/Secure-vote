CREATE TABLE IF NOT EXISTS face_descriptors (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    aadhaar VARCHAR(12) NOT NULL,
    voter_id VARCHAR(255) NOT NULL,
    descriptor_data JSON NULL,
    temp_image_path VARCHAR(512) NULL,
    verification_attempts INT DEFAULT 0,
    last_verification_at TIMESTAMP NULL,
    verification_status ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (aadhaar) REFERENCES voters(aadhaar),
    UNIQUE KEY unique_voter (aadhaar, voter_id),
    INDEX idx_aadhaar (aadhaar),
    INDEX idx_voter_id (voter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 