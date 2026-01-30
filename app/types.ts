// 문제(Question)의 형태를 정의하는 설계도입니다.
export interface Question {
  id: number;
  level: "1" | "2" | "3" | "4" | "5" | "6"; // 문제 난이도 (TOPIK 급수)
  type: "vocab_grammar" | "short_reading" | "long_reading"; // 문제 유형: 어휘문법, 단문, 장문
  passage?: string; // 지문 (있을 수도 있고 없을 수도 있음)
  question_text: string; // 문제 내용
  choices: string[]; // 보기 4개
  correct_answer: number; // 정답 번호 (0~3 또는 1~4, 여기서는 배열 인덱스 0~3 사용 예정)
  explanation: string; // 해설
}

// 사용자가 푼 문제 기록을 위한 설계도입니다.
export interface UserHistory {
  question_id: number;
  is_correct: boolean;
  solved_at: string; // 푼 날짜
}
