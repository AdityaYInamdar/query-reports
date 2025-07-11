from fastapi import APIRouter
from server.src.routes.query import router as query_router
router = APIRouter()

router.include_router(query_router)

