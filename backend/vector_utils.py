import cohere
from pinecone import Pinecone
import requests
import base64
import os
import time
from typing import List, Dict, Any, TypedDict, Optional

from shopify_utils import Product

class ImageUrlContent(TypedDict):
    type: str
    image_url: Dict[str, str]

class ContentItem(TypedDict):
    content: List[ImageUrlContent]

class Metadata(TypedDict):
    body_html: str
    title: str
    vendor: str
    imageURL: str

class EmbeddingItem(TypedDict):
    id: str
    values: List[float]
    metadata: Metadata


co = cohere.ClientV2(os.getenv("COHERE_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_KEY"), environment="us-east1-gcp")
index = pc.Index(os.getenv("INDEX_NAME"))


def imageurl_to_input(image_url: str) -> List[ContentItem]:
  image = requests.get(image_url)
  stringified_buffer = base64.b64encode(image.content).decode("utf-8")
  content_type = image.headers["Content-Type"]
  image_base64 = f"data:{content_type};base64,{stringified_buffer}"

  return [{
          "content": [
              {
                  "type": "image_url",
                  "image_url": {"url": image_base64}
              }
          ],
      }]
  
def imageurl_to_embedding(image_url: str) -> Any:
  return co.embed(
      model="embed-english-v3.0",
      input_type="image",
      embedding_types=["float"],
      inputs=imageurl_to_input(image_url)
  )

def text_to_embedding(text: str) -> Any:
    return co.embed(
        model="embed-english-v3.0",
        input_type="search_query",
        embedding_types=["float"],
        inputs=[{"content": [
            {"type": "text", "text": text},
        ]}]
    )

def embed_products(products: List[Product]) -> List[EmbeddingItem]:
    items: List[EmbeddingItem] = []

    for i, product in enumerate(products):
        items.append({
            "id": str(i),
            "values": imageurl_to_embedding(product["image"]).embeddings.float_[0],
            "metadata": {
                "body_html": product["body_html"],
                "title": product["name"],
                "vendor": product["vendor"],
                "imageURL": product["image"]
            }
        })
        time.sleep(0.2)
    return items

def upsert_embeddings(items: List[EmbeddingItem]) -> None:
    index.upsert(vectors=items)

def query_embeddings(vector: List[float], top_k: int = 10) -> Any:
    
    return index.query(
        vector=vector,
        top_k=top_k,
        include_metadata=True
    )

