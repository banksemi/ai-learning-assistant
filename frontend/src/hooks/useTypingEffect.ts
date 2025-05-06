import { useState, useEffect, useRef } from 'react';

/**
 * 텍스트에 타이핑 효과를 적용하는 커스텀 훅. (증분 업데이트 및 배치 따라잡기 기능)
 * @param targetText 최종적으로 표시될 전체 텍스트.
 * @param baseSpeed 문자당 기본 타이핑 속도 (밀리초). 기본값 30ms.
 * @param catchUpSpeed 따라잡기 시의 스텝 당 속도 (밀리초). 기본값 10ms.
 * @param catchUpThreshold 따라잡기 모드를 발동할 문자열 길이 차이. 기본값 15.
 * @param catchUpBatchSize 따라잡기 시 한 번에 추가할 최대 문자 수. 기본값 5.
 * @returns 현재까지 타이핑된 텍스트.
 */
export function useTypingEffect(
    targetText: string,
    baseSpeed: number = 30,
    catchUpSpeed: number = 10, // 따라잡기 스텝 간격
    catchUpThreshold: number = 15, // 이 길이 이상 차이나면 따라잡기
    catchUpBatchSize: number = 5 // 따라잡기 시 한 번에 추가할 글자 수
): string {
    const [displayedText, setDisplayedText] = useState('');
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const targetTextRef = useRef(targetText);
    // 현재 화면에 표시된 텍스트 길이를 추적 (ref 사용)
    const currentLengthRef = useRef(0);
    const prevTargetTextRef = useRef(targetText);

    // targetText prop이 변경될 때마다 ref 업데이트
    useEffect(() => {
        targetTextRef.current = targetText;
    }, [targetText]);

    useEffect(() => {
        // targetText가 이전과 다르고, 새로운 targetText가 현재 표시된 텍스트로 시작하지 않으면 리셋
        if (targetText !== prevTargetTextRef.current && !targetText.startsWith(displayedText)) {
            // console.log("Typing Effect: Resetting");
            setDisplayedText('');
            currentLengthRef.current = 0; // 길이 ref도 리셋
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        }
        prevTargetTextRef.current = targetText; // 이전 텍스트 업데이트

        // 타이핑 스케줄 함수
        const scheduleNextStep = () => {
            // 이전 타이머 클리어
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            const currentTargetLength = targetTextRef.current.length;
            const currentDisplayLength = currentLengthRef.current;

            // 현재 표시된 길이가 목표 길이보다 작으면 계속 진행
            if (currentDisplayLength < currentTargetLength) {
                const lengthDifference = currentTargetLength - currentDisplayLength;

                let charsToAdd = 1;
                let currentSpeed = baseSpeed;

                // 차이가 크면 배치 크기와 속도 조정
                if (lengthDifference > catchUpThreshold) {
                    charsToAdd = Math.min(lengthDifference, catchUpBatchSize); // 최대 배치 크기만큼 추가
                    currentSpeed = catchUpSpeed; // 빠른 속도 적용
                    // console.log(`Catching up: adding ${charsToAdd} chars at ${currentSpeed}ms`);
                } else {
                    // console.log(`Normal typing: adding ${charsToAdd} char at ${currentSpeed}ms`);
                }

                timeoutRef.current = setTimeout(() => {
                    const nextLength = Math.min(currentTargetLength, currentDisplayLength + charsToAdd);
                    // substring을 사용하여 상태 업데이트
                    setDisplayedText(targetTextRef.current.substring(0, nextLength));
                    currentLengthRef.current = nextLength; // 길이 ref 업데이트
                    timeoutRef.current = null; // 타이머 참조 제거
                    scheduleNextStep(); // 다음 스텝 스케줄링
                }, currentSpeed); // 계산된 속도 적용
            } else {
                // 타이핑 완료
                // console.log("Typing finished");
                timeoutRef.current = null;
            }
        };

        // 타이핑 시작 또는 재개
        scheduleNextStep();

        // Cleanup: 언마운트 시 타이머 제거
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
        // displayedText는 의존성 배열에서 제거하여, 오직 targetText나 speed 관련 파라미터 변경 시에만 effect가 재실행되도록 함
    }, [targetText, baseSpeed, catchUpSpeed, catchUpThreshold, catchUpBatchSize, displayedText]); // displayedText 추가하여 상태 변경 시 재확인

    return displayedText;
}
