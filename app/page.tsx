"use client";

import { useState } from "react";
import QuizView from "./components/QuizView";
import ResultView from "./components/ResultView";
import WrongNoteView from "./components/WrongNoteView";
import { TopikStore } from "./lib/store";
import { Question } from "./types";

// 앱의 전체 화면 상태 정의
type ScreenState = "HOME" | "QUIZ" | "RESULT" | "NOTE";

export default function Home() {
  const [screen, setScreen] = useState<ScreenState>("HOME");
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [quizResult, setQuizResult] = useState<{ total: number; correct: number }>({ total: 0, correct: 0 });

  // 1. "새 문제 받기" 클릭 시
  const startQuiz = () => {
    const questions = TopikStore.getNewSet();
    setQuizQuestions(questions);
    setScreen("QUIZ");
  };

  // 2. 퀴즈 종료 시 (결과 처리)
  const finishQuiz = (results: { questionId: number; isCorrect: boolean }[]) => {
    // 스토어에 저장
    TopikStore.submitResults(results);

    // 결과 계산
    const correctCount = results.filter((r) => r.isCorrect).length;
    setQuizResult({ total: results.length, correct: correctCount });

    // 결과 화면으로 이동
    setScreen("RESULT");
  };

  // 화면 렌더링 분기
  if (screen === "QUIZ") {
    return (
      <QuizView
        questions={quizQuestions}
        onFinish={finishQuiz}
        onCancel={() => setScreen("HOME")}
      />
    );
  }

  if (screen === "RESULT") {
    return (
      <ResultView
        total={quizResult.total}
        correct={quizResult.correct}
        onHome={() => setScreen("HOME")}
      />
    );
  }

  if (screen === "NOTE") {
    return <WrongNoteView onBack={() => setScreen("HOME")} />;
  }

  // 기본 HOME 화면
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-3xl opacity-50 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-100 rounded-full blur-3xl opacity-50 z-0"></div>

      <main className="z-10 flex flex-col items-center gap-10 w-full max-w-sm animate-in fade-in zoom-in-95 duration-700">

        {/* 타이틀 영역 */}
        <div className="text-center space-y-1">
          <span className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full dark:bg-white dark:text-black">TOPIK II</span>
          <h1 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            Daily TOPIK
          </h1>
          <p className="text-gray-500 font-medium dark:text-gray-400">하루 10문제로 끝내는 한국어 공부</p>
        </div>

        {/* 메인 액션 버튼 */}
        <div className="w-full flex flex-col gap-4">
          <button
            onClick={startQuiz}
            className="group relative w-full h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-700 transition-all rounded-2xl cursor-pointer overflow-hidden text-white"
          >
            <span className="relative z-10 font-bold text-lg flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              새 문제 받기
            </span>
          </button>

          <button
            onClick={() => setScreen("NOTE")}
            className="w-full h-16 flex items-center justify-center bg-transparent border border-gray-200 text-blue-600 font-bold text-lg rounded-2xl transition-all cursor-pointer dark:border-gray-700 dark:text-blue-500 dark:hover:bg-gray-800/10"
          >
            오답노트 확인
          </button>
        </div>
      </main>

      <footer className="absolute bottom-6 text-gray-400 text-xs text-center z-10">
        © 2026 Daily TOPIK Practice
      </footer>
    </div>
  );
}
