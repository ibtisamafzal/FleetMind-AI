"""
RAG Engine for FleetMind AI
Loads policy and specification documents, chunks text, creates vector representations,
and retrieves high-relevance context with exact citations.
"""

import os
import glob
from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

DOCS_DIR = os.path.join(os.path.dirname(__file__), "documents")

class FleetRAGEngine:
    def __init__(self, docs_dir: str = DOCS_DIR):
        self.docs_dir = docs_dir
        self.chunks: List[Dict[str, str]] = []
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.tfidf_matrix = None
        self.build_index()

    def build_index(self):
        self.chunks = []
        md_files = glob.glob(os.path.join(self.docs_dir, "*.md"))
        
        for filepath in md_files:
            filename = os.path.basename(filepath)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()

            # Split document by headers or double newlines
            sections = content.split("## ")
            doc_title = sections[0].replace("# ", "").strip() if sections else filename

            for sec in sections[1:]:
                lines = sec.split("\n", 1)
                sec_title = lines[0].strip() if lines else "General"
                sec_body = lines[1].strip() if len(lines) > 1 else ""
                
                chunk_text = f"Document: {doc_title}\nSection: {sec_title}\nContent: {sec_body}"
                self.chunks.append({
                    "doc_title": doc_title,
                    "section": sec_title,
                    "content": sec_body,
                    "source": filename,
                    "full_chunk": chunk_text
                })

        if self.chunks:
            corpus = [c["full_chunk"] for c in self.chunks]
            self.tfidf_matrix = self.vectorizer.fit_transform(corpus)
            print(f"RAG Engine indexed {len(self.chunks)} chunks from {len(md_files)} documents.")

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict]:
        """
        Retrieves top_k relevant document chunks with cosine similarity score.
        """
        if not self.chunks or self.tfidf_matrix is None:
            return []

        query_vec = self.vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
        top_indices = scores.argsort()[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(scores[idx])
            if score > 0.05:  # Relevance threshold
                item = dict(self.chunks[idx])
                item["relevance_score"] = round(score, 3)
                results.append(item)

        return results

rag_engine = FleetRAGEngine()

if __name__ == "__main__":
    test_q = "What should I check if a vehicle's fuel efficiency suddenly drops?"
    hits = rag_engine.retrieve(test_q)
    print(f"Query: '{test_q}' -> Found {len(hits)} hits:")
    for h in hits:
        print(f" - [{h['source']} | {h['section']}] (Score: {h['relevance_score']})")
