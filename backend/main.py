import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

app = FastAPI(title="Interview Prep API")

# CORS middleware — allow the Vite dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)


# --- Request / Response models ---

class QuestionRequest(BaseModel):
    job_title: str
    company_name: str
    job_description: Optional[str] = None


class Question(BaseModel):
    id: int
    type: str  # "behavioral" or "technical"
    question: str


class EvaluateRequest(BaseModel):
    question: str
    question_type: str  # "behavioral" or "technical"
    answer: str


class EvaluateResponse(BaseModel):
    score: float
    strengths: list[str]
    improvements: list[str]


# --- Helper ---

def _parse_json_response(content: str):
    """Strip optional markdown fences and parse JSON."""
    content = content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1]
        content = content.rsplit("```", 1)[0]
        content = content.strip()
    return json.loads(content)


# --- Routes ---

@app.get("/")
def root():
    return {"message": "Interview Prep API is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/generate-questions", response_model=list[Question])
def generate_questions(req: QuestionRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    jd_section = ""
    if req.job_description:
        jd_section = f"\n\nJob Description:\n{req.job_description}"

    prompt = (
        f"You are an expert interview coach.\n"
        f"Generate 10 interview questions for a candidate applying for the role of "
        f"**{req.job_title}** at **{req.company_name}**.{jd_section}\n\n"
        f"Return exactly 5 behavioral questions and 5 technical questions.\n"
        f"Tailor the questions to the specific role, company, and industry.\n\n"
        f"Respond ONLY with a JSON array of objects. Each object must have:\n"
        f'  - "id": integer starting at 1\n'
        f'  - "type": either "behavioral" or "technical"\n'
        f'  - "question": the interview question as a string\n\n'
        f"Do not include any text outside the JSON array."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful interview preparation assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
        )

        questions = _parse_json_response(response.choices[0].message.content)
        return questions

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Failed to parse response from OpenAI")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")


@app.post("/evaluate-answer", response_model=EvaluateResponse)
def evaluate_answer(req: EvaluateRequest):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    prompt = (
        f"You are an expert interview coach evaluating a candidate's answer.\n\n"
        f"Question type: {req.question_type}\n"
        f"Question: {req.question}\n\n"
        f"Candidate's answer:\n{req.answer}\n\n"
        f"Evaluate the answer and respond ONLY with a JSON object containing:\n"
        f'  - "score": a number from 1 to 10\n'
        f'  - "strengths": an array of 2-3 specific strengths in the answer\n'
        f'  - "improvements": an array of 2-3 specific suggestions for improvement\n\n'
        f"Do not include any text outside the JSON object."
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a helpful interview preparation assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
        )

        result = _parse_json_response(response.choices[0].message.content)
        return result

    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Failed to parse response from OpenAI")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API error: {str(e)}")