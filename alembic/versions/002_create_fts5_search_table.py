"""Create FTS5 virtual table for full-text search

Revision ID: 002
Revises: 001
Create Date: 2026-01-16

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create FTS5 virtual table for full-text search
    op.execute("""
        CREATE VIRTUAL TABLE messages_fts USING fts5(
            message_id UNINDEXED,
            subject,
            from_email,
            snippet,
            body_text,
            content='',
            tokenize='porter unicode61'
        )
    """)

    # Create triggers to keep FTS5 table in sync with messages table
    op.execute("""
        CREATE TRIGGER messages_fts_insert AFTER INSERT ON messages
        BEGIN
            INSERT INTO messages_fts(message_id, subject, from_email, snippet, body_text)
            VALUES (new.id, new.subject, new.from_email, new.snippet, COALESCE(new.body_text, ''));
        END
    """)

    op.execute("""
        CREATE TRIGGER messages_fts_update AFTER UPDATE ON messages
        BEGIN
            UPDATE messages_fts
            SET subject = new.subject,
                from_email = new.from_email,
                snippet = new.snippet,
                body_text = COALESCE(new.body_text, '')
            WHERE message_id = old.id;
        END
    """)

    op.execute("""
        CREATE TRIGGER messages_fts_delete AFTER DELETE ON messages
        BEGIN
            DELETE FROM messages_fts WHERE message_id = old.id;
        END
    """)

    # Populate existing messages into FTS table
    op.execute("""
        INSERT INTO messages_fts(message_id, subject, from_email, snippet, body_text)
        SELECT id, subject, from_email, snippet, COALESCE(body_text, '')
        FROM messages
    """)


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS messages_fts_delete")
    op.execute("DROP TRIGGER IF EXISTS messages_fts_update")
    op.execute("DROP TRIGGER IF EXISTS messages_fts_insert")
    op.execute("DROP TABLE IF EXISTS messages_fts")
