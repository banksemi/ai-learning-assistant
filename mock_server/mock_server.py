from flask import Flask, request, jsonify, abort
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


title = "AWS-DVA-C02"
questions = [
    {
        "question_id": 1,
        "text": "다음 중 올바른것은? `code`\n```python\nprint('1')\n123\n```",
        "answer_count": 1,
        "options": ["111", "222", "333", "```python\n444\n123\n```"]
    },
    {
        "question_id": 2,
        "text": "다음 중 올바른것은?",
        "answer_count": 2,
        "options": ["111", "222", "333", "3", "5"]
    }
]

@app.route('/api/1/question-banks', methods=['GET'])
def get_question_banks():
    return jsonify({
        "total": 1,
        "data": [
            {
                'question_bank_id': 1,
                'text': 'Udemy - AWS-DVA-C02',
                'questions': 350,
            },
            {
                'question_bank_id': 2,
                'text': 'Udemy - AWS-CLF-C02',
                'questions': 5,
            }
        ]
    })

@app.route('/api/1/exams', methods=['POST'])
def create_exam():
    return jsonify({"exam_id": 1})

@app.route('/api/1/exams/<int:exam_id>/questions', methods=['GET'])
def list_questions(exam_id):
    return jsonify({"total": len(questions), "data": questions})

@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/answer', methods=['POST'])
def submit_answer(exam_id, question_id):
    data = request.get_json() or {}
    user_answers = data.get('user_answers')
    if user_answers is None:
        return jsonify({"error": "user_answers가 필요합니다."}), 400

    actual = ["B", "C"]
    explanation = "**정답 설명**: B와 C가 정답입니다. 이유는..."
    return jsonify({"actual_answers": actual, "explanation": explanation})

@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/marker', methods=['POST'])
def add_marker(exam_id, question_id):
    return ('', 204)

@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/marker', methods=['DELETE'])
def remove_marker(exam_id, question_id):
    return ('', 204)

@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/chat', methods=['POST'])
def chat_question(exam_id, question_id):
    data = request.get_json() or {}
    user_msg = data.get('user')
    if not user_msg:
        return jsonify({"error": "user 메시지가 필요합니다."}), 400

    assistant = f"문제 {question_id} 관련 질문을 받았습니다. 어떻게 도와드릴까요?"
    return jsonify({"assistant": assistant})

@app.route('/api/1/exams/<int:exam_id>/result', methods=['GET'])
def exam_result(exam_id):
    return jsonify({
  "correct_questions": 2,
  "total_questions": 10,
  "summary": """# AWS DVA-C02 시험 결과 분석 및 조언
- **IAM 정책 및 권한 관리** 문제에서 정답률이 낮게 나타났습니다. 특히, 역할(Role) 기반의 접근 제어 설정 시 정책 조건이나 신뢰 관계 설정 부분에서 혼동이 있었던 것으로 보입니다.
- **Lambda 및 서버리스 아키텍처** 관련 문제에서도 일부 어려움을 겪으셨습니다. 이벤트 기반 트리거 설정과 Lambda 함수의 성능 최적화, 환경 변수 사용 방법 등 세부 항목에서 실수가 확인되었습니다.

# 권장 학습 전략
- **IAM 및 권한 관리**: IAM 역할 및 정책 구성에 대한 AWS 공식 문서를 꼼꼼히 복습하고, 실제 시나리오 기반의 연습 문제를 추가로 풀이하는 것이 좋습니다.
- **Lambda 및 서버리스**: 서버리스 아키텍처 설계 원칙 및 이벤트 기반 트리거에 대해 좀 더 심화 학습을 진행하십시오. 특히 CloudWatch Events, API Gateway와의 연동 부분을 다시 한번 확인해 보시기 바랍니다.

전반적으로 개념 자체는 잘 이해하고 계시나, 세부 설정 및 실무 응용에서 혼동이 있는 만큼 해당 부분을 중심으로 집중 보완하시면 더욱 좋은 결과를 얻으실 수 있습니다.
"""}
    )

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)  # 디폴트 포트 설정