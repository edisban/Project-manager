-- Initial schema.
-- Constraint names are referenced by GlobalExceptionHandler to map violations to 409 messages.

CREATE TABLE users (
    id       BIGSERIAL PRIMARY KEY,
    username VARCHAR(50)  NOT NULL,
    password VARCHAR(255) NOT NULL,
    role     VARCHAR(20)  NOT NULL DEFAULT 'USER',
    CONSTRAINT users_username_key UNIQUE (username),
    CONSTRAINT chk_users_role CHECK (role IN ('USER', 'ADMIN'))
);

-- Every project belongs to a user; deleting the user deletes their projects (and, below, their students).
-- Names are unique per owner. The unique index also serves lookups by owner_id.
CREATE TABLE projects (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description TEXT,
    created_at  TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    owner_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uq_projects_owner_name UNIQUE (owner_id, name)
);

-- Student codes are unique within a project. The unique index also serves lookups by project_id.
CREATE TABLE students (
    id            BIGSERIAL PRIMARY KEY,
    code_number   VARCHAR(20)  NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    project_id    BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT uq_students_project_code UNIQUE (project_id, code_number)
);
