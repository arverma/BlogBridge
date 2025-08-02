import json
import os
import subprocess

from dotenv import load_dotenv


class MediumPublisher:
    def __init__(self, token=None):
        # Load token from environment or use provided token
        load_dotenv()
        self.token = token or os.getenv("MEDIUM_TOKEN")
        if not self.token:
            raise ValueError(
                "Medium API token is required. Set MEDIUM_TOKEN environment variable or pass token to constructor."
            )

        self.base_url = "https://api.medium.com/v1"

    def _make_curl_request(self, method, endpoint, data=None):
        """Make API request using curl to bypass Cloudflare protection"""
        url = f"{self.base_url}{endpoint}"

        cmd = [
            "curl",
            "-s",
            "-H",
            f"Authorization: Bearer {self.token}",
            "-H",
            "Content-Type: application/json",
            "-X",
            method.upper(),
        ]

        if data:
            cmd.extend(["-d", json.dumps(data)])

        cmd.append(url)

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                raise Exception(f"Curl request failed: {result.stderr}")

            response_data = json.loads(result.stdout)
            return response_data
        except subprocess.TimeoutExpired:
            raise Exception("Request timed out")
        except json.JSONDecodeError:
            raise Exception(f"Invalid JSON response: {result.stdout}")
        except Exception as e:
            raise Exception(f"Request failed: {str(e)}")

    def get_user_id(self):
        """Get the authenticated user's ID"""
        try:
            response = self._make_curl_request("GET", "/me")
            return response["data"]["id"]
        except Exception as e:
            raise Exception(f"Failed to get user ID: {str(e)}")

    def publish_article(self, title, content, tags=None, publish_status="draft"):
        """
        Publish an article to Medium

        Args:
            title (str): Article title
            content (str): Article content in markdown format
            tags (list): List of tags for the article
            publish_status (str): Either 'draft', 'public', or 'unlisted'
        """
        if not title or not content:
            raise ValueError("Title and content are required")

        if publish_status not in ["draft", "public", "unlisted"]:
            raise ValueError("publish_status must be 'draft', 'public', or 'unlisted'")

        try:
            user_id = self.get_user_id()

            data = {
                "title": title,
                "contentFormat": "markdown",
                "content": content,
                "publishStatus": publish_status,
            }

            if tags:
                data["tags"] = tags

            response = self._make_curl_request("POST", f"/users/{user_id}/posts", data)
            return response
        except Exception as e:
            raise Exception(f"Failed to publish article: {str(e)}")

    def get_user_articles(self):
        """Get all articles for the authenticated user"""
        try:
            user_id = self.get_user_id()
            response = self._make_curl_request("GET", f"/users/{user_id}/publications")
            return response
        except Exception as e:
            raise Exception(f"Failed to get articles: {str(e)}")


# Example usage
if __name__ == "__main__":
    # Test the API connection
    try:
        publisher = MediumPublisher()
        user_id = publisher.get_user_id()
        print(f"Successfully connected to Medium API. User ID: {user_id}")

        # Test with a sample article
        sample_content = """# Test Article

This is a test article created via the Medium API.

## Features
- Markdown support
- API integration
- Easy publishing

*This is a test article.*"""

        response = publisher.publish_article(
            title="API Test Article",
            content=sample_content,
            tags=["test", "api", "python"],
            publish_status="draft",
        )

        print("Article published successfully!")
        print(json.dumps(response, indent=2))

    except Exception as e:
        print(f"Error: {e}")
