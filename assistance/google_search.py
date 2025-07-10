import os
from dotenv import load_dotenv
import requests

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
cx_id = os.getenv("GOOGLE_CX_ID")


class GoogleSearchAgent:
    def __init__(self, api_key: str = api_key, cx_id: str = cx_id):
        self.api_key = api_key
        self.cx = cx_id
        if not self.api_key or not self.cx:
            raise ValueError("GEMINI_API_KEY и GOOGLE_CX_ID должны быть установлены")

    def search(self, query: str) -> list[dict]:
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": self.api_key,
            "cx": self.cx,
            "q": query,
            "safe": "off"
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "error" in data:
            raise Exception(data["error"]["message"])

        return data.get("items", [])

    def search_images(self, query: str) -> list[dict]:
        """
        Выполняет поиск только по изображениям.
        """
        url = "https://www.googleapis.com/customsearch/v1"
        params = {
            "key": self.api_key,
            "cx": self.cx,
            "q": query,
            "searchType": "image",  # Ключевой параметр для поиска изображений
            "safe": "off"
        }
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        if "error" in data:
            raise Exception(data["error"]["message"])

        return data.get("items", [])
