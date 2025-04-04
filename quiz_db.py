import random
import streamlit as st
import copy
import os
import json

from dto import Question

def initialize_quiz():
    json_datas = []
    for file_name in os.listdir("questions"):
        if file_name.endswith(".json"):
            with open(f"questions/{file_name}", "r", encoding="utf-8") as f:
                json_datas.extend(json.load(f))
    random.shuffle(json_datas)

    quiz_data = []
    for q in json_datas:
        items = copy.deepcopy(q["answers"])
        random.shuffle(items)
        items = [(f"{chr(ord('A') + i)}. {item[0]}", item[1]) for i, item in enumerate(items)]
        quiz_data.append(
            Question(
                question=q["question"],
                answers=items,
                level=q.get('level', 0),
                explain=q['explain']
            )
        )
    st.session_state.quiz_data = quiz_data

def get_quiz(index) -> Question | None:
    if "quiz_data" not in st.session_state:
        initialize_quiz()

    if index >= len(st.session_state.quiz_data):
        return None
    return st.session_state.quiz_data[index]

def get_total_count():
    if "quiz_data" not in st.session_state:
        initialize_quiz()
    return len(st.session_state.quiz_data)
