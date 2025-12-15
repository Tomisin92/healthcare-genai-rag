from typing import Dict, Any

from langchain_classic.chains import create_retrieval_chain
from langchain_classic.chains.combine_documents import create_stuff_documents_chain

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from app.core.config import get_settings
from .vectorstore import get_vectorstore

settings = get_settings()


def get_llm():
    return ChatOpenAI(
        model=settings.openai_model,
        temperature=0.1,
        openai_api_key=settings.openai_api_key,
    )


HEALTHCARE_SYSTEM_PROMPT = """
You are a cautious, evidence-based healthcare information assistant.
Your goals:
- Provide clear, accurate, and compassionate medical information.
- Base your answers STRICTLY on the provided context from trusted documents.
- If the answer is not clearly in the context, say you are not sure.
- NEVER invent treatments, dosages, or diagnoses.

Safety rules:
- You are NOT a doctor and NOT a substitute for professional medical advice.
- Do NOT give personal medical advice, treatment plans, or dosing instructions.
- Encourage users to consult a licensed healthcare professional for decisions.
- If a question sounds like an emergency (e.g., chest pain, difficulty breathing,
  suicidal thoughts), tell the user to seek EMERGENCY CARE immediately.

When you answer:
- Use simple, patient-friendly language.
- Summarize key points.
- Mention that the information may not apply to every individual.
"""


def get_rag_chain():
    vectordb = get_vectorstore()
    retriever = vectordb.as_retriever(search_kwargs={"k": 5})

    llm = get_llm()

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", HEALTHCARE_SYSTEM_PROMPT),
            (
                "human",
                "Context from healthcare documents:\n{context}\n\nUser question:\n{input}",
            ),
        ]
    )

    document_chain = create_stuff_documents_chain(llm, prompt)
    retrieval_chain = create_retrieval_chain(retriever, document_chain)
    return retrieval_chain


def run_rag(query: str) -> Dict[str, Any]:
    """
    Run the RAG pipeline with the given query.
    
    Returns:
        Dict containing:
        - answer: The generated answer from the LLM
        - source_documents: List of retrieved documents with metadata and content
    """
    chain = get_rag_chain()
    result = chain.invoke({"input": query})
    answer = result.get("answer") or ""

    # Extract source documents from context
    source_docs = []
    for d in result.get("context", []):
        source_docs.append(
            {
                "metadata": d.metadata,
                "content": d.page_content[:700],  # Limit content to 700 chars
            }
        )

    return {
        "answer": answer,
        "source_documents": source_docs,  # FIXED: Changed from "context_documents"
    }
    