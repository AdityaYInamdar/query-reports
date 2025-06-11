import pymysql.cursors
from os import getenv
import pymysql
from sqlalchemy import create_engine
from sqlalchemy.ext.automap import automap_base
from sqlalchemy.orm import sessionmaker

'''
Database connection is defined here
'''

host = getenv("DB_SERVER")
ip = getenv("DB_PORT")
user = getenv("DB_USER")
password = getenv("DB_PASSWORD")
db = getenv("DB_DB")

cursorclass = pymysql.cursors.DictCursor
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{user}:{password}@{host}:{ip}/{db}"
print(SQLALCHEMY_DATABASE_URL)
SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("@", "%40", 1)
print(SQLALCHEMY_DATABASE_URL)

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'connect_timeout': 2}, pool_size=0, max_overflow=-1,
                       pool_recycle=3600)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = automap_base()
Base.prepare(engine, reflect=True)
