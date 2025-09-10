# AI Learning Assistant

Supercharge your studies with AI. Turn any question dump into a personal learning assistant, available anytime, anywhere.

Demo Site: https://learning.ai.easylab.kr/

## Screenshots

| ![Screenshot 1](https://github.com/banksemi/ai-learning-assistant/blob/main/screenshots/1.png?raw=true) | ![Screenshot 2](https://github.com/banksemi/ai-learning-assistant/blob/main/screenshots/2.png?raw=true) |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| ![Screenshot 3](https://github.com/banksemi/ai-learning-assistant/blob/main/screenshots/3.png?raw=true) | ![Screenshot 4](https://github.com/banksemi/ai-learning-assistant/blob/main/screenshots/4.png?raw=true) |

## Features

This is an AI-integrated question bank application. It transforms a simple question dump into a personalized assistant to help you learn. Here are the key features:

- **Auto Translation**
    - Provides automatic translation so you can focus on core concepts in your native language. This eliminates the need to find question banks specifically in your language.
    - **Smart Caching**:
        - Enjoy a seamless experience without waiting for translations.
        - While you are solving a question, the server pre-fetches and caches translations for the upcoming questions.
        - It includes robust handling for concurrency issues like the "Cache Stampede" to ensure stable performance.
        - **Note:**A short wait is expected for the first question's translation. This is a deliberate design choice to avoid unnecessary LLM calls by not pre-translating the entire test at once.
- **Responsive Layout & Mobile Support**
    - The app features a responsive layout and is available as a mobile-friendly web app. Study without constraints of time or place, right from your device.
- **Per-Question AI Assistant**
    - After attempting a question, click the 'AI Feedback' button to start a conversation.
    - The assistant engages with you based on your answer, the correct answer, and the official explanation.
    - To stimulate deeper thinking, it automatically generates**preset questions**such as:
        - _"Why is my chosen option B incorrect?"_
        - _"Could this problem be solved with an alternative approach like ABC?"_
    - You can also ask any other questions you have, thanks to its LLM-powered conversational ability.
    - **Real-Time Streaming with SSE**:
        - Watch the AI's responses generate in real-time. We use Server-Sent Events (SSE) for a smooth, conversational experience.
- **AI-Powered Learning Reports**
    - Receive a personalized learning report upon completing a test.
    - The LLM analyzes all questions in the test—even those you didn't attempt—to generate more comprehensive and relevant feedback.
    - It identifies your mistake patterns to help you understand the root cause of your errors.
    - The report also considers questions you've**'marked' for review**, providing extra clarification on concepts you might be unsure about, even if you answered them correctly.
- **Markdown Support**
    - Questions and explanations support Markdown formatting, allowing for a wide variety of content types.
    - This is especially useful for technical subjects that require`code blocks`, tables, and other complex formatting.
