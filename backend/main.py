import os
import re
import json
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
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
batches_collection = None
memory_projects: dict[str, dict[str, Any]] = {}
memory_batches: dict[str, dict[str, Any]] = {}


class ProjectPayload(BaseModel):
    name: str = Field(default="Untitled Design", max_length=120)
    document: dict[str, Any] = Field(default_factory=dict)


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect_mongo() -> bool:
    global mongo_client, projects_collection, batches_collection
    if MongoClient is None:
        return False
    if projects_collection is not None:
        return True
    try:
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=1000)
        mongo_client.admin.command("ping")
        database = mongo_client[MONGODB_DATABASE]
        projects_collection = database["projects"]
        batches_collection = database["batches"]
        return True
    except Exception:
        mongo_client = None
        projects_collection = None
        batches_collection = None
        return False


def replace_placeholders(value: Any, data: dict[str, Any]) -> Any:
    """Recursively replaces {{key}} and {{nested.key}} in an MCP document."""
    if isinstance(value, dict):
        return {key: replace_placeholders(item, data) for key, item in value.items()}
    if isinstance(value, list):
        return [replace_placeholders(item, data) for item in value]
    if not isinstance(value, str):
        return value

    def resolve(match: re.Match[str]) -> str:
        current: Any = data
        for part in match.group(1).strip().split("."):
            if not isinstance(current, dict) or part not in current:
                return match.group(0)
            current = current[part]
        return str(current)

    return re.sub(r"{{\s*([^{}]+?)\s*}}", resolve, value)


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


class BulkBatchPayload(BaseModel):
    name: str = Field(default="Bulk Poster Batch", max_length=120)
    template: dict[str, Any]
    recipients: list[dict[str, Any]] = Field(min_length=1, max_length=10000)


def batch_to_public(batch: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": batch["id"],
        "name": batch["name"],
        "status": batch["status"],
        "count": len(batch["items"]),
        "createdAt": batch["createdAt"],
        "items": [
            {"id": item["id"], "fileName": item["fileName"], "recipient": item["recipient"]}
            for item in batch["items"]
        ],
    }


@app.post("/api/batches")
def create_bulk_batch(payload: BulkBatchPayload):
    """Generate one MCP document per recipient from a template."""
    batch_id = str(uuid4())
    timestamp = now_iso()
    template_document = payload.template.get("document", payload.template)
    items = []

    for index, recipient in enumerate(payload.recipients, start=1):
        rendered_document = replace_placeholders(template_document, recipient)
        recipient_name = str(recipient.get("name") or recipient.get("fullName") or f"guest-{index}")
        safe_name = re.sub(r"[^a-zA-Z0-9._-]+", "-", recipient_name).strip("-") or f"guest-{index}"
        items.append({
            "id": str(uuid4()),
            "fileName": f"{safe_name}.mcp",
            "recipient": recipient,
            "mcp": {
                "format": "mcp",
                "version": 1,
                "name": safe_name,
                "document": rendered_document,
                "recipient": recipient,
            },
        })

    batch = {
        "id": batch_id,
        "name": payload.name,
        "status": "completed",
        "createdAt": timestamp,
        "items": items,
    }
    if connect_mongo():
        batches_collection.insert_one({**batch, "_id": batch_id})
    else:
        memory_batches[batch_id] = batch
    return batch_to_public(batch)


def get_batch_or_404(batch_id: str) -> dict[str, Any]:
    if connect_mongo():
        batch = batches_collection.find_one({"_id": batch_id})
        if batch:
            batch["id"] = batch.pop("_id")
            return batch
    if batch_id in memory_batches:
        return memory_batches[batch_id]
    raise HTTPException(status_code=404, detail="Batch not found")


@app.get("/api/batches/{batch_id}")
def get_bulk_batch(batch_id: str):
    return batch_to_public(get_batch_or_404(batch_id))


@app.get("/api/batches/{batch_id}/items/{item_id}/mcp")
def download_generated_mcp(batch_id: str, item_id: str):
    batch = get_batch_or_404(batch_id)
    item = next((candidate for candidate in batch["items"] if candidate["id"] == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Generated poster not found")
    return Response(
        content=json.dumps(item["mcp"], indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{item["fileName"]}"'},
    )
