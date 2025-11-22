#!/usr/bin/env python3
"""Auto-clear Pinecone index (no prompt)"""
from dotenv import load_dotenv
load_dotenv()

import os
from utils.vectordb import index

print("🗑️  Auto-clearing Pinecone index...")
print(f"   Index: {os.getenv('INDEX_NAME', 'default')}")

# Get stats before
try:
    stats = index.describe_index_stats()
    print(f"\n📊 Current Stats:")
    print(f"   Total vectors: {stats.total_vector_count}")
except Exception as e:
    print(f"   Could not fetch stats: {e}")

# Delete all vectors (no prompt)
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
