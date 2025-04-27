# app.py
from flask import Flask, request, jsonify, Response, abort
from flask_cors import CORS
from functools import wraps
import base64

# Flask 앱 초기화
app = Flask(__name__)
# 모든 도메인 및 모든 경로에 대해 CORS 허용
CORS(app, resources={r"/api/*": {"origins": "*"}})

# --- 고정된 더미 데이터 ---

# 샘플 문제 데이터 (question_id를 0부터 시작하도록 조정)
# 주의: 실제 API 경로의 {question_id}와 내부 데이터의 'question_id'를 일치시킵니다.
sample_questions = [
    {
        "question_id": 0, # 0부터 시작
        "text": "[Sample] EC2 인스턴스에서 실행되는 애플리케이션이 임시 자격 증명을 안전하게 얻어 다른 AWS 서비스에 접근하도록 하는 가장 권장되는 방법은 무엇입니까?",
        "options": [
            {"key": "A", "value": "액세스 키 ID와 시크릿 액세스 키를 코드에 하드코딩합니다."},
            {"key": "B", "value": "IAM 역할을 EC2 인스턴스에 연결합니다."},
            {"key": "C", "value": "루트 사용자 자격 증명을 사용합니다."},
            {"key": "D", "value": "EC2 인스턴스 메타데이터 서비스 사용을 비활성화합니다."}
        ],
        "answer_count": 1, # 정답 개수
        "actual_answers": ["B"], # 실제 정답 키
        "explanation": "[Sample] IAM 역할을 EC2 인스턴스에 연결하면, 애플리케이션은 AWS SDK 또는 CLI를 통해 자동으로 임시 자격 증명을 받아 안전하게 다른 AWS 서비스에 접근할 수 있습니다. 하드코딩된 자격 증명은 보안 위험이 높습니다."
    },
    {
        "question_id": 1, # 0부터 시작
        "text": "[Sample] 정적 웹 사이트 호스팅을 위해 Amazon S3를 사용할 때, 사용자가 웹 사이트의 루트 도메인(예: example.com)으로 접근할 수 있도록 하려면 어떤 서비스를 추가로 사용해야 합니까?",
        "options": [
            {"key": "A", "value": "Amazon EC2"},
            {"key": "B", "value": "AWS Lambda"},
            {"key": "C", "value": "Amazon Route 53"},
            {"key": "D", "value": "Amazon CloudFront (필수는 아님)"}
        ],
        "answer_count": 1,
        "actual_answers": ["C"],
        "explanation": "[Sample] Amazon Route 53은 DNS 웹 서비스로, 도메인 이름을 IP 주소로 변환합니다. S3 버킷을 웹 사이트 엔드포인트로 사용하고 루트 도메인으로 접근하게 하려면 Route 53에서 해당 도메인에 대한 별칭(Alias) 레코드를 생성하여 S3 웹사이트 엔드포인트를 가리키도록 설정해야 합니다."
    },
    # 필요시 더 많은 샘플 문제 추가 가능
]

# 고정된 문제 은행 정보
fixed_question_bank = {
    "question_bank_id": 1,
    "title": "AWS Certified Developer - Associate (DVA-C02) Mock Sample",
    "questions": len(sample_questions) # 실제 문제 수 반영
}

# --- 관리자 인증 ---
ADMIN_USER = 'admin'
ADMIN_PASSWORD = 'password'

def check_auth(username, password):
    """사용자 이름과 비밀번호 확인"""
    return username == ADMIN_USER and password == ADMIN_PASSWORD

def authenticate(message="인증이 필요합니다."):
    """인증 실패 시 401 응답 전송"""
    return Response(
        jsonify(error_code="UNAUTHORIZED", message=message).get_data(as_text=True), 401,
        {'WWW-Authenticate': 'Basic realm="Login Required"'}
    )

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.authorization
        auth_header = request.headers.get('Authorization')

        if auth:
            if check_auth(auth.username, auth.password):
                return f(*args, **kwargs)
        elif auth_header and auth_header.startswith('Basic '):
            try:
                encoded_credentials = auth_header.split(' ')[1]
                decoded_credentials = base64.b64decode(encoded_credentials).decode('utf-8')
                username, password = decoded_credentials.split(':', 1)
                if check_auth(username, password):
                    return f(*args, **kwargs)
            except Exception:
                 return authenticate("잘못된 인증 형식입니다.")
        return authenticate()
    return decorated

# --- 표준 에러 응답 정의 ---
def make_error_response(error_code, message, status_code):
    return jsonify(error_code=error_code, message=message), status_code

# --- API 엔드포인트 (Mock 구현) ---

# [GET] /api/1/question-banks
@app.route('/api/1/question-banks', methods=['GET'])
def get_question_banks():
    """선택할 수 있는 문제 은행 종류 반환 (고정된 Mock 데이터)"""
    return jsonify({
        "total": 1,
        "data": [fixed_question_bank]
    })

