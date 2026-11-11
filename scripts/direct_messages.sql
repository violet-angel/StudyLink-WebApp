
CREATE TABLE IF NOT EXISTS student_direct_messages (
  id BIGSERIAL PRIMARY KEY,

  sender_user_id BIGINT NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,

  recipient_user_id BIGINT NOT NULL
    REFERENCES users(id) ON DELETE CASCADE,

  body TEXT NOT NULL
    CHECK (length(trim(body)) BETWEEN 1 AND 2000),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  read_at TIMESTAMPTZ,

  CONSTRAINT no_self_messages
    CHECK (sender_user_id <> recipient_user_id)
);

CREATE INDEX IF NOT EXISTS idx_dm_sender_time
ON student_direct_messages(sender_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_recipient_time
ON student_direct_messages(recipient_user_id, created_at DESC);
