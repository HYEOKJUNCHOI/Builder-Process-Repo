import React, { useState, useRef, useEffect } from 'react';
import * as S from './CustomSelect.style';

/**
 * 커스텀 드롭다운 컴포넌트
 * - 네이티브 <select>를 대체하여 목록 팝업에 라운드/스타일 제어 가능
 * - value / onChange API는 네이티브 select 형식과 동일하게 사용
 *
 * @param {string|number} value     - 현재 선택된 값
 * @param {function}      onChange  - 값 변경 콜백 (e.target.value 형식)
 * @param {Array}         options   - [{ value, label }] 배열
 * @param {string}        data-qa   - DevTools 식별용 data-qa 속성
 * @param {object}        style     - 인라인 스타일 (선택)
 */
export default function CustomSelect({ value, onChange, options = [], style, 'data-qa': dataQa }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  /* 컨테이너 외부 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedOption = options.find((o) => String(o.value) === String(value));

  /* onChange를 네이티브 select의 e.target.value 형태로 통일 */
  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <S.Container ref={containerRef} style={style} data-qa={dataQa}>
      {/* 트리거: 클릭 시 목록 토글 */}
      <S.Trigger
        type="button"
        isOpen={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <S.TriggerLabel>{selectedOption?.label ?? '선택'}</S.TriggerLabel>
        <S.Arrow isOpen={isOpen} />
      </S.Trigger>

      {/* 라운드 있는 드롭다운 목록 */}
      {isOpen && (
        <S.DropdownList>
          {options.map((option) => (
            <S.DropdownItem
              key={option.value}
              active={String(option.value) === String(value)}
              onClick={() => handleSelect(option.value)}
            >
              {option.label}
            </S.DropdownItem>
          ))}
        </S.DropdownList>
      )}
    </S.Container>
  );
}
