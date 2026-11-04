-- V3-V5 existed in earlier versions of this repository and may already be applied; never reuse those numbers.
-- Projects belong to a user. Existing (seed) projects stay ownerless and are visible to admins only.
-- Deleting a user removes their projects, which in turn removes their students (cascade).
ALTER TABLE projects
    ADD COLUMN owner_id BIGINT REFERENCES users (id) ON DELETE CASCADE;

CREATE INDEX idx_projects_owner_id ON projects (owner_id);

-- Project names are unique per owner instead of globally.
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_name_key;
ALTER TABLE projects ADD CONSTRAINT uq_projects_owner_name UNIQUE (owner_id, name);

-- Student codes are unique within a project instead of globally.
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_code_number_key;
ALTER TABLE students ADD CONSTRAINT uq_students_project_code UNIQUE (project_id, code_number);

-- Only known roles are allowed.
ALTER TABLE users ADD CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'));