# [POST] /api/1/exams
@app.route('/api/1/exams', methods=['POST'])
def create_exam():
    """시험 문제 생성 요청 (고정된 Mock 응답)"""
    data = request.get_json()

    # 간단한 요청 형식 검증 (필요시)
    if not data or 'question_bank_id' not in data or 'language' not in data or 'questions' not in data:
        return make_error_response("BAD_REQUEST", "요청 본문에 'question_bank_id', 'language', 'questions' 필드가 필요합니다.", 400)
    if data.get('question_bank_id') != fixed_question_bank['question_bank_id']:
         # 고정된 문제 은행 ID만 허용 (선택 사항)
         return make_error_response("RESOURCE_NOT_FOUND", f"문제 은행 ID {data.get('question_bank_id')}를 찾을 수 없습니다 (Mock 서버는 ID 1만 지원).", 404)

    # 항상 고정된 exam_id 반환
    return jsonify({"exam_id": 1}), 201

# [GET] /api/1/exams/{exam_id}/total_questions
@app.route('/api/1/exams/<int:exam_id>/total_questions', methods=['GET'])
def get_total_questions(exam_id):
    """시험의 총 문제 수 반환 (고정된 Mock 데이터)"""
    # exam_id 값은 사용하지 않음
    return jsonify({"total_questions": 10}) # 명세에 맞게 고정된 값 반환

# [GET] /api/1/exams/{exam_id}/questions/{question_id}
@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>', methods=['GET'])
def get_question(exam_id, question_id):
    """문제 정보 읽어오기 (고정된 Mock 데이터, question_id 0부터 시작)"""
    # exam_id 값은 사용하지 않음

    # 요청된 question_id (0부터 시작)에 해당하는 샘플 문제 찾기
    target_question = None
    for q in sample_questions:
        if q["question_id"] == question_id:
            target_question = q
            break

    if target_question:
        # 응답 형식에 맞게 데이터 추출 (actual_answers, explanation 제외)
        response_data = {
            "question_id": target_question["question_id"],
            "title": target_question["text"],
            "answer_count": target_question["answer_count"],
            "options": target_question["options"],
            "marker": False, # 항상 false로 고정 (Mock)
        }
        return jsonify(response_data)
    else:
        # 요청한 question_id에 해당하는 샘플 문제가 없을 경우
        return make_error_response("RESOURCE_NOT_FOUND", f"문제 ID {question_id}를 찾을 수 없습니다 (Mock 서버는 0부터 {len(sample_questions)-1}까지 지원).", 404)

# [POST] /api/1/exams/{exam_id}/questions/{question_id}/answer
@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/answer', methods=['POST'])
def submit_answer(exam_id, question_id):
    """시험 결과(답변) 입력 (고정된 Mock 응답)"""
    # exam_id, question_id, 요청 본문 값은 사용하지 않음
    data = request.get_json()
    if not data or 'user_answers' not in data:
         return make_error_response("BAD_REQUEST", "요청 본문에 'user_answers' 필드가 필요합니다.", 400)

    # 요청된 question_id에 해당하는 샘플 문제의 정답/설명 반환
    target_question = None
    for q in sample_questions:
        if q["question_id"] == question_id:
            target_question = q
            break

    if target_question:
        return jsonify({
            "actual_answers": target_question["actual_answers"],
            "explanation": target_question["explanation"]
        }), 200
    else:
        # 문제가 없는 경우라도 고정 응답 반환 (또는 404 에러)
        # 여기서는 첫 번째 문제의 답으로 고정 응답
        return jsonify({
            "actual_answers": sample_questions[0]["actual_answers"] if sample_questions else ["B"],
            "explanation": sample_questions[0]["explanation"] if sample_questions else "[Sample] 고정된 설명입니다."
        }), 200

# [POST] /api/1/exams/{exam_id}/questions/{question_id}/marker
@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/marker', methods=['POST'])
def mark_question(exam_id, question_id):
    """북마크 표시 (항상 성공 Mock)"""
    # exam_id, question_id 값은 사용하지 않음
    return '', 204 # No Content

# [DELETE] /api/1/exams/{exam_id}/questions/{question_id}/marker
@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/marker', methods=['DELETE'])
def unmark_question(exam_id, question_id):
    """북마크 제거 (항상 성공 Mock)"""
    # exam_id, question_id 값은 사용하지 않음
    return '', 204 # No Content

# [POST] /api/1/exams/{exam_id}/questions/{question_id}/chat
@app.route('/api/1/exams/<int:exam_id>/questions/<int:question_id>/chat', methods=['POST'])
def chat_with_ai(exam_id, question_id):
    """AI 채팅 (고정된 Mock 응답)"""
    # exam_id, question_id, 요청 본문 값은 사용하지 않음
    data = request.get_json()
    if not data or 'user' not in data:
       return make_error_response("BAD_REQUEST", "요청 본문에 'user' 필드가 필요합니다.", 400)

    user_message = data.get('user', '') # 메시지는 받지만 사용 안 함

    # 항상 고정된 응답 반환
    return jsonify({"assistant": f"[Sample] '{user_message}'에 대한 고정된 AI 답변입니다."})

