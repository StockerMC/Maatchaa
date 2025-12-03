#!/usr/bin/env python3
from dotenv import load_dotenv
load_dotenv()

from utils.vectordb import index

print("🗑️  Force clearing Pinecone with namespace...")

try:
    # Delete from default namespace
    index.delete(delete_all=True, namespace='')
    print("✅ Cleared default namespace")
except Exception as e:
    print(f"⚠️  Default namespace: {e}")

try:
    # Also try __default__
    index.delete(delete_all=True, namespace='__default__')
    print("✅ Cleared __default__ namespace")
except Exception as e:
    print(f"⚠️  __default__ namespace: {e}")

# Check stats
stats = index.describe_index_stats()
print(f"\n📊 After cleanup:")
print(f"   Total vectors: {stats.total_vector_count}")
print(f"   Namespaces: {stats.namespaces}")
print(f"   Fullness: {stats.index_fullness if hasattr(stats, 'index_fullness') else 'N/A'}")
