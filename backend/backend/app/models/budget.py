from sqlalchemy import Column, BigInteger, Integer, String, Text, Numeric, DateTime, func
from app.database import Base

class BudgetRecord(Base):
    __tablename__ = "budget_records"

    record_id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    financial_year = Column(String(10), nullable=False, index=True)
    amount_stage = Column(String(30), nullable=False, index=True)
    statement = Column(String(50), nullable=True, index=True)
    demand_no = Column(String(20), nullable=True)
    ministry_department = Column(String(255), nullable=True, index=True)
    expenditure_category = Column(String(255), nullable=True, index=True)
    category_number = Column(String(20), nullable=True)
    budget_item = Column(Text, nullable=False)
    row_type = Column(String(50), nullable=True)
    budget_item_key = Column(String(255), nullable=False, index=True)
    amount = Column(Numeric(18, 2), nullable=True)
    revenue_amount = Column(Numeric(18, 2), nullable=True)
    capital_amount = Column(Numeric(18, 2), nullable=True)
    total_amount = Column(Numeric(18, 2), nullable=True)
    unit = Column(String(20), default="₹ Crore")
    source_file = Column(String(100), nullable=False)
    source_row = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
