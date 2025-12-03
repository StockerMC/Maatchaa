#!/usr/bin/env python3
from dotenv import load_dotenv
load_dotenv()

from utils.vectordb import index, text_to_embedding

# Query for any vectors
test_text = "test"
embedding = text_to_embedding(test_text).embeddings.float_[0]

results = index.query(vector=embedding, top_k=10, include_metadata=True)

print(f"Found {len(results.matches)} vectors:")
for match in results.matches[:5]:
    print(f"  ID: {match.id}")
    print(f"  Score: {match.score}")
    if match.metadata:
        print(f"  Metadata: {dict(list(match.metadata.items())[:3])}")
    print()
