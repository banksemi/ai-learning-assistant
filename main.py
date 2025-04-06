import streamlit as st

from dto import Question
from quiz_db import get_quiz, get_total_count, initialize_quiz


def show_question():
    idx = st.session_state.get("current_question_idx", 0)
    q_data = get_quiz(idx)
    total_questions = get_total_count()

    rate = 0
    if idx > 0:
        rate = round(st.session_state.correct_count / idx * 100)

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

    if idx < total_questions:
        answers = q_data.answers

        st.write(f"**Question {idx + 1}.** {q_data.question}")

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
                st.session_state.current_question_idx += 1
                st.rerun()
            else:
                if not selected:
                    st.warning("Please select at least one answer.")
                else:
                    st.session_state.selected = selected
        if st.session_state.get('selected', None):
            process_result(q_data, st.session_state.selected)

            prompt = f"""
            An AI designed to help users effectively learn and master problems.
    
            ## question
            {q_data.question}
    
            ## Correct answer candidate
            {[i[0] for i in q_data.answers]}
            """
            from urllib.parse import quote
            url_encoded = quote(prompt)
            st.link_button("GPT", url=f'http://chatgpt.com/?model=gpt-4o&q={url_encoded}')
    else:
        st.success("You have completed all the questions!")

        if st.button("Try again"):
            reset_session()


def process_result(q_data: Question, selected):
    answer = [i for i, item in enumerate(q_data.answers) if item[1] == True]
    if answer == selected:
        st.session_state.correct_count += 1
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
        st.session_state.correct_count = 0

    st.set_page_config(page_title="Question bank", layout="centered")
    st.title("Question bank")
    show_question()


if __name__ == "__main__":
    main()