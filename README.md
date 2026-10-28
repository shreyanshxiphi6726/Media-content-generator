# Media Content Generator

Canvas editor with local `.mcp` project files, MongoDB-backed project APIs, and bulk poster generation for n8n.

## 1. Prerequisites

- Node.js and npm
- Python 3.10+
- MongoDB running locally on port `27017`
- n8n (local, Docker, or hosted)

## 2. Configure MongoDB

The backend configuration is in `backend/.env`:

```env
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DATABASE=media_content_generator
FRONTEND_ORIGIN=http://localhost:5173
```

Start MongoDB before starting the API. The API can still run with an in-memory fallback if MongoDB is unavailable, but generated batches will not persist across restarts.

## 3. Start the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check the API:

- Health: `http://localhost:8000/api/health`
- Interactive docs: `http://localhost:8000/docs`

## 4. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm.cmd run dev
```

Open `http://localhost:5173`.

## 5. n8n bulk poster workflow

The bulk API accepts one MCP template and a list of recipients. It creates one `.mcp` file per recipient.

### Step A: Prepare a template

Use an MCP document containing placeholders in text layer labels:

```json
{
  "format": "mcp",
  "version": 1,
  "document": {
    "canvasDimensions": {
      "width": "600px",
      "height": "400px",
      "name": "16:9 Landscape"
    },
    "canvasBackground": "#ffffff",
    "canvasElements": [
      {
        "id": 1,
        "type": "text",
        "label": "Welcome {{name}}!",
        "x": 50,
        "y": 50,
        "fontSize": 32,
        "fontWeight": "700",
        "color": "#0f172a"
      },
      {
        "id": 2,
        "type": "text",
        "label": "{{event}} · {{date}}",
        "x": 50,
        "y": 120,
        "fontSize": 20
      }
    ]
  }
}
```

Placeholders support simple and nested values:

```text
{{name}}
{{event}}
{{contact.email}}
```

### Step B: Add recipient data in n8n

Use any n8n source node, such as Google Sheets, Airtable, CSV, Notion, or a webhook. Each item should contain fields matching the placeholders:

```json
{
  "name": "Aarav Sharma",
  "event": "Xiphi Launch",
  "date": "12 November 2026"
}
```

### Step C: Build the HTTP Request node

Add an **HTTP Request** node with:

- Method: `POST`
- URL: `http://localhost:8000/api/batches`
- Send Body: enabled
- Body Content Type: `JSON`

Example JSON body:

```json
{
  "name": "Event Posters",
  "template": {
    "format": "mcp",
    "version": 1,
    "document": {
      "canvasDimensions": {
        "width": "600px",
        "height": "400px",
        "name": "16:9 Landscape"
      },
      "canvasElements": [
        {
          "id": 1,
          "type": "text",
          "label": "Welcome {{name}}!",
          "x": 50,
          "y": 50,
          "fontSize": 32,
          "fontWeight": "700"
        },
        {
          "id": 2,
          "type": "text",
          "label": "{{event}} · {{date}}",
          "x": 50,
          "y": 120,
          "fontSize": 20
        }
      ]
    }
  },
  "recipients": {{ $input.all().map(item => item.json) }}
}
```

The response contains a batch ID and generated items:

```json
{
  "id": "batch-id",
  "status": "completed",
  "count": 2,
  "items": [
    {
      "id": "poster-item-id",
      "fileName": "Aarav-Sharma.mcp",
      "recipient": { "name": "Aarav Sharma" }
    }
  ]
}
```

### Step D: Download each generated MCP file

Add a **Code** node after the HTTP Request node to turn each generated item into a separate n8n item:

```javascript
const batch = $input.first().json;
return batch.items.map(item => ({
  json: {
    batchId: batch.id,
    itemId: item.id,
    fileName: item.fileName,
    downloadUrl: `http://localhost:8000/api/batches/${batch.id}/items/${item.id}/mcp`
  }
}));
```

Then add another **HTTP Request** node:

- Method: `GET`
- URL: `{{ $json.downloadUrl }}`
- Response Format: `File`
- Put Output in Field: `data`

Finally, use **Write Binary File**, Google Drive, Dropbox, S3, or another storage node to save the binary field `data` using the filename from `{{$json.fileName}}`.

## 6. n8n connectivity notes

### n8n running directly on your computer

Use:

```text
http://localhost:8000
```

### n8n running in Docker

`localhost` inside the container refers to the container itself. On Docker Desktop, use:

```text
http://host.docker.internal:8000
```

On Linux, expose the host gateway or run the API and n8n on the same Docker network.

### n8n Cloud

n8n Cloud cannot access your private `localhost`. Use a secure public HTTPS tunnel or deploy the FastAPI backend to a reachable server. Then replace the base URL in the HTTP Request nodes with that public URL.

## 7. API reference

- `GET /api/health`
- `POST /api/batches`
- `GET /api/batches/{batch_id}`
- `GET /api/batches/{batch_id}/items/{item_id}/mcp`
- `GET /docs`

The API currently generates up to 10,000 recipients per request. For very large campaigns, split the n8n input into batches.
