#!/usr/bin/env python3
from dotenv import load_dotenv
load_dotenv()

from utils.vectordb import index

stats = index.describe_index_stats()
print(f"Total vectors: {stats.total_vector_count}")
print(f"Namespaces: {stats.namespaces}")
print(f"Dimension: {stats.dimension if hasattr(stats, 'dimension') else 'N/A'}")
print(f"Index fullness: {stats.index_fullness if hasattr(stats, 'index_fullness') else 'N/A'}")
