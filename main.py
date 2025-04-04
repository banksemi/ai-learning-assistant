import random
import streamlit as st
import copy
import os
import json


def initialize_quiz():
    question_bank = []
    for file_name in os.listdir("questions"):
        if file_name.endswith(".json"):
            with open(f"questions/{file_name}", "r", encoding="utf-8") as f:
                question_bank.extend(json.load(f))
    shuffled_questions = question_bank[:]
    random.shuffle(shuffled_questions)

    quiz_data = []
    for q in shuffled_questions:
        items = copy.deepcopy(q["answers"])
        random.shuffle(items)
        items = [(f"{chr(ord('A') + i)}. {item[0]}", item[1]) for i, item in enumerate(items)]

        quiz_data.append({
            "question": q["question"],
            "explain": q['explain'],
            "level": q.get('level', 0),
            "answers": items,
        })

    st.session_state.quiz_data = quiz_data
    st.session_state.selected = None
    st.session_state.current_question_idx = 0
    st.session_state.correct_count = 0


def show_question():
    idx = st.session_state.current_question_idx
    quiz_data = st.session_state.quiz_data
    total_questions = len(quiz_data)

    paa = 0
    if idx > 0:
        paa = round(st.session_state.correct_count / (idx) * 100)

    level = 0
    if idx < total_questions:
        level = quiz_data[idx]["level"]

    st.markdown(
        f"""  
        <p style='font-size:0.95rem; margin-bottom:0.3rem;'>
            <strong>Question {idx + 1}/{total_questions}</strong>  
            |  Difficulty {level}%  
            |  Current Correct Rate {paa}%  
        </p>        """,
        unsafe_allow_html=True
    )
    st.progress(idx / total_questions)

    if idx < total_questions:
        q_data = quiz_data[idx]
        question_text = q_data["question"]
        answers = q_data["answers"]

        st.write(f"**Question {idx + 1}.** {question_text}")

        if sum([i[1] for i in answers]) == 1:
            user_choice = st.radio(
                label="Please choose the correct answer:",
                options=[i[0] for i in answers],
                index=None,
                key=f"radio_q{idx}"
            )
            selected = []
            if user_choice:
                selected_label = user_choice.split('.')[0]  # "A"
                selected.append(ord(selected_label) - ord('A'))

        else:
            selected = []
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
            if st.session_state.selected:
                st.session_state.selected = None
                st.session_state.current_question_idx += 1
                st.rerun()
            else:
                if not selected:
                    st.warning("Please select at least one answer.")
                else:
                    st.session_state.selected = selected

        if st.session_state.selected:
            process_result(q_data, st.session_state.selected)
    else:
        st.success("You have completed all the questions!")

        if st.button("Try again"):
            reset_session()


def process_result(q_data, selected):
    answer = [i for i, item in enumerate(q_data['answers']) if item[1] == True]
    if answer == selected:
        st.session_state.correct_count += 1
        st.success("✅ Correct answer!")
    else:
        message = [i[0] for i in q_data['answers'] if i[1]]
        message = f'❌  Incorrect answer! (Correct answer: {", ".join(message)})'
        st.error(message.strip())

    st.info("##### Explanation\n" + q_data["explain"])


def reset_session():
    for key in list(st.session_state.keys()):
        del st.session_state[key]
    st.rerun()


def main():
    st.set_page_config(page_title="Question bank", layout="centered")
    st.title("Question bank")

    if "quiz_data" not in st.session_state:
        initialize_quiz()

    show_question()


if __name__ == "__main__":
    main()