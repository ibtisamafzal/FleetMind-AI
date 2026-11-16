"""
RAG Engine for FleetMind AI.

Chroma is the primary persistent vector store when enabled and available.
TF-IDF remains available as a deterministic local fallback.
"""

import glob
import hashlib
import logging
import os
from typing import Any, Dict, List, Optional

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.config import settings

try:
    import chromadb
except ImportError:  # Chroma is optional so the existing fallback remains usable.
    chromadb = None


logger = logging.getLogger(__name__)
DOCS_DIR = os.path.join(os.path.dirname(__file__), "documents")


class FleetRAGEngine:
    def __init__(self, docs_dir: str = DOCS_DIR):
        self.docs_dir = docs_dir
        self.chunks: List[Dict[str, str]] = []
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.tfidf_matrix = None
        self.chroma_collection: Optional[Any] = None
        self.backend = "tfidf"
        self.build_index()

    def build_index(self):
        self.chunks = []
        md_files = glob.glob(os.path.join(self.docs_dir, "*.md"))

        for filepath in md_files:
            filename = os.path.basename(filepath)
            with open(filepath, "r", encoding="utf-8") as file:
                content = file.read()

            sections = content.split("## ")
            doc_title = sections[0].replace("# ", "").strip() if sections else filename

            for section in sections[1:]:
                lines = section.split("\n", 1)
                section_title = lines[0].strip() if lines else "General"
                section_body = lines[1].strip() if len(lines) > 1 else ""
                chunk_text = (
                    f"Document: {doc_title}\n"
                    f"Section: {section_title}\n"
                    f"Content: {section_body}"
                )
                self.chunks.append({
                    "doc_title": doc_title,
                    "section": section_title,
                    "content": section_body,
                    "source": filename,
                    "full_chunk": chunk_text,
                })

        if not self.chunks:
            logger.warning("RAG Engine found no documents in %s", self.docs_dir)
            return

        corpus = [chunk["full_chunk"] for chunk in self.chunks]
        self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
        self._build_chroma_index()
        logger.info(
            "RAG Engine indexed %s chunks from %s documents using %s",
            len(self.chunks),
            len(md_files),
            self.backend,
        )

    def _build_chroma_index(self):
        if not settings.RAG_USE_CHROMA:
            logger.info("Chroma RAG backend disabled by RAG_USE_CHROMA")
            return
        if chromadb is None:
            logger.warning("Chroma is unavailable; using TF-IDF RAG fallback")
            return

        try:
            os.makedirs(settings.VECTOR_DB_PATH, exist_ok=True)
            client = chromadb.PersistentClient(path=settings.VECTOR_DB_PATH)
            collection = client.get_or_create_collection(
                name="fleetmind_policies",
                metadata={"hnsw:space": "cosine"},
            )
            ids = [self._chunk_id(chunk) for chunk in self.chunks]
            metadata = [
                {
                    "doc_title": chunk["doc_title"],
                    "section": chunk["section"],
                    "source": chunk["source"],
                    "content": chunk["content"],
                }
                for chunk in self.chunks
            ]
            collection.upsert(
                ids=ids,
                documents=[chunk["full_chunk"] for chunk in self.chunks],
                metadatas=metadata,
            )

            existing = collection.get(include=[])
            stale_ids = [item_id for item_id in existing["ids"] if item_id not in ids]
            if stale_ids:
                collection.delete(ids=stale_ids)

            self.chroma_collection = collection
            self.backend = "chroma"
        except Exception as exc:
            self.chroma_collection = None
            self.backend = "tfidf"
            logger.warning("Chroma initialization failed; using TF-IDF fallback: %s", exc)

    @staticmethod
    def _chunk_id(chunk: Dict[str, str]) -> str:
        identity = f"{chunk['source']}:{chunk['section']}"
        return hashlib.sha256(identity.encode("utf-8")).hexdigest()

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve relevant policy chunks, falling back to TF-IDF on Chroma errors."""
        if not self.chunks:
            return []

        if self.chroma_collection is not None:
            try:
                result = self.chroma_collection.query(
                    query_texts=[query],
                    n_results=min(top_k, len(self.chunks)),
                    include=["metadatas", "distances"],
                )
                return self._format_chroma_results(result)
            except Exception as exc:
                logger.warning("Chroma query failed; using TF-IDF fallback: %s", exc)

        return self._retrieve_tfidf(query, top_k)

    @staticmethod
    def _format_chroma_results(result: Dict[str, Any]) -> List[Dict[str, Any]]:
        metadatas = (result.get("metadatas") or [[]])[0]
        distances = (result.get("distances") or [[]])[0]
        formatted = []

        for metadata, distance in zip(metadatas, distances):
            relevance = max(0.0, 1.0 - float(distance))
            if relevance <= 0.05:
                continue
            formatted.append({
                "doc_title": metadata["doc_title"],
                "section": metadata["section"],
                "content": metadata["content"],
                "source": metadata["source"],
                "full_chunk": (
                    f"Document: {metadata['doc_title']}\n"
                    f"Section: {metadata['section']}\n"
                    f"Content: {metadata['content']}"
                ),
                "relevance_score": round(relevance, 3),
            })
        return formatted

    def _retrieve_tfidf(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        if self.tfidf_matrix is None:
            return []

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = scores.argsort()[::-1][:top_k]
        results = []
        for index in top_indices:
            score = float(scores[index])
            if score > 0.05:
                item = dict(self.chunks[index])
                item["relevance_score"] = round(score, 3)
                results.append(item)
        return results


rag_engine = FleetRAGEngine()

if __name__ == "__main__":
    hits = rag_engine.retrieve("What should I check if fuel efficiency drops?")
    print(f"Found {len(hits)} relevant policy chunks using {rag_engine.backend}.")
    for hit in hits:
        print(f" - [{hit['source']} | {hit['section']}] {hit['relevance_score']}")
