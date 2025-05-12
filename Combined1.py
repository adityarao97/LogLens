import os
import re
from typing import Any, List, Literal, Optional
from functools import lru_cache

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from serpapi import GoogleSearch
from huggingface_hub import InferenceClient
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime

# --- Configuration (env or hardcode) ---
HF_TOKEN        = os.getenv("HF_TOKEN", "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")
SERPAPI_API_KEY = os.getenv("SERPAPI_API_KEY",
                            "4006359d4844a00d994f0f3e544870549e470bf9d043f804ab04466064244fb6")
DB_HOST         = os.getenv("DB_HOST",
                            "mydb-instance.c36ok0iyywfv.us-west-1.rds.amazonaws.com")
DB_USER         = os.getenv("DB_USER", "admin")
DB_PASSWORD     = os.getenv("DB_PASSWORD", "Aditya87Password")
DB_NAME         = os.getenv("DB_NAME", "log_db")

if not HF_TOKEN or not SERPAPI_API_KEY:
    raise RuntimeError("Please set HF_TOKEN and SERPAPI_API_KEY")

# --- Clients & Engines ---
cohere_client     = InferenceClient(provider="cohere",     api_key=HF_TOKEN)
hyperbolic_client = InferenceClient(provider="hyperbolic",api_key=HF_TOKEN)
search_client     = GoogleSearch({"engine": "google", "api_key": SERPAPI_API_KEY})
engine            = create_engine(
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
)

# --- Prompt Templates & Few-Shot Examples ---
SQL_SYSTEM_PROMPT = (
    "You are an expert SQL generator. Given this schema:\n"
    "  logs(id, log_file, log_timestamp, log_level,\n"
    "       log_module, log_request_id, log_user_id,\n"
    "       log_ip_address, log_request_method, log_request_url,\n"
    "       log_protocol, log_status, log_length, log_time, message)\n"
    "Translate the following user request into exactly one valid MySQL query."
    " Output only the SQL statement."
    "Always treat 'anomalous' or 'error' logs as log_level IN ('WARNING','ERROR','CRITICAL')"
    " If the user asks for anomalous or error logs, automatically filter by log_level IN ('WARNING','ERROR','CRITICAL')."
)

SQL_FEW_SHOTS = [
    {"role": "user", "content": 
     "List ERROR logs for glance-api from 2017-04-01 to 2017-04-07."},
    {"role": "assistant", "content": 
     "SELECT * FROM logs WHERE log_module='glance-api'"
     " AND log_level='ERROR'"
     " AND log_timestamp BETWEEN '2017-04-01' AND '2017-04-07';"},
    {"role": "user", "content": 
     "Count GET requests to '/servers/detail'."},
    {"role": "assistant", "content": 
     "SELECT COUNT(*) FROM logs WHERE log_request_method='GET'"
     " AND log_request_url LIKE '/servers/detail%';"}
]

# --- Pydantic Models ---
class AssistantRequest(BaseModel):
    mode:  Literal['search','sql','advice']
    query: str
    model: Optional[str] = 'CohereLabs/c4ai-command-a-03-2025'

class SearchResult(BaseModel):
    title:   str
    link:    str
    snippet: str

class AssistantResponse(BaseModel):
    mode: str
    data: Any

# --- FastAPI App & CORS ---
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# --- Security: Prompt Injection Detection ---
INJECTION_PATTERNS = [
    r"ignore all previous instructions",
    r"system settings",
    r"api[_\- ]?key",
    r"token",
    r"internal settings",
]

def is_prompt_injection(text: str) -> bool:
    t = text.lower()
    return any(re.search(pat, t) for pat in INJECTION_PATTERNS)

# --- Helper: Select LLM Client ---
def get_llm_client(model_name: str) -> InferenceClient:
    return hyperbolic_client if model_name.startswith('Qwen/') else cohere_client

# --- Advanced Prompting: Context Injection ---
def fetch_recent_logs(limit: int = 5) -> str:
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT log_file, log_level, log_time, message "
                 "FROM logs ORDER BY log_time DESC LIMIT :n"),
            {"n": limit}
        ).fetchall()
    lines = [f"{r.log_file} | {r.log_level} | {r.log_time} | {r.message}" for r in rows]
    return "### RECENT LOG EXAMPLES:\n" + "\n".join(lines)

# --- Helper: Web Search ---
def search_web(query: str, num_results: int = 5) -> List[SearchResult]:
    params = {
        "q":        query,
        "engine":   "google",
        "api_key":  SERPAPI_API_KEY,
        "num":      num_results
    }
    results = []
    for item in GoogleSearch(params).get_dict().get("organic_results", []):
        results.append(SearchResult(
            title   = item.get("title", ""),
            link    = item.get("link", ""),
            snippet = item.get("snippet", "")
        ))
    return results

# --- Cached SQL Generation ---
@lru_cache(maxsize=128)
def sql_from_nl(nl_query: str, model_name: str) -> Any:
    # uniform response format: always return dict with 'sql' and 'rows'
    if is_prompt_injection(nl_query):
        return {"sql": "", "rows": []}
    llm      = get_llm_client(model_name)
    context  = fetch_recent_logs()
    messages = [
        {"role":"system","content": SQL_SYSTEM_PROMPT},
        *SQL_FEW_SHOTS,
        {"role":"system","content": context},
        {"role":"user","content": nl_query}
    ]
    resp = llm.chat.completions.create(
        model      = model_name,
        messages   = messages,
        max_tokens = 256,
        temperature= 0.0
    )
    raw_sql = resp.choices[0].message.content.strip()
    cleaned = re.sub(r"^```(?:sql)?\s*","",raw_sql)
    cleaned = re.sub(r"\s*```$","",cleaned).strip()
    cleaned = re.sub(r"\blog_message\b", "message", cleaned)
    return {"sql": cleaned, "rows": []}

# --- Cached SRE Advice ---
@lru_cache(maxsize=128)
def ask_general(nl_query: str, model_name: str) -> Any:
    # uniform response format: always return dict with 'advice'
    if is_prompt_injection(nl_query):
        return {"advice": "Prompt injection detected: advice generation refused."}
    llm     = get_llm_client(model_name)
    system  = {
        "role":"system",
        "content":(
            "You are a site-reliability expert. Think step by step through "
            "system bottlenecks, then provide a concise, numbered list of recommendations."
        )
    }
    user    = {"role":"user","content": nl_query}
    resp = llm.chat.completions.create(
        model      = model_name,
        messages   = [system, user],
        max_tokens = 256,
        temperature= 0.7
    )
    return {"advice": resp.choices[0].message.content.strip()}

# --- Unified API Endpoint ---
@app.post('/assistant', response_model=AssistantResponse)
async def assistant(req: AssistantRequest):
    if req.mode == 'search':
        data = search_web(req.query)
    elif req.mode == 'sql':
        result = sql_from_nl(req.query, req.model)
        sql = result.get('sql', '')
        rows = result.get('rows', [])
        if sql:
            try:
                with engine.connect() as conn:
                    rows = [list(r) for r in conn.execute(text(sql)).fetchall()]
            except SQLAlchemyError:
                rows = []
        data = {"sql": sql, "rows": rows}
    elif req.mode == 'advice':
        result = ask_general(req.query, req.model)
        data = result
    else:
        data = None
    return {"mode": req.mode, "data": data}


# To run:
# uvicorn Combined1:app --reload --host 127.0.0.1 --port 8000