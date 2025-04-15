import json
import os
from google import genai
from pydantic import BaseModel

class JSONModel(BaseModel):
  answer: list[bool]

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
class Assistant:
    def __init__(self, question, prompt=None):
        self.question = question
        self.messages = [{"role": "system", "content": prompt}]
        self.chat = client.chats.create(model="gemini-2.0-flash")

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

            ## Correct answer candidate
            {[i[0] for i in self.question.answers]}
            
            Please read the question and choose the correct answer.
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
