from server.src.db.alchemy import SessionLocal, engine


def get_db():
    db = SessionLocal()
    try:
        # logging.debug("yeilding db")
        yield db
    finally:
        # logging.debug("closing db")
        db.close()


def get_raw_db():
    '''
    does
    :return:
    '''
    db = engine.raw_connection()


    # logging.info("get_db")
    try:
        # logging.debug("yeilding db")
        yield db
    finally:
        # logging.debug("closing db")
        db.close()
