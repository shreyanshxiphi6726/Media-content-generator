from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from the FastAPI backend!"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}