from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "202607050001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    appointment_status = postgresql.ENUM(
        "PENDING",
        "CONFIRMED",
        "CANCELLED",
        "COMPLETED",
        "NO_SHOW",
        name="appointmentstatus",
        create_type=False,
    )
    appointment_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "services",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("duration_min", sa.Integer(), nullable=False),
        sa.Column("price_ron", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_services_name"), "services", ["name"], unique=True)

    op.create_table(
        "blocked_slots",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_blocked_slots_starts_ends", "blocked_slots", ["starts_at", "ends_at"])

    op.create_table(
        "appointments",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("client_name", sa.String(length=120), nullable=False),
        sa.Column("client_phone", sa.String(length=40), nullable=False),
        sa.Column("client_email", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", appointment_status, nullable=False),
        sa.Column("service_id", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_appointments_service_id", "appointments", ["service_id"])
    op.create_index("ix_appointments_starts_ends", "appointments", ["starts_at", "ends_at"])


def downgrade() -> None:
    op.drop_index("ix_appointments_starts_ends", table_name="appointments")
    op.drop_index("ix_appointments_service_id", table_name="appointments")
    op.drop_table("appointments")
    op.drop_index("ix_blocked_slots_starts_ends", table_name="blocked_slots")
    op.drop_table("blocked_slots")
    op.drop_index(op.f("ix_services_name"), table_name="services")
    op.drop_table("services")
    sa.Enum(name="appointmentstatus").drop(op.get_bind(), checkfirst=True)
