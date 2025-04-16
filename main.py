import json
import streamlit as st
from urllib.parse import quote

from question import Question
from quiz_db import get_quiz, get_total_count
from assistant import Assistant

def show_question():
    idx = st.session_state.get("current_question_idx", 0)
    q_data = st.session_state.get(f'translated_{idx}', None)
    if q_data is None:
        q_data = Assistant(get_quiz(idx)).translate()
        st.session_state[f'translated_{idx}'] = q_data
        
    total_questions = get_total_count()

    rate = 0
    if idx > 0:
        rate = round(len(st.session_state.correct) * 100.0 / idx)

    st.markdown(
        f"""  
        <p style='font-size:0.95rem; margin-bottom:0.3rem;'>
            <strong>Total Questions {total_questions}</strong>  
            |  Difficulty {q_data.level}%  
            |  Current Correct Rate {rate}%  
        </p>        """,
        unsafe_allow_html=True
    )
    st.progress(idx / total_questions)

    if idx >= total_questions:
        st.success("You have completed all the questions!")
        if st.button("Try again"):
            reset_session()
        return
    answers = q_data.answers

    st.markdown(f"**Question {idx + 1}.** {q_data.question}")

    selected = []
    if sum([i[1] for i in answers]) == 1:
        user_choice = st.radio(
            label="Please choose the correct answer:",
            options=[i[0] for i in answers],
            index=None,
            key=f"radio_q{idx}"
        )
        if user_choice:
            selected_label = user_choice.split('.')[0]  # "A"
            selected.append(ord(selected_label) - ord('A'))

    else:
        for i, answer in enumerate(answers):
            cb_key = f"checkbox_q{idx}_{i}"
            is_checked = st.checkbox(
                label=answer[0],
                value=False,
                key=cb_key
            )
            if is_checked:
                selected.append(i)

    if st.button("Submit"):
        if st.session_state.get('selected', None):
            st.session_state.selected = None
            st.session_state.assistant = None
            st.session_state.current_question_idx += 1
            st.rerun()
        else:
            if not selected:
                st.warning("Please select at least one answer.")
            else:
                st.session_state.selected = selected

                with st.status("Verifying the question using AI...") as status:
                    ans = Assistant(get_quiz(idx)).get_answer()
                    if [i[1] for i in q_data.answers] != ans:
                        status.update(
                            label="The AI answer and the actual answer are different.", state="error", expanded=False
                        )
                    else:
                        status.update(
                            label="Pass", state="complete", expanded=False
                        )

    ai_click = None


    prompt = f"""
    사용자가 문제를 잘 학습할 수 있도록 돕는 AI 입니다. 어려운 AWS 용어나 개념을 친철하게 풀어서 설명해주세요.
    또한 헷갈릴 수 있는 포인트 혹은 AWS-DVA 시험을 준비할 때 놓치면 안되는 포인트를 이해하기 쉽도록 정리해서 보여주세요.
    헤더를 사용하지 마세요.

    ## question
    {q_data.question}

    ## Correct answer candidate
    {[i[0] for i in q_data.answers]}
    """

    if st.session_state.get('selected', None):
        process_result(q_data, st.session_state.selected)
        ai_click = st.button("Get detailed explanations from AI")

    assistant: Assistant = st.session_state.get('assistant', None)
    if assistant:
        for i in assistant.messages:
            if i['role'] == 'system':
                continue
            with st.chat_message(i['role']):
                st.write(i['content'])

    if ai_click:
        assistant = Assistant(q_data, prompt)
        st.session_state.assistant = assistant

    if assistant:
        if message := st.chat_input("Please enter message."):
            with st.chat_message('user'):
                st.write(message)
            assistant.add_user_message(message)
            with st.chat_message('assistant'):
                st.write_stream(assistant.inference())

    if ai_click:
        with st.chat_message('assistant'):
            st.write_stream(assistant.inference())



def process_result(q_data: Question, selected):
    answer = [i for i, item in enumerate(q_data.answers) if item[1] == True]
    if answer == selected:
        st.session_state.correct.add(st.session_state.get("current_question_idx", 0))
        st.success("✅ Correct answer!")
    else:
        message = [i[0] for i in q_data.answers if i[1]]
        message = f'❌  Incorrect answer! (Correct answer: {", ".join(message)})'
        st.error(message.strip())

    st.info("##### Explanation\n" + q_data.explain)


def reset_session():
    for key in list(st.session_state.keys()):
        del st.session_state[key]
    st.rerun()


def main():
    if st.session_state.get('initialized') is None:
        st.session_state.initialized = True
        st.session_state.current_question_idx = 0
        st.session_state.correct = set()
        st.session_state.assistant = None

    st.set_page_config(page_title="Question bank", layout="centered")
    # st.title("Question bank")
    show_question()

if __name__ == "__main__":
    main()