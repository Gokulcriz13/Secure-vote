-- Add face_descriptor column to voters table
ALTER TABLE voters
ADD COLUMN face_descriptor JSON DEFAULT NULL; 