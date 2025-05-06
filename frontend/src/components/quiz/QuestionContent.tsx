import React from 'react';
import MarkdownRenderer from '@/components/MarkdownRenderer'; // 공통 MarkdownRenderer 사용

interface QuestionContentProps {
  questionText: string;
}

const QuestionContent: React.FC<QuestionContentProps> = ({ questionText }) => {
  return (
    // MarkdownRenderer를 사용하고, 필요시 추가 스타일을 위해 className을 전달할 수 있습니다.
    // 여기서는 QuestionContent의 기존 스타일을 유지하기 위해 mt-1과 text-left를 전달합니다.
    <MarkdownRenderer content={questionText} className="mt-1 text-left" />
  );
};

export default QuestionContent;
