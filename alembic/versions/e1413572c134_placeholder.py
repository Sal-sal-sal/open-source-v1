"""dummy migration to fix history

Revision ID: e1413572c134
Revises: 5a816e622d6e
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision = 'e1413572c134'
down_revision = '5a816e622d6e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # This is a placeholder, no-op
    pass


def downgrade() -> None:
    # This is a placeholder, no-op
    pass 