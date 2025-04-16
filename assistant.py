import json
import os
from google import genai
from pydantic import BaseModel
import copy

class JSONModel(BaseModel):
  answer_numbers: list[str]

class TranslateModel(BaseModel):
  question: str
  answers: list[str]
  explain: str


client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
class Assistant:
    def __init__(self, question, prompt=None):
        self.question = question
        self.messages = [{"role": "system", "content": prompt}]
        self.chat = client.chats.create(model="gemini-2.0-flash")
	
    def translate(self):
        input_json = json.dumps({
            "question": self.question.question,
            'answers': [i[0] for i in self.question.answers],
            'explain': self.question.explain
        })
        prompt = f"""
			Please change the language to Korean. 
			However, technical or service terms and data values must remain original.
			Also, don't abbreviate all the detailed information (it may be required for the exam).
			
			## input
			```
			{input_json}
			```
        """
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt],
            config={
                'response_mime_type': 'application/json',
                'response_schema': TranslateModel
            }
        )
        ai_response = response.parsed
        translate_question = copy.deepcopy(self.question)
        translate_question.question = ai_response.question
        translate_question.explain = ai_response.explain
        for i, translated in enumerate(ai_response.answers):
            translate_question.answers[i] = (translated, self.question.answers[i][1])
        return translate_question
        
    def add_user_message(self, message):
        self.messages.append({"role": "user", "content": message})

    def inference(self):
        response = self.chat.send_message_stream(self.messages[-1]['content'])
        line = ''
        for chunk in response:
            line += chunk.text
            yield chunk.text

        self.messages.append({"role": "assistant", "content": line})

    def get_answer(self) -> set[str]:
        prompt = f"""
            ## Question
            {self.question.question}

            ## Candidate
            {[i[0] for i in self.question.answers]}
            
            Please read the question and find the appropriate answer.
            example: ["A", "C"]
        """
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt],
            config={
                'response_mime_type': 'application/json',
                'response_schema': JSONModel
            }
        )
        return set(response.parsed.answer_numbers)
