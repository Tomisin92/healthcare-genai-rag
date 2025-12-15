from typing import List, Dict
from loguru import logger
from app.rag.pipelines import run_rag

# A tiny in-house eval dataset. In production, keep this in a DB or file.
EVAL_SET = [
    {
        "query": "What are the main features of product X?",
        "expected_keywords": ["feature", "scalability", "latency"],
    },
    # add more
]


def simple_keyword_eval(answer: str, expected_keywords: List[str]) -> float:
    answer_lower = answer.lower()
    hits = sum(1 for kw in expected_keywords if kw in answer_lower)
    return hits / max(len(expected_keywords), 1)


def run_offline_eval() -> List[Dict]:
    results = []
    for item in EVAL_SET:
        q = item["query"]
        expected = item["expected_keywords"]
        rag_result = run_rag(q)
        score = simple_keyword_eval(rag_result["answer"], expected)
        logger.info(f"Eval query={q} score={score}")
        results.append(
            {
                "query": q,
                "score": score,
                "answer": rag_result["answer"],
                "context": rag_result["context_documents"],
            }
        )
    return results
