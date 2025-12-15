# from typing import Dict, Any
# from langchain.tools import tool
# from langchain.agents import create_react_agent, AgentExecutor
# from langchain_openai import ChatOpenAI
# from langchain_core.prompts import ChatPromptTemplate

# from app.rag.pipelines import run_rag
# from app.core.config import get_settings

# settings = get_settings()


# def rag_tool_fn(query: str) -> str:
#     result = run_rag(query)
#     return result["answer"] or "No answer from healthcare RAG."


# rag_tool = tool(
#     name="healthcare_rag_search",
#     func=rag_tool_fn,
#     description=(
#         "Use this tool to answer healthcare questions using internal "
#         "medical guidelines, clinic protocols, and patient education documents."
#     ),
# )


# def get_agent():
#     llm = ChatOpenAI(
#         model=settings.openai_model,
#         temperature=0.2,
#         openai_api_key=settings.openai_api_key,
#     )

#     agent_prompt = ChatPromptTemplate.from_messages(
#         [
#             (
#                 "system",
#                 "You are a cautious healthcare information agent.\n"
#                 "You can call tools like `healthcare_rag_search` to look up "
#                 "information in trusted documents.\n"
#                 "Always follow these rules:\n"
#                 "- You are NOT a doctor and do NOT give personal medical advice.\n"
#                 "- Encourage users to consult a clinician for decisions.\n"
#                 "- If the user describes an emergency, tell them to seek "
#                 "emergency care immediately.\n"
#                 "Reason step by step internally, but only output the final, "
#                 "patient-friendly answer.",
#             ),
#             ("human", "{input}"),
#         ]
#     )

#     agent = create_react_agent(llm, tools=[rag_tool], prompt=agent_prompt)
#     return agent


# def run_agentic(query: str) -> Dict[str, Any]:
#     agent = get_agent()
#     result = agent.invoke({"input": query})
#     return {"answer": result["output"]}


from typing import Dict, Any
from langchain_core.tools import tool  # ✓ CORRECTED: Use langchain_core.tools
from langchain_classic.agents import create_react_agent, AgentExecutor  # ✓ CORRECTED: Use langchain_classic
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

from app.rag.pipelines import run_rag
from app.core.config import get_settings

settings = get_settings()


# ✓ CORRECTED: Use @tool decorator instead of Tool class
@tool
def healthcare_rag_search(query: str) -> str:
    """Use this tool to answer healthcare questions using internal 
    medical guidelines, clinic protocols, and patient education documents."""
    result = run_rag(query)
    return result["answer"] or "No answer from healthcare RAG."


def get_agent():
    llm = ChatOpenAI(
        model=settings.openai_model,
        temperature=0.2,
        openai_api_key=settings.openai_api_key,
    )

    # ✓ CORRECTED: ReAct agents need a specific prompt format with 'agent_scratchpad'
    agent_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a cautious healthcare information agent.\n"
                "You can call tools like `healthcare_rag_search` to look up "
                "information in trusted documents.\n"
                "Always follow these rules:\n"
                "- You are NOT a doctor and do NOT give personal medical advice.\n"
                "- Encourage users to consult a clinician for decisions.\n"
                "- If the user describes an emergency, tell them to seek "
                "emergency care immediately.\n"
                "Reason step by step internally, but only output the final, "
                "patient-friendly answer.\n\n"
                "You have access to the following tools:\n{tools}\n\n"
                "Use the following format:\n"
                "Question: the input question you must answer\n"
                "Thought: you should always think about what to do\n"
                "Action: the action to take, should be one of [{tool_names}]\n"
                "Action Input: the input to the action\n"
                "Observation: the result of the action\n"
                "... (this Thought/Action/Action Input/Observation can repeat N times)\n"
                "Thought: I now know the final answer\n"
                "Final Answer: the final answer to the original input question"
            ),
            ("human", "{input}\n\n{agent_scratchpad}"),
        ]
    )

    tools = [healthcare_rag_search]
    agent = create_react_agent(llm, tools=tools, prompt=agent_prompt)
    
    # ✓ CORRECTED: Need to wrap agent in AgentExecutor
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)
    return agent_executor


def run_agentic(query: str) -> Dict[str, Any]:
    agent_executor = get_agent()
    result = agent_executor.invoke({"input": query})
    return {"answer": result["output"]}