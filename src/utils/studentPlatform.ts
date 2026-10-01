/**
 * 학급 플랫폼(iframe) 연동 유틸리티
 */

export interface StudentPlatformInfo {
  studentUid: string;
  studentName: string;
  school?: string;
  grade?: string;
  classNum?: string;
}

const STORAGE_KEY = 'pokemon_splendor_student_info';

/**
 * URL 쿼리 파라미터 및 세션 스토리지에서 학생 정보를 추출합니다.
 */
export function getStudentInfoFromUrl(): StudentPlatformInfo {
  if (typeof window === 'undefined') {
    return {
      studentUid: '',
      studentName: '학생',
    };
  }

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const studentUid = urlParams.get('studentUid') || '';
    const studentName = urlParams.get('studentName') || '';
    const school = urlParams.get('school') || undefined;
    const grade = urlParams.get('grade') || undefined;
    const classNum = urlParams.get('classNum') || undefined;

    // URL에 파라미터가 하나라도 있으면 파싱 후 sessionStorage에 캐시
    if (studentUid || studentName) {
      const info: StudentPlatformInfo = {
        studentUid: studentUid.trim(),
        studentName: (studentName.trim() || '학생'),
        school: school?.trim(),
        grade: grade?.trim(),
        classNum: classNum?.trim(),
      };
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(info));
      } catch (e) {
        // sessionStorage 비활성화 환경 예외 처리
      }
      return info;
    }

    // URL에 없으면 이전에 저장된 sessionStorage에서 복원 시도
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        studentUid: parsed.studentUid || '',
        studentName: parsed.studentName || '학생',
        school: parsed.school,
        grade: parsed.grade,
        classNum: parsed.classNum,
      };
    }
  } catch (err) {
    console.error('[StudentPlatform] Error reading student info:', err);
  }

  return {
    studentUid: '',
    studentName: '학생',
  };
}

/**
 * 부모 창(학급 플랫폼 iframe)으로 게임 결과(승률 및 메시지)를 전송합니다.
 * @param winRate 승률 (0 ~ 100 숫자)
 * @param message 결과 요약 메시지
 */
export function sendScoreToClassPlatform(
  winRate: number,
  message: string,
  extraInfo?: Partial<StudentPlatformInfo>
): boolean {
  if (typeof window === 'undefined') return false;

  const studentInfo = {
    ...getStudentInfoFromUrl(),
    ...(extraInfo || {}),
  };

  const payload = {
    type: 'MATH_SCORE_SUBMIT',
    score: Math.min(100, Math.max(0, Math.round(winRate))),
    details: message,
    studentUid: studentInfo.studentUid,
    studentName: studentInfo.studentName,
    school: studentInfo.school,
    grade: studentInfo.grade,
    classNum: studentInfo.classNum,
    timestamp: Date.now(),
  };

  console.log('[StudentPlatform] Sending game result to parent platform:', payload);

  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
      return true;
    } else {
      // 일반 창에서 테스트할 때도 window.postMessage 시도 (테스트 호환성)
      window.postMessage(payload, '*');
      console.info('[StudentPlatform] Running in top-level window (not an iframe). PostMessage dispatched to self for testing.');
      return true;
    }
  } catch (error) {
    console.error('[StudentPlatform] Failed to postMessage to parent:', error);
    return false;
  }
}

/**
 * 학생이 로비에서 이름을 변경했을 때 세션 스토리지의 정보를 업데이트합니다.
 */
export function updateStoredStudentName(newName: string) {
  if (typeof window === 'undefined') return;
  try {
    const current = getStudentInfoFromUrl();
    const updated = {
      ...current,
      studentName: newName.trim() || '학생',
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
}

