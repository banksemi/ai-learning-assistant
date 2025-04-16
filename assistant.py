import json
import os
from google import genai
from pydantic import BaseModel
import copy

class JSONModel(BaseModel):
  answer: list[bool]

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
        prompt = f"""
            ## `question`
            {self.question.question}

            ## `answers`
            {[i[0] for i in self.question.answers]}
            
            ## `explain`
            {self.question.explain}
            
			Please change the language to Korean. 
			However, technical or service terms and data values must remain original.
			Also, don't abbreviate all the detailed information (it may be required for the exam).
			
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

    def get_answer(self) -> list[bool]:
        prompt = f"""
            ## Question
            {self.question.question}

            ## Candidate
            {[i[0] for i in self.question.answers]}
            
            Please read the question and choose the appropriate answer.
            If there are 4 options, the length of 'answer' list must be 4.
            'answer' is the answer the user must choose. If the question asks for a negative answer, then the negative is true.
        """
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=[prompt],
            config={
                'response_mime_type': 'application/json',
                'response_schema': JSONModel
            }
        )
        return response.parsed.answer
