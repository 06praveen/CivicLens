from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_, distinct
from sqlalchemy.orm import Session
from app.models.budget import BudgetRecord

class BudgetService:
    @staticmethod
    def get_budgets(
        db: Session,
        financial_year: Optional[str] = None,
        ministry_department: Optional[str] = None,
        expenditure_category: Optional[str] = None,
        amount_stage: Optional[str] = None,
        statement: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 50
    ) -> Tuple[List[BudgetRecord], int]:
        query = select(BudgetRecord)

        if financial_year:
            query = query.where(BudgetRecord.financial_year == financial_year)
        if ministry_department:
            query = query.where(BudgetRecord.ministry_department.ilike(f"%{ministry_department}%"))
        if expenditure_category:
            query = query.where(BudgetRecord.expenditure_category.ilike(f"%{expenditure_category}%"))
        if amount_stage:
            query = query.where(BudgetRecord.amount_stage.ilike(f"%{amount_stage}%"))
        if statement:
            query = query.where(BudgetRecord.statement.ilike(f"%{statement}%"))

        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                or_(
                    BudgetRecord.budget_item.ilike(search_pattern),
                    BudgetRecord.ministry_department.ilike(search_pattern),
                    BudgetRecord.expenditure_category.ilike(search_pattern),
                    BudgetRecord.budget_item_key.ilike(search_pattern)
                )
            )

        # Count query
        count_subquery = query.subquery()
        total = db.scalar(select(func.count()).select_from(count_subquery)) or 0

        # Pagination & Ordering
        offset = (page - 1) * limit
        query = query.order_by(BudgetRecord.record_id.asc()).offset(offset).limit(limit)

        records = db.scalars(query).all()
        return list(records), total

    @staticmethod
    def get_budget_by_id(db: Session, record_id: int) -> Optional[BudgetRecord]:
        return db.get(BudgetRecord, record_id)

    @staticmethod
    def get_summary(db: Session, financial_year: Optional[str] = None, amount_stage: Optional[str] = None) -> dict:
        """
        Canonical Budget Overview Service:
        Applies strict canonical aggregation rules to avoid double counting, hierarchy overlaps,
        and stage mismatches across PostgreSQL budget records.
        """
        total_records = db.scalar(select(func.count(BudgetRecord.record_id))) or 0
        unique_ministries = db.scalar(select(func.count(distinct(BudgetRecord.ministry_department)))) or 0
        unique_categories = db.scalar(select(func.count(distinct(BudgetRecord.expenditure_category)))) or 0
        unique_items = db.scalar(select(func.count(distinct(BudgetRecord.budget_item)))) or 0
        unique_keys = db.scalar(select(func.count(distinct(BudgetRecord.budget_item_key)))) or 0

        fys = db.scalars(
            select(distinct(BudgetRecord.financial_year))
            .where(BudgetRecord.financial_year.is_not(None))
            .order_by(BudgetRecord.financial_year.asc())
        ).all()
        fys_list = list(fys)

        stages = db.scalars(
            select(distinct(BudgetRecord.amount_stage))
            .where(BudgetRecord.amount_stage.is_not(None))
            .order_by(BudgetRecord.amount_stage.asc())
        ).all()

        target_fy = financial_year if (financial_year and financial_year in fys_list) else (fys_list[-1] if fys_list else "2024-2025")
        target_stage = "Actuals" if target_fy == "2022-2023" else "Budget Estimates"

        # CANONICAL RULE 1: Total Recorded Allocation for target_fy
        tot_row = db.execute(
            select(
                func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0)),
                func.sum(func.coalesce(BudgetRecord.revenue_amount, 0)),
                func.sum(func.coalesce(BudgetRecord.capital_amount, 0))
            )
            .where(
                BudgetRecord.financial_year == target_fy,
                BudgetRecord.statement == "Statement 3",
                BudgetRecord.row_type == "ministry_total",
                BudgetRecord.amount_stage == target_stage
            )
        ).first()

        if tot_row and tot_row[0]:
            total_budget = round(float(tot_row[0]), 2)
            revenue_exp = round(float(tot_row[1]), 2)
            capital_exp = round(float(tot_row[2]), 2)
        else:
            # Fallback to Statement 1 if Statement 3 not populated
            tot_row2 = db.execute(
                select(
                    BudgetRecord.total_amount,
                    BudgetRecord.revenue_amount,
                    BudgetRecord.capital_amount
                )
                .where(
                    BudgetRecord.financial_year == target_fy,
                    BudgetRecord.statement == "Statement 1",
                    BudgetRecord.budget_item_key == "total_expenditure_through_budget"
                )
                .limit(1)
            ).first()
            if tot_row2 and tot_row2[0]:
                total_budget = round(float(tot_row2[0]), 2)
                revenue_exp = round(float(tot_row2[1] or 0.0), 2)
                capital_exp = round(float(tot_row2[2] or 0.0), 2)
            else:
                total_budget = 0.0
                revenue_exp = 0.0
                capital_exp = 0.0

        dept_count = db.scalar(
            select(func.count(distinct(BudgetRecord.ministry_department)))
            .where(
                BudgetRecord.financial_year == target_fy,
                BudgetRecord.statement == "Statement 3",
                BudgetRecord.row_type == "ministry_total",
                BudgetRecord.amount_stage == target_stage
            )
        ) or 0

        # CANONICAL RULE 2: Top Expenditure Categories for target_fy
        cat_rows = db.execute(
            select(
                BudgetRecord.expenditure_category,
                func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0))
            )
            .where(
                BudgetRecord.financial_year == target_fy,
                BudgetRecord.statement == "Statement 3",
                BudgetRecord.row_type == "category",
                BudgetRecord.amount_stage == target_stage,
                BudgetRecord.expenditure_category.is_not(None),
                ~BudgetRecord.expenditure_category.ilike("Grand Total%")
            )
            .group_by(BudgetRecord.expenditure_category)
            .order_by(func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0)).desc())
        ).all()

        palette = ['#1e3a8a', '#FF9933', '#138808', '#7c3aed', '#be123c', '#b45309', '#0891b2', '#6b7280']
        sector_allocations = []
        for i, r in enumerate(cat_rows):
            cat_amt = round(float(r[1]), 2)
            pct = round((cat_amt / total_budget) * 100, 2) if total_budget > 0 else 0.0
            sector_allocations.append({
                "sector": str(r[0]),
                "amount": cat_amt,
                "pct": pct,
                "color": palette[i % len(palette)]
            })

        # CANONICAL RULE 3: Top Departments for target_fy
        dept_rows = db.execute(
            select(
                BudgetRecord.ministry_department,
                func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0))
            )
            .where(
                BudgetRecord.financial_year == target_fy,
                BudgetRecord.statement == "Statement 3",
                BudgetRecord.row_type == "ministry_total",
                BudgetRecord.amount_stage == target_stage,
                BudgetRecord.ministry_department.is_not(None),
                ~BudgetRecord.ministry_department.ilike("Grand Total%")
            )
            .group_by(BudgetRecord.ministry_department)
            .order_by(func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0)).desc())
            .limit(5)
        ).all()

        top_departments = []
        for r in dept_rows:
            d_amt = round(float(r[1]), 2)
            top_departments.append({
                "department": str(r[0]),
                "amount": d_amt
            })

        # CANONICAL RULE 4: Yearly Trend across comparable financial years
        yoy_trend = []
        for y in fys_list:
            y_stage = "Actuals" if y == "2022-2023" else "Budget Estimates"
            y_row = db.execute(
                select(
                    func.sum(func.coalesce(BudgetRecord.total_amount, BudgetRecord.amount, 0)),
                    func.sum(func.coalesce(BudgetRecord.revenue_amount, 0)),
                    func.sum(func.coalesce(BudgetRecord.capital_amount, 0))
                )
                .where(
                    BudgetRecord.financial_year == y,
                    BudgetRecord.statement == "Statement 3",
                    BudgetRecord.row_type == "ministry_total",
                    BudgetRecord.amount_stage == y_stage
                )
            ).first()

            if y_row and y_row[0]:
                y_tot, y_rev, y_cap = float(y_row[0]), float(y_row[1] or 0.0), float(y_row[2] or 0.0)
            else:
                y_tot, y_rev, y_cap = 0.0, 0.0, 0.0

            if y_tot > 0:
                yoy_trend.append({
                    "year": y,
                    "budget": round(y_tot, 2),
                    "expenditure": round(y_rev, 2),
                    "capitalExp": round(y_cap, 2)
                })

        # BACKEND VALIDATION GUARD (STEP 13)
        if total_budget > 0:
            for s in sector_allocations:
                if s["amount"] > total_budget + 0.01:
                    raise ValueError(f"Backend Validation Guard Failed: Category '{s['sector']}' ({s['amount']} Cr) > Total Budget ({total_budget} Cr)")
            for d in top_departments:
                if d["amount"] > total_budget + 0.01:
                    raise ValueError(f"Backend Validation Guard Failed: Department '{d['department']}' ({d['amount']} Cr) > Total Budget ({total_budget} Cr)")
            sum_cats = sum(s["amount"] for s in sector_allocations)
            if sum_cats > total_budget + 0.01:
                raise ValueError(f"Backend Validation Guard Failed: Category sum ({sum_cats} Cr) > Total Budget ({total_budget} Cr)")

        return {
            "financial_year": target_fy,
            "total_records": total_records,
            "unique_ministries": unique_ministries,
            "unique_categories": len(sector_allocations),
            "unique_budget_items": unique_items,
            "unique_item_keys": unique_keys,
            "total_budget": total_budget,
            "revenue_expenditure": revenue_exp,
            "capital_expenditure": capital_exp,
            "department_count": dept_count,
            "items_count": len(sector_allocations),
            "available_financial_years": [y["year"] for y in yoy_trend] if yoy_trend else fys_list,
            "available_amount_stages": list(stages),
            "filtered_amount_stage": target_stage,
            "total_amount": total_budget,
            "sector_allocations": sector_allocations,
            "yoy_trend": yoy_trend,
            "top_departments": top_departments
        }

    @staticmethod
    def get_filters(db: Session) -> dict:
        fys = db.scalars(select(distinct(BudgetRecord.financial_year)).where(BudgetRecord.financial_year.is_not(None)).order_by(BudgetRecord.financial_year.asc())).all()
        stages = db.scalars(select(distinct(BudgetRecord.amount_stage)).where(BudgetRecord.amount_stage.is_not(None)).order_by(BudgetRecord.amount_stage.asc())).all()
        raw_ministries = db.scalars(select(distinct(BudgetRecord.ministry_department)).where(BudgetRecord.ministry_department.is_not(None)).order_by(BudgetRecord.ministry_department.asc())).all()
        raw_categories = db.scalars(select(distinct(BudgetRecord.expenditure_category)).where(BudgetRecord.expenditure_category.is_not(None)).order_by(BudgetRecord.expenditure_category.asc())).all()
        statements = db.scalars(select(distinct(BudgetRecord.statement)).where(BudgetRecord.statement.is_not(None)).order_by(BudgetRecord.statement.asc())).all()

        clean_ministries = [m.strip() for m in raw_ministries if m and m.strip() and not m.startswith("Grand Total")]
        clean_categories = [c.strip() for c in raw_categories if c and c.strip() and not c.startswith("TOTAL") and c not in ["Grand Total", "Statement 3 aggregate"]]

        return {
            "financial_years": [f for f in fys if f and f.strip()],
            "amount_stages": [s for s in stages if s and s.strip()],
            "ministries_departments": clean_ministries,
            "expenditure_categories": clean_categories,
            "statements": [st for st in statements if st and st.strip()]
        }
