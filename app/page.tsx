"use client";

import { useState } from "react";

import QuizView from "./components/QuizView";
import ResultView from "./components/ResultView";
import GradientText from "./components/GradientText";
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
      <div>
        <ResultView
          total={quizResult.total}
          correct={quizResult.correct}
          onRestart={startQuiz}
          onReview={() => setScreen("NOTE")}
        />
      </div>
    );
  }

  if (screen === "NOTE") {
    return <WrongNoteView onBack={() => setScreen("HOME")} onStartNew={startQuiz} />;
  }

  // 기본 HOME 화면
  return (

    <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-[#F5F7FF] to-[#EEF2FF] pt-[80px] px-6 relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/50 rounded-full blur-3xl opacity-60 z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/50 rounded-full blur-3xl opacity-60 z-0"></div>

      <main className="z-10 w-full max-w-sm flex flex-col gap-[48px] animate-in fade-in zoom-in-95 duration-700">

        {/* Hero Section */}
        <div className="w-full flex flex-col items-center">

          {/* Badge */}
          <div className="mb-[12px]">
            <span className="text-[12px] text-gray-500 font-medium">TOPIK II • Daily Practice</span>
          </div>

          {/* Title */}
          <div className="text-center mb-[16px]">
            <GradientText as="h1" className="text-4xl block">
              Daily TOPIK
            </GradientText>
          </div>

          {/* Subtitle */}
          <p className="text-center text-gray-600 font-medium mb-[40px] leading-relaxed">
            Learn Korean in Just 10 Questions a Day
          </p>

          {/* Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={startQuiz}
              className="w-full h-[56px] rounded-[16px] font-semibold bg-blue-600 text-white shadow-[0_6px_18px_rgba(0,0,0,0.12)] hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-lg">Try New Questions</span>
            </button>

            <button
              onClick={() => setScreen("NOTE")}
              className="w-full h-[56px] rounded-[16px] font-semibold border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center cursor-pointer"
            >
              <span className="text-lg">Review Mistakes</span>
            </button>
          </div>
        </div>

        {/* Feature Section */}
        <div className="grid grid-cols-3 gap-4 w-full">
          <div className="bg-[#F9FAFB] rounded-[16px] p-4 border border-[#E5E7EB] flex flex-col items-start gap-2 cursor-default">
            <div className="text-xl opacity-60">🧠</div>
            <div className="text-[11px] font-medium text-gray-500 leading-tight text-left">Random Questions</div>
          </div>
          <div className="bg-[#F9FAFB] rounded-[16px] p-4 border border-[#E5E7EB] flex flex-col items-start gap-2 cursor-default">
            <div className="text-xl opacity-60">📘</div>
            <div className="text-[11px] font-medium text-gray-500 leading-tight text-left">Review Mistakes</div>
          </div>
          <div className="bg-[#F9FAFB] rounded-[16px] p-4 border border-[#E5E7EB] flex flex-col items-start gap-2 cursor-default">
            <div className="text-xl opacity-60">🔁</div>
            <div className="text-[11px] font-medium text-gray-500 leading-tight text-left">Unique & Fresh</div>
          </div>
        </div>

      </main>

      <footer className="mt-auto py-8 text-gray-400 text-xs text-center z-10">
        © 2026 Daily TOPIK Practice
      </footer>
    </div>
  );
}
