import os
from datetime import datetime
from pathlib import Path

import markdown
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from tinydb import TinyDB

from medium_publisher import MediumPublisher

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Medium Publisher", version="1.0.0")

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Create directories if they don't exist
Path("templates").mkdir(exist_ok=True)
Path("static").mkdir(exist_ok=True)
Path("exports").mkdir(exist_ok=True)
Path("data").mkdir(exist_ok=True)

# Initialize TinyDB for article history
db = TinyDB("data/articles.json")
articles_table = db.table("articles")

# Load Medium token from environment
MEDIUM_TOKEN = os.getenv("MEDIUM_TOKEN", "")


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/favicon.ico")
async def favicon():
    return FileResponse("static/favicon.ico")


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".md"):
        raise HTTPException(status_code=400, detail="Only markdown files are allowed")

    content = await file.read()
    return {"content": content.decode("utf-8"), "filename": file.filename}


@app.post("/save-draft")
async def save_draft(
    title: str = Form(""),
    content: str = Form(""),
    tags: str = Form(""),
    publish_status: str = Form("draft"),
    article_id: str = Form(""),
):
    """Save or update a draft in the articles table"""
    try:
        # Create article data
        article_data = {
            "title": title,
            "content": content,
            "tags": [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else [],
            "publish_status": publish_status,
            "updated_at": datetime.now().isoformat(),
            "word_count": len(content.split()) if content else 0,
        }

        if article_id:
            # Update existing article
            articles_table.update(article_data, doc_ids=[int(article_id)])
            message = "Draft updated successfully"
        else:
            # Create new draft
            article_data["created_at"] = datetime.now().isoformat()
            doc_id = articles_table.insert(article_data)
            article_id = str(doc_id)
            message = "Draft saved successfully"

        return {
            "success": True, 
            "message": message, 
            "article_id": article_id,
            "article": article_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save draft: {str(e)}")


@app.get("/history")
async def get_article_history():
    """Get all articles (published and drafts) from local database"""
    try:
        articles = articles_table.all()
        # Add doc_id to each article
        for article in articles:
            article['doc_id'] = article.doc_id
        # Sort by updated_at (newest first)
        articles.sort(key=lambda x: x.get("updated_at", x.get("published_at", "")), reverse=True)
        return {"articles": articles}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")


@app.get("/article/{article_id}")
async def get_article(article_id: int):
    """Get a specific article by ID"""
    try:
        article = articles_table.get(doc_id=article_id)
        if not article:
            raise HTTPException(status_code=404, detail="Article not found")
        # Add doc_id to the article
        article['doc_id'] = article.doc_id
        return {"article": article}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get article: {str(e)}")


@app.delete("/history/{article_id}")
async def delete_article_from_history(article_id: int):
    """Delete an article from local history"""
    try:
        articles_table.remove(doc_ids=[article_id])
        return {"success": True, "message": "Article removed from history"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete article: {str(e)}")


@app.post("/publish")
async def publish_article(
    title: str = Form(...),
    content: str = Form(...),
    tags: str = Form(""),
    publish_status: str = Form("draft"),
    article_id: str = Form(""),
):
    if not MEDIUM_TOKEN:
        raise HTTPException(status_code=400, detail="Medium API token not configured in .env file")

    try:
        publisher = MediumPublisher(MEDIUM_TOKEN)
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()] if tags else None

        response = publisher.publish_article(title=title, content=content, tags=tag_list, publish_status=publish_status)

        # Update article in database with Medium info
        article_data = {
            "title": title,
            "content": content,
            "tags": tag_list or [],
            "publish_status": "public",
            "medium_id": response["data"]["id"],
            "medium_url": response["data"]["url"],
            "published_at": datetime.now().isoformat(),
            "word_count": len(content.split()),
            "updated_at": datetime.now().isoformat(),
        }

        if article_id:
            # Update existing article
            articles_table.update(article_data, doc_ids=[int(article_id)])
        else:
            # Create new article
            article_data["created_at"] = datetime.now().isoformat()
            articles_table.insert(article_data)

        return {"success": True, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export")
async def export_article(title: str = Form(...), content: str = Form(...), export_format: str = Form("html")):
    """Export article in various formats since Medium API is restricted"""
    try:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_title = "".join(c for c in title if c.isalnum() or c in (" ", "-", "_")).rstrip()
        safe_title = safe_title.replace(" ", "_")

        if export_format == "html":
            # Convert markdown to HTML
            html_content = markdown.markdown(content, extensions=["extra"])
            html_template = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }}
        h1, h2, h3 {{ color: #333; }}
        code {{ background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace; }}
        pre {{ background: #f4f4f4; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 15px 0; }}
        blockquote {{ border-left: 4px solid #00ab6c; margin: 0; padding-left: 20px; color: #666; }}
    </style>
</head>
<body>
    <h1>{title}</h1>
    {html_content}
</body>
</html>
            """
            filename = f"exports/{safe_title}_{timestamp}.html"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(html_template)

            return FileResponse(filename, media_type="text/html", filename=f"{safe_title}.html")

        elif export_format == "markdown":
            filename = f"exports/{safe_title}_{timestamp}.md"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"# {title}\n\n{content}")

            return FileResponse(filename, media_type="text/markdown", filename=f"{safe_title}.md")

        elif export_format == "txt":
            # Convert markdown to plain text
            import re

            text_content = re.sub(r"#+\s*", "", content)  # Remove headers
            text_content = re.sub(r"\*\*(.*?)\*\*", r"\1", text_content)  # Remove bold
            text_content = re.sub(r"\*(.*?)\*", r"\1", text_content)  # Remove italic
            text_content = re.sub(r"`(.*?)`", r"\1", text_content)  # Remove code
            text_content = re.sub(r"\[(.*?)\]\(.*?\)", r"\1", text_content)  # Remove links

            filename = f"exports/{safe_title}_{timestamp}.txt"
            with open(filename, "w", encoding="utf-8") as f:
                f.write(f"{title}\n\n{text_content}")

            return FileResponse(filename, media_type="text/plain", filename=f"{safe_title}.txt")

        else:
            raise HTTPException(status_code=400, detail="Unsupported export format")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@app.get("/api-status")
async def check_api_status():
    """Check if Medium API is accessible"""
    if not MEDIUM_TOKEN:
        return {"status": "no_token", "message": "No API token configured in .env file"}

    try:
        publisher = MediumPublisher(MEDIUM_TOKEN)
        user_id = publisher.get_user_id()
        return {"status": "working", "message": f"API working, User ID: {user_id}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
