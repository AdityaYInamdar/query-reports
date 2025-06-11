from loguru import logger
from server.src.db.alchemy import Base

try:
    countries = Base.classes.countries
    departments = Base.classes.departments
    employees = Base.classes.employees
    locations = Base.classes.locations
    query_reports = Base.classes.query_reports
except Exception as err:
    logger.error("error while creating models - {}".format(err))
