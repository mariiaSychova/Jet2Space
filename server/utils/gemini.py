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
except Exception as e:
    print(f"Error initializing Gemini client: {e}")

SYSTEM_PROMPT = """
Ти асистент, який створює питання з вибором відповіді про планети.
ВАЖЛИВО: Ці питання призначені для дітей шкільного віку і використовуються з навчальною метою. 
Тому:
- Формулюй питання просто та зрозуміло, без складних термінів
- Відповіді мають бути короткими та зрозумілими для дітей
- Уникай надто складних наукових термінів, якщо можливо - пояснюй простіше
- Питання мають бути цікавими та навчальними, але доступними для розуміння дітьми

КРИТИЧНО ВАЖЛИВО: Кожен виклик API - це НОВИЙ, НЕЗАЛЕЖНИЙ запит. Ти ОБОВ'ЯЗКОВО маєш генерувати АБСОЛЮТНО РІЗНЕ питання кожного разу, навіть якщо вхідні дані схожі.

Правила для різноманітності:
1. НІКОЛИ не повторюй той самий текст питання, навіть якщо це про ту саму планету
2. Змінюй тип питання: використовуй "Що", "Як", "Чому", "Коли", "Де", "Який" випадково
3. Змінюй фокус: іноді питай про числа, іноді про порівняння, іноді про унікальні особливості
4. Змінюй складність: змішуй легкі та середні питання (не роби надто складними для дітей)
5. Змінюй формулювання: використовуй абсолютно різні фрази кожного разу
6. Випадково вибирай різні факти або різні аспекти опису кожного разу

Користувач надасть опис планети та список конкретних фактів.
Ти маєш згенерувати одне (1) питання з вибором відповіді, яке базується АБО на:
- описі планети ЛИШЕ, АБО
- одному з наданих фактів ЛИШЕ.
НЕ змішуй опис і факти в одному питанні.

Ти ОБОВ'ЯЗКОВО маєш відповісти ЛИШЕ одним JSON об'єктом у наступному точному форматі:
{
  "question": "Текст питання тут",
  "options": {
    "a": "Текст варіанту A",
    "b": "Текст варіанту B",
    "c": "Текст варіанту C"
  },
  "answer": "Ключ правильної відповіді (наприклад, 'a', 'b', 'c')"
}
Не включай жодного іншого тексту, пояснень або markdown форматування поза цим єдиним JSON об'єктом.
"""

MAX_RETRIES = 3

def _validate_question_format(data: dict) -> bool:
    if not all(key in data for key in ["question", "options", "answer"]):
        return False
    
    if not isinstance(data["question"], str):
        return False
        
    if not isinstance(data["options"], dict):
        return False
    
    if not all(key in data["options"] for key in ["a", "b", "c"]):
        return False
        
    if not isinstance(data["answer"], str) or data["answer"] not in ["a", "b", "c"]:
        return False
        
    return True

