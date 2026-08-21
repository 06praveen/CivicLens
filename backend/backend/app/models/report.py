"""
CivicLens Budget Issue Report Model — PostgreSQL Citizen Concern System
"""
from sqlalchemy import Column, BigInteger, Integer, String, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class BudgetIssueReport(Base):
    __tablename__ = "budget_issue_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    is_anonymous = Column(Boolean, default=False, nullable=False)

    issue_category = Column(String(100), nullable=False, index=True)
    financial_year = Column(String(20), nullable=True, index=True)
    ministry_department = Column(String(255), nullable=True, index=True)
    budget_item = Column(Text, nullable=True)

    issue_title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    evidence_reference = Column(Text, nullable=True)

    status = Column(String(30), default="submitted", nullable=False, index=True)  # submitted, under_review, needs_information, resolved, dismissed
    priority = Column(String(20), default="normal", nullable=False)  # low, normal, high, urgent

    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
