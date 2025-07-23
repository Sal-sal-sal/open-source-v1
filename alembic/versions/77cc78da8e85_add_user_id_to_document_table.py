"""Add user_id to document table

Revision ID: 77cc78da8e85
Revises: ba7024bb8f7c
Create Date: 2025-07-22 23:18:13.066267

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '77cc78da8e85'
down_revision: Union[str, None] = 'ba7024bb8f7c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add the column as nullable first
    op.add_column('document', sa.Column('user_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

    # Get the first user's ID to assign to existing documents
    conn = op.get_bind()
    result = conn.execute(sa.text("SELECT id FROM users LIMIT 1"))
    first_user_id = result.scalar()

    # If there's at least one user, update existing documents
    if first_user_id:
        op.execute(
            sa.text("UPDATE document SET user_id = :user_id").bindparams(user_id=first_user_id)
        )

    # Now, alter the column to be non-nullable
    op.alter_column('document', 'user_id', existing_type=sqlmodel.sql.sqltypes.AutoString(), nullable=False)

    # Finally, add the foreign key constraint
    op.create_foreign_key(
        "fk_document_user_id", 'document', 'users',
        ['user_id'], ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_document_user_id", 'document', type_='foreignkey')
    op.drop_column('document', 'user_id')
