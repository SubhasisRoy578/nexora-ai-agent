import logging

logger = logging.getLogger(__name__)
_model = None


def get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("BAAI/bge-small-en-v1.5")
        except ImportError:
            logger.info("sentence_transformers_not_installed; rag embeddings using zero-vector fallback")
            _model = None
        except Exception as e:
            logger.warning("rag_embedding_model_unavailable", extra={"error_type": type(e).__name__})
            _model = None
    return _model


def create_embeddings(chunks):
    model = get_model()
    if model is None:
        return [[0.0] * 384 for _ in chunks]
    return model.encode(chunks)
