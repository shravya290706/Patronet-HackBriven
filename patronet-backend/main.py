from fastapi import FastAPI

app = FastAPI(
    title="PATRONET API",
    description="E-commerce platform API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "PATRONET API is running 🚀"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }