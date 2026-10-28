import os
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from bson import ObjectId
    from pymongo import MongoClient
except ImportError:
    ObjectId = None
    MongoClient = None

load_dotenv()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "media_content_generator")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app = FastAPI(title="Media Content Generator API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

mongo_client = None
projects_collection = None
memory_projects: dict[str, dict[str, Any]] = {}


class ProjectPayload(BaseModel):
    name: str = Field(default="Untitled Design", max_length=120)
    document: dict[str, Any] = Field(default_factory=dict)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect_mongo() -> bool:
    global mongo_client, projects_collection
    if MongoClient is None:
        return False
    if projects_collection is not None:
        return True
    try:
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1000)
        mongo_client.admin.command("ping")
        projects_collection = mongo_client[MONGODB_DATABASE]["projects"]
        return True
    except Exception:
        mongo_client = None
        projects_collection = None
        return False


def serialize_project(project: dict[str, Any]) -> dict[str, Any]:
    result = dict(project)
    if "_id" in result:
        result["id"] = str(result.pop("_id"))
    return result


@app.get("/")
def read_root():
    return {"message": "Media Content Generator API", "mongoConfigured": bool(MONGODB_URI)}


@app.get("/api/health")
def health_check():
    connected = connect_mongo()
    return {"status": "healthy", "database": "mongodb" if connected else "memory-fallback"}


@app.get("/api/projects")
def list_projects():
    if connect_mongo():
        return [serialize_project(item) for item in projects_collection.find().sort("updatedAt", -1)]
    return sorted(memory_projects.values(), key=lambda item: item["updatedAt"], reverse=True)


@app.post("/api/projects")
def create_project(payload: ProjectPayload):
    timestamp = now_iso()
    project = {"name": payload.name, "document": payload.document, "createdAt": timestamp, "updatedAt": timestamp}
    if connect_mongo():
        inserted = projects_collection.insert_one(project)
        project["id"] = str(inserted.inserted_id)
        return project
    project["id"] = str(uuid4())
    memory_projects[project["id"]] = project
    return project


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    if connect_mongo() and ObjectId and ObjectId.is_valid(project_id):
        project = projects_collection.find_one({"_id": ObjectId(project_id)})
        if project:
            return serialize_project(project)
    if project_id in memory_projects:
        return memory_projects[project_id]
    raise HTTPException(status_code=404, detail="Project not found")


@app.put("/api/projects/{project_id}")
def update_project(project_id: str, payload: ProjectPayload):
    timestamp = now_iso()
    if connect_mongo() and ObjectId and ObjectId.is_valid(project_id):
        result = projects_collection.update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"name": payload.name, "document": payload.document, "updatedAt": timestamp}},
        )
        if result.matched_count:
            return get_project(project_id)
    if project_id in memory_projects:
        memory_projects[project_id].update(name=payload.name, document=payload.document, updatedAt=timestamp)
        return memory_projects[project_id]
    raise HTTPException(status_code=404, detail="Project not found")


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    if connect_mongo() and ObjectId and ObjectId.is_valid(project_id):
        result = projects_collection.delete_one({"_id": ObjectId(project_id)})
        if result.deleted_count:
            return {"deleted": True}
    if memory_projects.pop(project_id, None) is not None:
        return {"deleted": True}
    raise HTTPException(status_code=404, detail="Project not found")