# [GET] /api/1/exams/{exam_id}/result
@app.route('/api/1/exams/<int:exam_id>/result', methods=['GET'])
def get_exam_result(exam_id):
    """시험 결과 요약 반환 (고정된 Mock 데이터)"""
    # exam_id 값은 사용하지 않음

    # 고정된 결과 데이터 생성 (question_id 0부터 시작)
    # sample_questions 데이터를 활용하여 현실적인 Mock 데이터 생성
    marked_list = []
    incorrect_list = []

    if len(sample_questions) > 0:
        q0 = sample_questions[0]
        marked_list.append({
             "question_id": q0["question_id"],
             "title": q0["text"],
             "options": q0["options"],
             "user_answers": ["A"], # 임의의 사용자 답
             "actual_answers": q0["actual_answers"],
             "explanation": q0["explanation"]
        })
        incorrect_list.append({
             "question_id": q0["question_id"],
             "title": q0["text"],
             "options": q0["options"],
             "user_answers": ["A"], # 임의의 사용자 답 (틀린 답)
             "actual_answers": q0["actual_answers"],
             "explanation": q0["explanation"]
        })
    if len(sample_questions) > 1:
         q1 = sample_questions[1]
         incorrect_list.append({
             "question_id": q1["question_id"],
             "title": q1["text"],
             "options": q1["options"],
             "user_answers": ["B"], # 임의의 사용자 답 (틀린 답)
             "actual_answers": q1["actual_answers"],
             "explanation": q1["explanation"]
         })

    return jsonify({
        "correct_questions": 2, # 고정 값
        "total_questions": 10, # 고정 값
        "summary": "[Sample] 전반적으로 몇몇 AWS 핵심 서비스 개념이 부족합니다. 오답 노트를 통해 복습이 필요합니다.", # 고정 문구
        "questions": {
            "marked": marked_list, # 첫 번째 문제만 북마크된 것으로 가정
            "incorrect": incorrect_list # 첫 번째, 두 번째 문제가 틀린 것으로 가정
        }
    })

# --- 관리자 API 엔드포인트 (Mock 구현) ---

# [POST] /api/1/question-banks
@app.route('/api/1/question-banks', methods=['POST'])
@admin_required
def create_question_bank():
    """문제 은행 생성 (관리자, Mock 응답)"""
    data = request.get_json()
    if not data or 'title' not in data:
         return make_error_response("BAD_REQUEST", "요청 본문에 'title' 필드가 필요합니다.", 400)

    return jsonify({'question_bank_id': 10}), 201

@app.route('/api/1/login', methods=['POST'])
def check_password():
    """문제 은행 생성 (관리자, Mock 응답)"""
    data = request.get_json()
    if data['password'] == ADMIN_PASSWORD:
        return jsonify({}), 200
    else:
        return make_error_response("PASSWORD_ERROR", "비밀번호가 올바르지 않습니다.", 403)

# [POST] /api/1/question-banks/{question_bank_id}/questions
@app.route('/api/1/question-banks/<int:question_bank_id>/questions', methods=['POST'])
@admin_required
def add_question_to_bank(question_bank_id):
    """문제 은행에 문제 추가 (관리자, Mock 응답)"""
    # question_bank_id는 형식상 받지만 고정된 은행 ID(1) 외에는 404 반환 가능
    if question_bank_id != fixed_question_bank['question_bank_id']:
        return make_error_response("RESOURCE_NOT_FOUND", f"문제 은행 ID {question_bank_id}를 찾을 수 없습니다 (Mock 서버는 ID 1만 지원).", 404)

    data = request.get_json()
    # 간단한 요청 형식 검증 (text, options 존재 여부 등)
    if not data or 'text' not in data or 'options' not in data:
         return make_error_response("BAD_REQUEST","요청 본문에 'text'와 'options' 필드가 필요합니다.", 400)
    # Mock 이므로 실제 추가 로직 없음, 항상 성공 반환
    return '', 201

# --- 에러 핸들러 (Flask 기본 오류 처리) ---
@app.errorhandler(404)
def resource_not_found(e):
    # Flask 가 라우트를 찾지 못했을 때 호출됨
    return make_error_response("RESOURCE_NOT_FOUND", "요청한 경로(API 엔드포인트)를 찾을 수 없습니다.", 404)

@app.errorhandler(405)
def method_not_allowed(e):
    # 해당 경로에 대해 지원하지 않는 HTTP 메소드로 요청했을 때 호출됨
    return make_error_response("METHOD_NOT_ALLOWED", "허용되지 않는 요청 메소드입니다.", 405)

@app.errorhandler(400)
def handle_bad_request(e):
    # request.get_json() 실패 등 Flask 내부에서 발생하는 400 오류 처리
    message = "잘못된 요청입니다."
    if hasattr(e, 'description') and e.description:
        message = e.description
    return make_error_response("BAD_REQUEST", message, 400)

@app.errorhandler(Exception)
def handle_exception(e):
    # 위에서 처리되지 않은 모든 예외 처리 (500 Internal Server Error)
    print(f"Unhandled Exception: {e}")
    import traceback
    traceback.print_exc()
    return make_error_response("INTERNAL_SERVER_ERROR", "서버 내부 오류가 발생했습니다.", 500)

# --- 메인 실행 ---
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)