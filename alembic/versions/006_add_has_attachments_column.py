"""Add has_attachments column to messages table

Revision ID: 006
Revises: 005
Create Date: 2026-01-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006'
down_revision: Union[str, None] = '005'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add has_attachments column with default False
    op.add_column('messages', sa.Column('has_attachments', sa.Boolean(), nullable=False, server_default='0'))


def downgrade() -> None:
    op.drop_column('messages', 'has_attachments')
