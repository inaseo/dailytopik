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
            isCorrect: selectedAnswers[q.id] === q.correct_answer,
        }));
        onFinish(results);
    };

    return (
        <div className="flex flex-col h-full max-w-md mx-auto p-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 상단 바 */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={onCancel} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors cursor-pointer">
                    ✕ 나가기
                </button>
                <div className="font-bold text-lg text-blue-600 dark:text-blue-400">{progress}</div>
            </div>

            {/* 문제 영역 */}
            <div className="flex-1 overflow-y-auto pb-20 no-scrollbar">
                {/* 1. Level Indicator */}
                <div className="mb-2 flex items-baseline justify-start">
                    <span className="text-xs font-semibold px-2 py-1 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded text-gray-600">
                        {currentQuestion.level}급
                    </span>
                </div>

                {/* Pre-calculate Instruction and Body split */}
                {(() => {
                    const processed = currentQuestion.question_text.replace("다음 ( )에 알맞은 것을 고르십시오.", "").trim();
                    const splitIdx = processed.indexOf('\n');
                    let instruction = null;
                    let body = processed;

                    if (splitIdx !== -1) {
                        const firstLine = processed.substring(0, splitIdx).trim();
                        // 대화형(가:, 나:)일 경우 지시문으로 간주하지 않음
                        if (firstLine.startsWith("가:") || firstLine.startsWith("나:")) {
                            instruction = null;
                            body = processed;
                        } else {
                            instruction = firstLine;
                            body = processed.substring(splitIdx + 1);
                        }
                    }

                    return (
                        <div className="mb-6">
                            {/* 2. Instruction (문항 지시문) */}
                            {instruction && (
                                <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 font-medium bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg inline-block">
                                    {instruction}
                                </p>
                            )}

                            {/* 3. Passage (제시문) - If inside, it splits instruction and body visually */}
                            {currentQuestion.passage && (
                                <div
                                    className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 my-4 whitespace-pre-wrap leading-relaxed"
                                    style={{ color: "#FFFFFF" }}
                                >
                                    {currentQuestion.passage}
                                </div>
                            )}

                            {/* 4. Question Body (문항 본문) */}
                            <h2
                                className={`text-xl font-bold whitespace-pre-wrap leading-snug text-gray-900 dark:text-gray-100 ${instruction ? "mt-2" : ""}`}
                                dangerouslySetInnerHTML={{ __html: body }}
                            />
                        </div>
                    );
                })()}

                {/* 보기 리스트 */}
                <div className="flex flex-col gap-3">
                    {currentQuestion.choices.map((choice, idx) => {
                        const isSelected = selectedAnswers[currentQuestion.id] === idx;
                        const isCorrect = idx === currentQuestion.correct_answer;

                        // 기본 스타일
                        let containerClass = "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300";

                        if (isFeedbackMode) {
                            if (isCorrect) {
                                // 정답인 보기: 초록 강조 (항상 표시)
                                containerClass = "border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-bold";
                            } else if (isSelected && !isCorrect) {
                                // 내가 고른 오답: 빨강 강조
                                containerClass = "border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-bold";
                            } else {
                                // 선택안함 & 오답: 흐리게 처리
                                containerClass = "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-600 opacity-60";
                            }
                        } else {
                            if (isSelected) {
                                // 선택됨 (Before feedback): 파랑 강조
                                containerClass = "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold shadow-sm ring-1 ring-blue-500";
                            } else {
                                // 선택 안됨 (Hover 효과)
                                containerClass += " hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer";
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
                                        <span className={`mr-2 text-sm ${isFeedbackMode && (isCorrect || isSelected) ? "font-bold" : "text-gray-400"}`}>
                                            {idx + 1}
                                        </span>
                                        {choice}
                                    </div>
                                    {/* 결과 아이콘 표시 */}
                                    {isFeedbackMode && isCorrect && <span className="text-green-600 dark:text-green-400 font-bold text-sm ml-2">정답</span>}
                                    {isFeedbackMode && isSelected && !isCorrect && <span className="text-red-600 dark:text-red-400 font-bold text-sm ml-2">오답</span>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 dark:bg-black/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex justify-center z-20">
                <div className="w-full max-w-md">
                    <button
                        onClick={handleNext}
                        disabled={selectedAnswers[currentQuestion.id] === undefined}
                        className={`w-full py-4 text-lg font-bold text-white rounded-2xl shadow-lg transition-transform active:scale-[0.98] cursor-pointer ${selectedAnswers[currentQuestion.id] !== undefined
                            ? (isFeedbackMode ? "bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none")
                            : "bg-gray-300 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                            }`}
                    >
                        {!isFeedbackMode
                            ? "정답 확인"
                            : (currentIndex === questions.length - 1 ? "결과 보기" : "다음 문제")
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}
