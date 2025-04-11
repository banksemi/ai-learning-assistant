from openai import OpenAI
import json
client = OpenAI()


class Assistant:
    def __init__(self, question, prompt):
        self.question = question
        self.messages = [{"role": "system", "content": prompt}]

    def add_user_message(self, message):
        self.messages.append({"role": "user", "content": message})

    def inference(self):
        response = client.responses.create(
            model="gpt-4o",
            input=self.messages,
            stream=True
        )
        result = ""
        for event in response:
            if event.type == 'response.output_text.delta':
                result += event.delta
                yield event.delta

        self.messages.append({"role": "assistant", "content": result})

    def get_answer(self) -> list[bool]:
        prompt = f"""
            ## Question
            {self.question.question}

            ## Correct answer candidate
            {[i[0] for i in self.question.answers]}
        """

        response = client.responses.create(
            model="gpt-4o",
            input=[
                {"role": "system", "content": prompt},
            ],
            text={
                "format": {
                    "type": "json_schema",
                    "name": "answer",
                    "schema": {
                        "type": "object",
                        "properties": {
                            "answer": {
                                "type": "array",
                                "description": "List indicating the correctness of each item; true for correct answers.",
                                "items": {
                                    "type": "boolean"
                                }
                            },
                        },
                        "required": [
                            "answer",
                        ],
                        "additionalProperties": False
                    },
                    "strict": True
                },
            }
        )
        return json.loads(response.output_text)['answer']