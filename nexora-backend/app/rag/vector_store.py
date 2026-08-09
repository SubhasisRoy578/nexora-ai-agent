from functools import lru_cache
import logging
import uuid

logger = logging.getLogger(__name__)
try:
    from qdrant_client import QdrantClient
    from qdrant_client.models import Distance, VectorParams, PointStruct
except ImportError:
    QdrantClient = None
    Distance = VectorParams = PointStruct = None


# ==================================================
# QDRANT CLIENT
# ==================================================

@lru_cache(maxsize=1)
def get_qdrant_client():
    if QdrantClient is None:
        logger.info("qdrant_client_not_installed; vector search disabled")
        return None
    try:
        return QdrantClient(path="./qdrant_db")
    except Exception as e:
        logger.warning("qdrant_client_unavailable", extra={"error_type": type(e).__name__})
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

            logger.info("qdrant_collection_created", extra={"collection": COLLECTION_NAME})

    except Exception as e:

        logger.warning("qdrant_initialization_failed", extra={"error_type": type(e).__name__})


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

        logger.warning("qdrant_debug_failed", extra={"error_type": type(e).__name__})

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

            logger.info("qdrant_chunks_stored", extra={"count": len(points)})

    except Exception as e:

        logger.warning("qdrant_store_embeddings_failed", extra={"error_type": type(e).__name__})


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

        logger.warning("qdrant_document_search_failed", extra={"error_type": type(e).__name__})
        return []

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