def get_planet_question(description: str, facts: list[str]):
    if not os.environ.get("GOOGLE_API_KEY"):
         raise Exception("Gemini client is not initialized. Check API key.")

    import random
    import time
    
    # Генеруємо унікальний ідентифікатор для цього запиту
    request_id = f"{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    
    # Випадково вибираємо різні підходи до генерації питання
    question_types = [
        "numerical_fact",  # Про числа, розміри, відстані
        "comparative",      # Порівняння з іншими планетами
        "atmospheric",     # Про атмосферу, клімат
        "physical",        # Фізичні характеристики
        "orbital",         # Про орбіту, обертання
        "composition",     # Про склад, структуру
        "discovery",       # Про відкриття, дослідження
        "unique_feature"   # Про унікальні особливості
    ]
    
    selected_type = random.choice(question_types)
    
    # Різні інструкції залежно від типу
    type_instructions = {
        "numerical_fact": "Зосередься на конкретних числах, вимірах, відстанях, розмірах або кількостях. Питай про точні значення або діапазони.",
        "comparative": "Порівняй цю планету з іншими. Питай про відмінності, подібності або рейтинги.",
        "atmospheric": "Зосередься на атмосфері, погоді, кліматі або складі атмосфери.",
        "physical": "Питай про фізичні властивості, такі як щільність, маса, гравітація або особливості поверхні.",
        "orbital": "Зосередься на орбіті, обертанні, обертанні навколо Сонця, тривалості дня, тривалості року або орбітальних характеристиках.",
        "composition": "Питай про те, з чого складається планета, її внутрішню структуру або хімічний склад.",
        "discovery": "Зосередься на тому, коли вона була відкрита, хто її відкрив або як її досліджували.",
        "unique_feature": "Виділи щось унікальне, особливе або відмінне про цю планету, що виділяє її."
    }
    
    # Випадково вибираємо факт або опис
    use_description = random.choice([True, False])
    
    # Випадковий факт, якщо використовуємо facts
    selected_fact_index = random.randint(0, len(facts) - 1) if facts else None
    
    variation_hint = type_instructions[selected_type]
    
    # Додаємо додаткові інструкції для різноманітності
    diversity_instructions = [
        "Використовуй абсолютно інше формулювання, ніж у будь-якому попередньому питанні.",
        "Питай з іншого кута або перспективи.",
        "Зосередься на іншому аспекті або деталі.",
        "Використовуй іншу структуру питання (що, як, чому, коли, де).",
        "Акцентуй на іншому рівні деталей (загальний огляд проти конкретної деталі)."
    ]
    
    diversity_hint = random.choice(diversity_instructions)
    
    # Формуємо промпт з урахуванням вибраного типу
    if use_description and description:
        source_info = f"Базую своє питання на описі планети. {variation_hint}"
    elif facts and selected_fact_index is not None:
        source_info = f"Базую своє питання на факті №{selected_fact_index + 1} зі списку фактів. {variation_hint}"
    else:
        source_info = f"Базую своє питання на будь-якій доступній інформації. {variation_hint}"
    
    user_prompt = f"""
    ID запиту: {request_id}
    Тип питання: {selected_type}
    
    {source_info}
    {diversity_hint}
    
    ВАЖЛИВО: Це НОВИЙ запит (ID: {request_id}). Ти ОБОВ'ЯЗКОВО маєш згенерувати АБСОЛЮТНО ІНШЕ питання, ніж у будь-якій попередній відповіді. 
    НЕ повторюй той самий текст питання, тему або фокус. Будь креативним і змінюй все.
    
    ПАМ'ЯТАЙ: Питання для дітей шкільного віку - формулюй просто, зрозуміло, без складних термінів.
    Відповіді мають бути короткими та доступними для розуміння дітьми.
    
    Опис планети:
    {description}

    Факти для формування питання:
    {chr(10).join([f"{i+1}. {fact}" for i, fact in enumerate(facts)])}
    
    Згенеруй унікальне, інше питання зараз. Повністю зміни формулювання, тему, фокус і підхід.
    Питання має бути цікавим для дітей, але не надто складним.
    """
    
    model = genai.GenerativeModel(
        'gemini-2.5-flash',
        system_instruction=SYSTEM_PROMPT
    )

    generation_config = genai.GenerationConfig(
        response_mime_type="application/json",
        temperature=1.2,  # Максимальна температура для максимальної різноманітності
        top_p=0.95,       # Додатковий параметр для різноманітності
        top_k=40         # Розширений вибір токенів
    )

    for attempt in range(MAX_RETRIES):
        try:
            response = model.generate_content(
                user_prompt,
                generation_config=generation_config
            )

            response_content = response.text
            question_data = json.loads(response_content)
            
            if _validate_question_format(question_data):
                return question_data

        except json.JSONDecodeError as e:
            if attempt == MAX_RETRIES - 1:
                print(f"Error: Failed to parse JSON response from Gemini API: {str(e)}")
        except Exception as e:
            if attempt == MAX_RETRIES - 1:
                print(f"Error: Unexpected error during Gemini API call: {e}")
                if hasattr(e, 'response') and hasattr(e.response, 'prompt_feedback'):
                    print(f"Prompt Feedback: {e.response.prompt_feedback}")
            break 
    
    raise Exception(f"Failed to get a valid question from Gemini after {MAX_RETRIES} attempts.")