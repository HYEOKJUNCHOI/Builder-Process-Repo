package com.bpr.entity;

/**
 * 소공정 진행 상태 ENUM
 * 탭 한 번에 다음 단계로 순환: WAITING → IN_PROGRESS → TOUCH_UP → DONE → WAITING
 */
public enum ProcessStatus {
    WAITING,      // 대기
    IN_PROGRESS,  // 진행중
    TOUCH_UP,     // 잔손보기
    DONE;         // 완료

    /** 다음 상태로 순환 */
    public ProcessStatus next() {
        ProcessStatus[] values = values();
        return values[(this.ordinal() + 1) % values.length];
    }
}
