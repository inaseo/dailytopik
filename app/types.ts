// 문제(Question)의 형태를 정의하는 설계도입니다.
export type QuestionType =
  | "blank"
  | "passage"
  | "ordering"
  | "underline"
  | "connector"
  | "title";

export interface Question {
  id: number;
  type: QuestionType;
  instruction: string;
  passage?: string;   // 지문 (reading text or context)
  question: string;   // 문제 내용 (main bold text)
  choices: string[];  // 보기 4개 (renamed from options)
  answer: number;     // 정답 인덱스 (renamed from answerIndex)
};

// 사용자가 푼 문제 기록을 위한 설계도입니다.
export interface UserHistory {
  question_id: number;
  is_correct: boolean;
  solved_at: string; // 푼 날짜
}
