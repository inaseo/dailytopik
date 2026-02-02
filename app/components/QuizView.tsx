"use client";

import { useState } from "react";
import { Question } from "../types";

interface QuizViewProps {
    questions: Question[];
    onFinish: (results: { questionId: number; isCorrect: boolean }[]) => void;
    onCancel: () => void;
}

export default function QuizView({ questions, onFinish, onCancel }: QuizViewProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
    const [isFeedbackMode, setIsFeedbackMode] = useState(false); // 결과 표시 상태

    const currentQuestion = questions[currentIndex];
    const progress = `${currentIndex + 1} / ${questions.length}`;

    const handleSelect = (choiceIndex: number) => {
        if (isFeedbackMode) return; // 결과 표시 중에는 변경 불가
        setSelectedAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: choiceIndex,
        }));
    };

    const handleNext = () => {
        // 마지막 문제처리
        const isLast = currentIndex === questions.length - 1;

        if (!isFeedbackMode) {
            // 1단계: 정답 확인 모드로 전환
            setIsFeedbackMode(true);
        } else {
            // 2단계: 다음 문제로 이동
            if (isLast) {
                handleSubmit();
            } else {
                setCurrentIndex((prev) => prev + 1);
                setIsFeedbackMode(false);
            }
        }
    };

    const handleSubmit = () => {
        // 결과 계산
        const results = questions.map((q) => ({
            questionId: q.id,
            isCorrect: selectedAnswers[q.id] === q.answer,
        }));
        onFinish(results);
    };

    return (
        <div
            className="w-full min-h-[100svh] flex justify-center bg-[#0F172A]"
            style={{
                backgroundColor: "#0F172A",
                color: "#F8FAFC",
                colorScheme: "dark"
            }}
        >
            <div className="flex flex-col w-full max-w-md h-full p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* 상단 바 */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onCancel} className="text-[#94A3B8] hover:text-white transition-colors cursor-pointer">
                        ✕ Exit Quiz
                    </button>
                    <div className="font-bold text-lg text-[#60A5FA]">{progress}</div>
                </div>

                {/* 문제 영역 */}
                <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                    {/* 1. Level Indicator */}


                    {/* Unified Content Renderer */}
                    <div className="mb-2">
                        {/* 1. Instruction (Caption vs Prominent) */}
                        {(() => {
                            const isDuplicate = currentQuestion.instruction?.trim() === currentQuestion.question?.trim();

                            return (
                                <>
                                    <div className="px-0 py-1 mb-12">
                                        <p className="text-lg font-semibold text-white leading-relaxed">
                                            {currentQuestion.instruction}
                                        </p>
                                    </div>

                                    {/* 2. Passage (Grey Box) - ONLY if exists */}
                                    {currentQuestion.passage && (
                                        <div className="bg-[#1E293B] p-6 rounded-2xl border border-slate-700/50 text-slate-300 leading-relaxed mb-6 whitespace-pre-line text-base shadow-sm">
                                            {currentQuestion.passage}
                                        </div>
                                    )}

                                    {/* 3. Question (Main Body) - Hide only if identical to instruction */}
                                    {!isDuplicate && (
                                        <div className="text-xl font-bold text-white leading-snug mb-8 whitespace-pre-line">
                                            {currentQuestion.question}
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    {/* 보기 리스트 */}
                    {(() => {
                        const safeChoices = Array.isArray(currentQuestion?.choices) ? currentQuestion.choices : [];

                        if (safeChoices.length !== 4) {
                            return (
                                <div className="p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-200 mb-4">
                                    <p className="font-bold mb-2">Invalid question data: choices missing or not 4 items.</p>
                                    <p className="text-sm opacity-80 mb-3">(id: {currentQuestion.id}, type: {currentQuestion.type})</p>
                                    <button
                                        onClick={() => {
                                            const isLast = currentIndex === questions.length - 1;
                                            if (isLast) {
                                                handleSubmit();
                                            } else {
                                                setCurrentIndex((prev) => prev + 1);
                                                setIsFeedbackMode(false);
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Skip this question
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div className="flex flex-col gap-3">
                                {safeChoices.map((choice, idx) => {
                                    const isSelected = selectedAnswers[currentQuestion.id] === idx;
                                    const isCorrect = idx === currentQuestion.answer;

                                    // 기본 스타일
                                    let containerClass = "bg-[#1E293B] border-[#334155] text-[#F8FAFC]";

                                    if (isFeedbackMode) {
                                        if (isCorrect) {
                                            // 정답인 보기
                                            containerClass = "bg-[#064E3B] border-[#10B981] text-[#6EE7B7] font-bold";
                                        } else if (isSelected && !isCorrect) {
                                            // 내가 고른 오답
                                            containerClass = "bg-[#7F1D1D] border-[#EF4444] text-[#FCA5A5] font-bold";
                                        } else {
                                            // 선택안함 & 오답
                                            containerClass = "bg-[#1E293B] border-[#334155] text-[#64748B] opacity-60";
                                        }
                                    } else {
                                        if (isSelected) {
                                            // 선택됨 (Before feedback)
                                            containerClass = "bg-[#1E293B] border-[#3B82F6] ring-1 ring-[#3B82F6] text-[#60A5FA] font-semibold";
                                        } else {
                                            // 선택 안됨 (Hover 효과)
                                            containerClass += " hover:bg-[#334155] hover:border-[#475569] cursor-pointer transition-colors";
                                        }
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleSelect(idx)}
                                            disabled={isFeedbackMode}
                                            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${containerClass}`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className={`mr-2 text-sm ${isFeedbackMode && (isCorrect || isSelected) ? "font-bold" : "text-[#94A3B8]"}`}>
                                                        {idx + 1}
                                                    </span>
                                                    {choice}
                                                </div>
                                                {/* 결과 아이콘 표시 */}
                                                {isFeedbackMode && isCorrect && <span className="text-[#4ADE80] font-bold text-lg ml-2" aria-label="Correct">O</span>}
                                                {isFeedbackMode && isSelected && !isCorrect && <span className="text-[#F87171] font-bold text-lg ml-2" aria-label="Incorrect">X</span>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()}
                </div>

                {/* 하단 버튼 */}
                <div className="fixed bottom-0 left-0 w-full p-4 flex justify-center z-20"
                    style={{
                        backgroundColor: "rgba(15, 23, 42, 0.8)",
                        backdropFilter: "blur(12px)",
                        borderTop: "1px solid #1E293B"
                    }}
                >
                    <div className="w-full max-w-md">
                        <button
                            onClick={handleNext}
                            disabled={selectedAnswers[currentQuestion.id] === undefined}
                            className={`w-full py-4 text-lg font-bold rounded-2xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer ${selectedAnswers[currentQuestion.id] !== undefined
                                ? (isFeedbackMode ? "bg-[#F8FAFC] text-[#0F172A] hover:bg-[#E2E8F0]" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]")
                                : "bg-[#1E293B] text-[#475569] cursor-not-allowed"
                                }`}
                        >
                            {!isFeedbackMode
                                ? "Check Answer"
                                : (currentIndex === questions.length - 1 ? "See Results" : "Next Question")
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
