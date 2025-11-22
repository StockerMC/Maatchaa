#!/usr/bin/env python3
"""
Clear Pinecone index to free up storage
"""
from dotenv import load_dotenv
load_dotenv()

import os
from utils.vectordb import index

print("🗑️  Clearing Pinecone index...")
print(f"   Index: {os.getenv('INDEX_NAME', 'default')}")

# Get stats before
try:
    stats = index.describe_index_stats()
    print(f"\n📊 Current Stats:")
    print(f"   Total vectors: {stats.total_vector_count}")
    if hasattr(stats, 'dimension'):
        print(f"   Dimension: {stats.dimension}")
except Exception as e:
    print(f"   Could not fetch stats: {e}")

# Confirm
response = input("\n⚠️  Delete ALL vectors? (yes/no): ")
if response.lower() != "yes":
    print("❌ Cancelled")
    exit()

# Delete all vectors
try:
    index.delete(delete_all=True)
    print("\n✅ All vectors deleted!")
except Exception as e:
    print(f"\n❌ Error deleting: {e}")
    exit(1)

# Verify
try:
    stats = index.describe_index_stats()
    print(f"\n📊 After deletion:")
    print(f"   Total vectors: {stats.total_vector_count}")
except Exception as e:
    print(f"   Could not verify: {e}")
