import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Body, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import pymysql.cursors
import re
from server.src.db.alchemy_models import query_reports
from server.src.routes import get_db, get_raw_db

router = APIRouter()


def is_safe_query(sql_query):
    # Define a list of DDL keywords
    ddl_keywords = ['UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'INSERT', 'TRUNCATE', 'TABLES']

    # Convert the SQL query to uppercase for case-insensitive matching
    sql_query_upper = sql_query.upper()

    # Use regular expression to check for the presence of DDL keywords
    ddl_pattern = r'\b(?:' + '|'.join(ddl_keywords) + r')\b'
    match = re.search(ddl_pattern, sql_query_upper)

    # If a match is found, the query is not safe
    if match:
        return False
    else:
        return True


def get_config_data(rdb, config_id):
    cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
    query = f"""
        SELECT * FROM query_reports WHERE is_deleted = 0 AND query_report_id = {config_id} AND disabled = 0
    """
    cursor.execute(query)
    res = cursor.fetchall()
    if len(res) == 0:
        raise HTTPException(status_code=400, detail=f"Invalid config_id")

    data = res[0]
    data["variables"] = json.loads(data["variables"])
    return data


@router.get('/qr/get-config-by-id', tags=["Masters"])
def get_config_by_id(
        config_id: int,
        request: Request,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        data = get_config_data(rdb, config_id)

        return {
            "data": data
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


class QueryDetails(BaseModel):
    query: str
    name: str
    description: str
    variables: List[dict]


class ReportConfig(BaseModel):
    config_id: Optional[int]
    query_details: Optional[QueryDetails]
    variables: dict


@router.post('/qr/execute-query', tags=["Masters"])
def execute_query(
        report_config: ReportConfig,
        request: Request,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        # Get the config data
        if report_config.config_id:
            config_data = get_config_data(rdb, report_config.config_id)
            # Get the query from json file
            query = config_data["query"]

        else:
            query = report_config.query_details.query
        variables = report_config.variables

        # Replace the variables in the query
        for key, value in variables.items():
            if isinstance(value, list):
                if any(isinstance(item, str) for item in value):
                    replace_str = "(" + ",".join(f"'{item}'" for item in value) + ")"
                    query = query.replace(f"{{{key}}}", replace_str)
                else:
                    replace_str = "(" + ",".join(str(item) for item in value) + ")"
                    query = query.replace(f"{{{key}}}", replace_str)
            else:
                query = query.replace(f"{{{key}}}", f"{value}")

        # Check if the query is safe
        if not is_safe_query(query):
            raise HTTPException(status_code=400, detail=f"Invalid query")

        # Execute the query
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        cursor.execute(query)
        res = cursor.fetchall()
        return {
            "data": res,
            "query": query
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.get('/qr/get-all-query-reports', tags=["Masters"])
def get_config_list(
        request: Request,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        query = f"""
            SELECT query_report_id, name, description FROM query_reports WHERE is_deleted = 0 AND disabled = 0
        """
        cursor.execute(query)
        res = cursor.fetchall()
        return {
            "data": res
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.post('/qr/add-query-report', tags=["Masters"])
def add_query_report(
        name: str = Body(...),
        description: str = Body(...),
        query: str = Body(...),
        variables: List[dict] = Body(...),
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        if not is_safe_query(query):
            raise HTTPException(status_code=400, detail=f"Invalid query")
        add_report = query_reports(
            name=name,
            description=description,
            query=query,
            variables=json.dumps(variables),
            disabled=0,
            admin_only=0,
            is_deleted=0
        )
        db.add(add_report)
        db.commit()
        return {
            "message": "Report added successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.post('/qr/update-query-report', tags=["Masters"])
def update_query_report(
        config_id: int,
        name: str = Body(...),
        description: str = Body(...),
        query: str = Body(...),
        variables: List[dict] = Body(...),
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        db.query(query_reports).filter_by(query_report_id=config_id).update({
            "name": name,
            "description": description,
            "query": query,
            "variables": json.dumps(variables)
        })
        db.commit()
        return {
            "message": "Report updated successfully"
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.delete('/qr/delete-query-report', tags=["Masters"])
def delete_query_report(
        config_id: int,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        db.query(query_reports).filter_by(query_report_id=config_id).update({
            "is_deleted": 1
        })
        db.commit()
        return {
            "message": "Report deleted successfully"

        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.get('/qr/get-all-countries', tags=["Masters"])
def get_all_countries(
        request: Request,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        query = f"""
            SELECT country_id, country_name FROM countries
        """
        cursor.execute(query)
        res = cursor.fetchall()
        return {
            "data": res
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.get('/qr/get-all-departments', tags=["Masters"])
def get_all_departments(
        request: Request,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        query = f"""
            SELECT department_id, department_name FROM departments
        """
        cursor.execute(query)
        res = cursor.fetchall()
        return {
            "data": res
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.get('/qr/get-all-employees', tags=["Masters"])
def get_all_employees(
        request: Request,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        query = f"""
            SELECT employee_id, first_name, last_name FROM employees
        """
        cursor.execute(query)
        res = cursor.fetchall()
        return {
            "data": res
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")


@router.get('/qr/get-all-locations', tags=["Masters"])
def get_all_locations(
        request: Request,
        db: Session = Depends(get_db),
        rdb: Session = Depends(get_raw_db)
):
    try:
        cursor = rdb.cursor(cursor=pymysql.cursors.DictCursor)
        query = f"""
            SELECT location_id, location_name FROM locations
        """
        cursor.execute(query)
        res = cursor.fetchall()
        return {
            "data": res
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{e}")
