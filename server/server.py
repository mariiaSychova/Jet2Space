import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.gemini import get_planet_question

app = Flask(__name__)
CORS(app) 

@app.route('/generate-question', methods=['POST'])
def generate_question():
    try:
        data = request.get_json()
        description = data.get('description')
        facts = data.get('facts')

        if not description or not facts:
            return jsonify({"error": "Missing required fields: 'description' and 'facts' (must be an array)"}), 400
        
        if not isinstance(facts, list) or len(facts) == 0:
             return jsonify({"error": "'facts' must be a non-empty array of strings"}), 400

    except Exception as e:
        return jsonify({"error": f"Invalid JSON payload: {str(e)}"}), 400

    try:
        question_data = get_planet_question(description, facts)
        return jsonify(question_data), 200

    except Exception as e:
        print(f"Error calling AI service: {str(e)}")
        return jsonify({"error": f"Failed to generate question: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)

