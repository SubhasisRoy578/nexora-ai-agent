from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct
)

from functools import lru_cache
import uuid


# ==================================================
# QDRANT CLIENT
# ==================================================

@lru_cache(maxsize=1)
def get_qdrant_client():
    try:
        return QdrantClient(path="./qdrant_db")
    except Exception as e:
        print(f"[QDRANT WARN] QdrantClient init skipped/locked: {e}")
        return None


def _get_client():
    return get_qdrant_client()


COLLECTION_NAME = "nexora_documents"

VECTOR_SIZE = 384


# ==================================================
# INITIALIZE COLLECTION
# ==================================================

def initialize_qdrant():

    try:
        c = _get_client()
        if not c:
            return

        collections = c.get_collections()

        existing_collections = [
            collection.name
            for collection in collections.collections
        ]

        if COLLECTION_NAME not in existing_collections:

            c.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=VECTOR_SIZE,
                    distance=Distance.COSINE
                )
            )

            print(
                f"Created collection: {COLLECTION_NAME}"
            )

    except Exception as e:

        print(
            f"Qdrant Initialization Error: {e}"
        )


# ==================================================
# DEBUG DOCUMENTS
# ==================================================

def debug_documents():

    try:
        c = _get_client()
        if not c:
            return []

        results = c.scroll(
            collection_name=COLLECTION_NAME,
            limit=5,
            with_payload=True,
            with_vectors=False
        )

        return results

    except Exception as e:

        print(
            f"Debug Error: {e}"
        )

        return []


# ==================================================
# STORE EMBEDDINGS
# ==================================================

def store_embeddings(
    chunks,
    embeddings,
    source_file="unknown"
):

    try:

        initialize_qdrant()
        c = _get_client()
        if not c:
            return

        points = []

        for idx, embedding in enumerate(
            embeddings
        ):

            if hasattr(
                embedding,
                "tolist"
            ):

                vector = embedding.tolist()

            else:

                vector = list(embedding)

            points.append(

                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vector,
                    payload={
                        "text": chunks[idx],
                        "source": source_file
                    }
                )
            )

        if points:

            c.upsert(
                collection_name=COLLECTION_NAME,
                points=points
            )

            print(
                f"Stored {len(points)} chunks"
            )

    except Exception as e:

        print(
            f"Store Embeddings Error: {e}"
        )


# ==================================================
# SEARCH DOCUMENTS
# REQUIRED BY RAG ENGINE
# ==================================================

def search_documents(
    query_embedding,
    top_k=5
):

    try:

        initialize_qdrant()
        c = _get_client()
        if not c:
            return []

        if hasattr(
            query_embedding,
            "tolist"
        ):

            query_vector = (
                query_embedding.tolist()
            )

        else:

            query_vector = (
                list(query_embedding)
            )

        if hasattr(c, "query_points"):
            res = c.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=top_k,
                with_payload=True
            )
            return getattr(res, "points", [])
        elif hasattr(c, "search"):
            return c.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=top_k,
                with_payload=True
            )

        return []

    except Exception as e:

        print(
            f"Document Search Error: {e}"
        )

        return []


# ==================================================
# GENERIC VECTOR SEARCH
# ==================================================

def search(
    query_vector,
    limit=5
):

    try:

        initialize_qdrant()
        c = _get_client()
        if not c:
            return []

        if hasattr(
            query_vector,
            "tolist"
        ):

            query_vector = (
                query_vector.tolist()
            )

        if hasattr(c, "query_points"):
            res = c.query_points(
                collection_name=COLLECTION_NAME,
                query=query_vector,
                limit=limit,
                with_payload=True
            )
            return getattr(res, "points", [])
        elif hasattr(c, "search"):
            return c.search(
                collection_name=COLLECTION_NAME,
                query_vector=query_vector,
                limit=limit,
                with_payload=True
            )

        return []

    except Exception as e:

        print(
            f"[QDRANT SEARCH ERROR]: {e}"
        )

        return []
