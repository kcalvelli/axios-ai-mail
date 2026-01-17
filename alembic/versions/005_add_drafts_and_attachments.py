"""Add drafts and attachments tables

Revision ID: 005
Revises: 004
Create Date: 2026-01-17

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add drafts and attachments tables for email composition."""

    # Create drafts table
    op.create_table(
        'drafts',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('account_id', sa.String(), nullable=False),
        sa.Column('thread_id', sa.String(), nullable=True),
        sa.Column('in_reply_to', sa.String(), nullable=True),
        sa.Column('subject', sa.String(), nullable=False),
        sa.Column('to_emails', sa.Text(), nullable=False),  # JSON array
        sa.Column('cc_emails', sa.Text(), nullable=True),   # JSON array
        sa.Column('bcc_emails', sa.Text(), nullable=True),  # JSON array
        sa.Column('body_text', sa.Text(), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['account_id'], ['accounts.id'], ondelete='CASCADE'),
    )

    # Create indexes for drafts
    op.create_index('ix_drafts_account_id', 'drafts', ['account_id'])
    op.create_index('ix_drafts_updated_at', 'drafts', ['updated_at'])

    # Create attachments table
    op.create_table(
        'attachments',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('draft_id', sa.String(), nullable=True),
        sa.Column('message_id', sa.String(), nullable=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('data', sa.LargeBinary(), nullable=True),  # BLOB storage
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['draft_id'], ['drafts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['message_id'], ['messages.id'], ondelete='CASCADE'),
    )

    # Create indexes for attachments
    op.create_index('ix_attachments_draft_id', 'attachments', ['draft_id'])
    op.create_index('ix_attachments_message_id', 'attachments', ['message_id'])


def downgrade() -> None:
    """Remove drafts and attachments tables."""

    # Drop indexes first
    op.drop_index('ix_attachments_message_id', table_name='attachments')
    op.drop_index('ix_attachments_draft_id', table_name='attachments')
    op.drop_index('ix_drafts_updated_at', table_name='drafts')
    op.drop_index('ix_drafts_account_id', table_name='drafts')

    # Drop tables
    op.drop_table('attachments')
    op.drop_table('drafts')
