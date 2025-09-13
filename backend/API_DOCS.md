# Vector Database API Documentation

A REST API for managing product embeddings and performing similarity searches using vector databases. This API integrates with Shopify stores to ingest product data and provides powerful search capabilities using image embeddings.

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [Health Check](#health-check)
  - [Data Ingestion](#data-ingestion)
  - [Search Operations](#search-operations)
  - [Product Management](#product-management)
  - [Database Statistics](#database-statistics)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

This API provides endpoints for:
- Ingesting product data from Shopify stores
- Creating and storing vector embeddings from product images
- Performing similarity searches using image or text queries
- Managing products in the vector database
- Retrieving database statistics and health information

## Authentication

Currently, the API uses environment variables for external service authentication:
- `COHERE_KEY` - Cohere API key for generating embeddings
- `PINECONE_KEY` - Pinecone API key for vector database operations
- `INDEX_NAME` - Pinecone index name

## Base URL

```
http://localhost:8000
```

## Endpoints

### Health Check

#### `GET /`

Check if the API is running and healthy.

**Response:**
```json
{
  "status": "healthy",
  "message": "API is running"
}
```

**Status Codes:**
- `200` - Service is healthy

---

### Data Ingestion

#### `POST /ingest`

Ingest products from a Shopify store, create embeddings, and store them in the vector database.

**Request Body:**
```json
{
  "shop_url": "https://your-shop.myshopify.com"
}
```

**Parameters:**
- `shop_url` (string, required) - The Shopify store URL

**Response:**
```json
{
  "message": "Successfully ingested 25 products",
  "products_processed": 25,
  "total_products": 30
}
```

**Status Codes:**
- `200` - Products successfully ingested
- `400` - Missing or invalid shop_url, or no products with images found
- `500` - Internal server error

---

### Search Operations

#### `POST /search/image`

Find products similar to a given image using vector similarity search.

**Request Body:**
```json
{
  "image_url": "https://example.com/product-image.jpg",
  "top_k": 5
}
```

**Parameters:**
- `image_url` (string, required) - URL of the image to search for
- `top_k` (integer, optional) - Number of results to return (default: 5)

**Response:**
```json
{
  "query_image": "https://example.com/product-image.jpg",
  "results": [
    {
      "id": "0",
      "score": 0.95,
      "metadata": {
        "body_html": "<p>Product description here</p>"
      }
    }
  ]
}
```

**Status Codes:**
- `200` - Search completed successfully
- `400` - Missing image_url
- `500` - Internal server error

#### `POST /search/text`

Search for products using text queries in product descriptions.

**Request Body:**
```json
{
  "query": "red dress",
  "top_k": 10
}
```

**Parameters:**
- `query` (string, required) - Text to search for in product descriptions
- `top_k` (integer, optional) - Number of results to return (default: 10)

**Response:**
```json
{
  "query": "red dress",
  "results": [
    {
      "id": "5",
      "score": 0.88,
      "metadata": {
        "body_html": "<p>Beautiful red dress perfect for evening wear</p>"
      }
    }
  ]
}
```

**Status Codes:**
- `200` - Search completed successfully
- `400` - Missing query parameter
- `500` - Internal server error

---

### Product Management

#### `GET /products`

Retrieve all products with pagination support.

**Query Parameters:**
- `limit` (integer, optional) - Number of products to return (default: 20, max: 100)
- `offset` (integer, optional) - Number of products to skip (default: 0)

**Example Request:**
```
GET /products?limit=10&offset=20
```

**Response:**
```json
{
  "products": [
    {
      "id": "0",
      "metadata": {
        "body_html": "<p>Product description</p>"
      }
    }
  ],
  "total_returned": 10,
  "limit": 10,
  "offset": 20
}
```

**Status Codes:**
- `200` - Products retrieved successfully
- `500` - Internal server error

#### `GET /products/{product_id}`

Retrieve a specific product by its ID.

**Path Parameters:**
- `product_id` (string, required) - The unique identifier of the product

**Response:**
```json
{
  "id": "123",
  "metadata": {
    "body_html": "<p>Detailed product description</p>"
  },
  "values": [0.1, 0.2, 0.3, "..."]
}
```

**Status Codes:**
- `200` - Product found and returned
- `404` - Product not found
- `500` - Internal server error

#### `DELETE /products/{product_id}`

Delete a specific product from the vector database.

**Path Parameters:**
- `product_id` (string, required) - The unique identifier of the product to delete

**Response:**
```json
{
  "message": "Product 123 deleted successfully"
}
```

**Status Codes:**
- `200` - Product deleted successfully
- `500` - Internal server error

---

### Database Statistics

#### `GET /stats`

Get statistics and information about the vector database.

**Response:**
```json
{
  "total_vectors": 1500,
  "dimension": 1024,
  "index_fullness": 0.75,
  "namespaces": {}
}
```

**Status Codes:**
- `200` - Statistics retrieved successfully
- `500` - Internal server error

---

## Data Models

### Product

A simplified product structure used throughout the API:

```typescript
interface Product {
  name?: string;          // Product title
  price?: string;         // Product price
  image?: string;         // Product image URL
  body_html?: string;     // Product description HTML
}
```

### Search Result

Structure for search operation results:

```typescript
interface SearchResult {
  id: string;             // Product identifier
  score: number;          // Similarity score (0-1)
  metadata: {
    body_html?: string;   // Product description
    // Additional metadata fields
  };
}
```

### Embedding Item

Structure for vector database entries:

```typescript
interface EmbeddingItem {
  id: string;             // Unique identifier
  values: number[];       // Vector embedding values
  metadata: {
    body_html?: string;   // Product metadata
    [key: string]: any;   // Additional metadata
  };
}
```

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Description of the error"
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (missing required parameters, invalid input)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error (server-side issues)

---

## Examples

### Complete Workflow Example

1. **Check API Health**
```bash
curl http://localhost:8000/
```

2. **Ingest Products from Shopify**
```bash
curl -X POST http://localhost:8000/ingest \
  -H "Content-Type: application/json" \
  -d '{"shop_url": "https://your-shop.myshopify.com"}'
```

3. **Search for Similar Products**
```bash
curl -X POST http://localhost:8000/search/image \
  -H "Content-Type: application/json" \
  -d '{
    "image_url": "https://example.com/query-image.jpg",
    "top_k": 5
  }'
```

4. **Search by Text**
```bash
curl -X POST http://localhost:8000/search/text \
  -H "Content-Type: application/json" \
  -d '{
    "query": "summer dress",
    "top_k": 10
  }'
```

5. **Get Database Statistics**
```bash
curl http://localhost:8000/stats
```

### JavaScript/TypeScript Example

```javascript
// Ingest products
const ingestResponse = await fetch('http://localhost:8000/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    shop_url: 'https://your-shop.myshopify.com'
  })
});

const ingestResult = await ingestResponse.json();
console.log(ingestResult);

// Search by image
const searchResponse = await fetch('http://localhost:8000/search/image', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    image_url: 'https://example.com/product.jpg',
    top_k: 5
  })
});

const searchResults = await searchResponse.json();
console.log(searchResults);
```

### Python Example

```python
import requests

# Ingest products
response = requests.post(
    'http://localhost:8000/ingest',
    json={'shop_url': 'https://your-shop.myshopify.com'}
)
print(response.json())

# Search by image
response = requests.post(
    'http://localhost:8000/search/image',
    json={
        'image_url': 'https://example.com/product.jpg',
        'top_k': 5
    }
)
print(response.json())
```

---

## Rate Limiting

The API includes built-in rate limiting for embedding operations:
- 0.2 second delay between embedding requests during ingestion
- This prevents overwhelming the Cohere API

## Dependencies

- **BlackSheep** - Web framework
- **Cohere** - AI platform for generating embeddings
- **Pinecone** - Vector database for storing and searching embeddings
- **Requests** - HTTP library for external API calls

## Environment Variables

Required environment variables:

```bash
COHERE_KEY=your_cohere_api_key
PINECONE_KEY=your_pinecone_api_key
INDEX_NAME=your_pinecone_index_name
PORT=8000                    # Optional, defaults to 8000
HOST=localhost              # Optional, defaults to localhost
```
