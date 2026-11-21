"""
Server runner script for patronet-backend.
Allows running the server with `python main.py` or `uvicorn main:app`.
"""
import uvicorn
from app.main import app

if __name__ == "__main__":
    from app.core.config import settings

    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
