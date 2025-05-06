import { useEffect, useRef } from 'react';

/**
 * 펜 입력 감지 및 터치 종료 시 클릭 트리거를 위한 커스텀 훅.
 *
 * 이 훅은 'pointerdown' 이벤트를 사용하여 펜 입력을 감지하고,
 * 'touchend' 이벤트를 사용하여 펜으로 시작된 터치가
 * 시작 요소의 경계 내에서 종료되었는지 확인합니다.
 * 조건이 충족되면 해당 요소의 'click' 이벤트를 프로그래밍 방식으로 트리거합니다.
 *
 * @remarks
 * 이 방식은 표준 포인터 이벤트나 터치 이벤트 모델을 직접 따르지 않는
 * 하이브리드 접근 방식입니다. 특정 시나리오(예: 일부 드로잉 라이브러리와의 통합)를
 * 위해 설계되었으며, 모든 브라우저나 기기에서 동일하게 작동하지 않을 수 있습니다.
 * 특히 포인터 이벤트와 터치 이벤트 간의 상호작용은 복잡할 수 있습니다.
 */
export function usePenInputHandler(): void { // Renamed from usePenTouchClick
  // Ref: 펜으로 'pointerdown' 이벤트가 발생한 요소를 저장합니다.
  const penDownElementRef = useRef<Element | null>(null);

  // Handler: 'pointerdown' 이벤트 처리
  // 포인터 타입이 'pen'인 경우에만 대상 요소를 ref에 저장합니다.
  const handlePointerDown = (e: PointerEvent): void => {
    if (e.pointerType === 'pen') {
      penDownElementRef.current = e.target as Element;
      // console.log('[usePenInputHandler] Pen Pointer Down:', e.target); // 디버깅 로그
    } else {
      // 펜 입력이 아니면 ref를 초기화하여 'touchend'에서 처리되지 않도록 합니다.
      penDownElementRef.current = null;
      // console.log('[usePenInputHandler] Non-Pen Pointer Down:', e.pointerType); // 디버깅 로그
    }
  };

  // Handler: 'touchend' 이벤트 처리
  // 'pointerdown'이 펜으로 시작되었고, 터치 종료 지점이 시작 요소 경계 내에 있는지 확인합니다.
  const handleTouchEnd = (e: TouchEvent): void => {
    const startElement = penDownElementRef.current;
    // console.log('[usePenInputHandler] Touch End:', e.target); // 디버깅 로그

    // 펜으로 시작된 유효한 요소가 없거나 클릭 불가능한 요소면 처리 중단
    if (!startElement || typeof (startElement as HTMLElement).click !== 'function') {
      // console.log('[usePenInputHandler] Touch End: No valid pen start element.'); // 디버깅 로그
      penDownElementRef.current = null; // ref 초기화
      return;
    }

    // 터치 종료 좌표 확인 (changedTouches 사용)
    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      const touchX = touch.clientX;
      const touchY = touch.clientY;

      // 시작 요소의 경계 계산
      const rect = startElement.getBoundingClientRect();

      // 터치 종료 지점이 시작 요소 경계 내에 있는지 확인
      const isInside = touchX >= rect.left && touchX <= rect.right &&
                       touchY >= rect.top && touchY <= rect.bottom;

      if (isInside) {
        // console.log('[usePenInputHandler] Touch End: Inside pen start element. Clicking.'); // 디버깅 로그
        // 기본 터치 동작(스크롤, 확대 등) 방지
        e.preventDefault();
        // 시작 요소의 클릭 이벤트 트리거
        (startElement as HTMLElement).click();
      } else {
        // console.log('[usePenInputHandler] Touch End: Outside pen start element.'); // 디버깅 로그
      }
    } else {
      // console.log('[usePenInputHandler] Touch End: No changedTouches.'); // 디버깅 로그
    }

    // 중요: 'touchend' 처리 후 항상 ref를 초기화합니다.
    // 다음 상호작용이 펜이 아닐 경우의 문제를 방지합니다.
    penDownElementRef.current = null;
  };

  // Effect: 컴포넌트 마운트 시 이벤트 리스너 등록, 언마운트 시 제거
  useEffect(() => {
    // 'pointerdown' 리스너 등록 (passive: true 가능)
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    // 'touchend' 리스너 등록 (passive: false 필요 - preventDefault 호출 때문)
    window.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup: 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchend', handleTouchEnd);
      // console.log('[usePenInputHandler] Event listeners removed.'); // 디버깅 로그
    };
  }, []); // 빈 의존성 배열: 마운트 시 한 번만 실행
}
