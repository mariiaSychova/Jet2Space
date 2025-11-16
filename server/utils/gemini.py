import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

try:
    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not found. Please set it in your .env file.")
    genai.configure(api_key=api_key)
    print("Gemini client configured successfully.")
except Exception as e:
    print(f"Error initializing Gemini client: {e}")

SYSTEM_PROMPT = """
You are an assistant that creates multiple-choice questions.
The user will provide a planet's description and a list of specific facts.
You must generate one (1) multiple-choice question that is based *specifically* on one or more of the provided facts.
You MUST respond ONLY with a single JSON object in the following exact format:
{
  "question": "The question text here",
  "options": {
    "a": "Option A text",
    "b": "Option B text",
    "c": "Option C text"
  },
  "answer": "The key of the correct option (e.g., 'a', 'b', 'c')"
}
Do not include any other text, explanations, or markdown formatting outside of this single JSON object.
"""

MAX_RETRIES = 3

def _validate_question_format(data: dict) -> bool:
    if not all(key in data for key in ["question", "options", "answer"]):
        print("Validation Error: Missing top-level keys")
        return False
    
    if not isinstance(data["question"], str):
        print("Validation Error: 'question' is not a string")
        return False
        
    if not isinstance(data["options"], dict):
        print("Validation Error: 'options' is not a dictionary")
        return False
    
    if not all(key in data["options"] for key in ["a", "b", "c"]):
        print("Validation Error: Missing 'a', 'b', or 'c' in options")
        return False
        
    if not isinstance(data["answer"], str) or data["answer"] not in ["a", "b", "c"]:
        print("Validation Error: 'answer' is not a valid key (a, b, or c)")
        return False
        
    return True

def get_planet_question(description: str, facts: list[str]):
    if not os.environ.get("GOOGLE_API_KEY"):
         raise Exception("Gemini client is not initialized. Check API key.")

    facts_list_str = "\n".join([f"- {fact}" for fact in facts])

    user_prompt = f"""
    Planet Description:
    {description}

    Facts to base the question on:
    {facts_list_str}
    """
    
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        system_instruction=SYSTEM_PROMPT
    )
    
    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
        temperature=0.7
    )

    for attempt in range(MAX_RETRIES):
        print(f"Gemini API call attempt {attempt + 1} of {MAX_RETRIES}...")

        try:
            response = model.generate_content(
                user_prompt,
                generation_config=generation_config
            )

            response_content = response.text
            question_data = json.loads(response_content)
            
            if _validate_question_format(question_data):
                print("Validation successful.")
                return question_data 
            else:
                print(f"Invalid format received from AI on attempt {attempt + 1}")

        except json.JSONDecodeError:
            print(f"JSONDecodeError on attempt {attempt + 1}: AI did not return valid JSON.")
        except Exception as e:
            print(f"An unexpected error occurred during API call: {e}")
            if hasattr(e, 'response') and hasattr(e.response, 'prompt_feedback'):
                print(f"Prompt Feedback: {e.response.prompt_feedback}")
            break 
    
    raise Exception(f"Failed to get a valid question from Gemini after {MAX_RETRIES} attempts.")