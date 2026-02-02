"use client";

import { useState, useEffect } from "react";
import { TopikStore } from "../lib/store";
import { Question, UserHistory } from "../types";
import GradientText from "./GradientText";

interface WrongNoteViewProps {
    onBack: () => void;
}

type WrongNoteItem = UserHistory & { question: Question };

export default function WrongNoteView({ onBack }: WrongNoteViewProps) {
    const [notes, setNotes] = useState<WrongNoteItem[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [questionStatus, setQuestionStatus] = useState<{ [key: number]: "IDLE" | "WRONG" | "REVEALED" }>({});
    const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});

    useEffect(() => {
        // 오답노트 데이터 로드
        loadNotes();
    }, []);

    const loadNotes = () => {
        const data = TopikStore.getWrongNotes();
        // 최신순 정렬 (solved_at 기준)
        data.sort((a, b) => new Date(b.solved_at).getTime() - new Date(a.solved_at).getTime());
        setNotes(data);
    };

    const toggleExpand = (id: number) => {
        setExpandedId(platformId => (platformId === id ? null : id));
    };

    const handleSelect = (questionId: number, choiceIndex: number) => {
        if (questionStatus[questionId] === "REVEALED") return; // 정답 확인 후에는 변경 불가
        if (questionStatus[questionId] === "WRONG") {
            // 틀린 상태에서 선택 시, 상태를 다시 IDLE로 변경하여 재선택 가능하게?
            // 아니면 그냥 선택 변경만 허용? Try Again 버튼이 있으므로 여기선 선택만 변경.
        }
        setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceIndex }));
    };

    const handleCheckAnswer = (id: number, correctChoice: number) => {
        if (selectedAnswers[id] === undefined) {
            alert("Select an answer.");
            return;
        }

        const isCorrect = selectedAnswers[id] === correctChoice;
        if (isCorrect) {
            TopikStore.removeWrongNote(id);
            loadNotes();
            setSelectedAnswers(prev => { const n = { ...prev }; delete n[id]; return n; });
            setQuestionStatus(prev => { const n = { ...prev }; delete n[id]; return n; });
        } else {
            // 틀린 경우 -> WRONG 상태로 변경
            setQuestionStatus(prev => ({ ...prev, [id]: "WRONG" }));
        }
    };

    const handleTryAgain = (id: number) => {
        setQuestionStatus(prev => ({ ...prev, [id]: "IDLE" }));
        setSelectedAnswers(prev => { const n = { ...prev }; delete n[id]; return n; });
    };

    const handleRevealAnswer = (id: number) => {
        setQuestionStatus(prev => ({ ...prev, [id]: "REVEALED" }));
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 h-full">
            {/* 헤더 */}
            <div className="bg-white sticky top-0 z-10 px-4 py-4 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <GradientText as="h1" className="text-2xl">Review Mistakes</GradientText>
                </div>
            </div>

            {/* 리스트 */}
            <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto pb-20">
                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-4">
                        <p className="font-bold text-gray-600">No mistakes to review.</p>
                        <button
                            onClick={onBack}
                            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                        >
                            Back to Home
                        </button>
                    </div>
                ) : (
                    notes.map((item) => (
                        <div
                            key={item.question_id}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300"
                        >
                            {/* 요약 카드 (클릭 시 펼침) */}
                            <div
                                onClick={() => toggleExpand(item.question_id)}
                                className="p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-start"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            {new Date(item.solved_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                            {item.question.level}급
                                        </span>
                                    </div>
                                    <p className="text-s text-gray-900 font-bold line-clamp-2">
                                        {item.question.question_text.split('\n')[0]}
                                    </p>
                                </div>
                                <div className="ml-4 mt-1 text-gray-300">
                                    {expandedId === item.question_id ? '▲' : '▼'}
                                </div>
                            </div>

                            {/* 상세 내용 (펼쳐졌을 때만 보임) */}
                            {/* 상세 내용 (펼쳐졌을 때만 보임) */}
                            {expandedId === item.question_id && (
                                <div className="bg-gray-50 p-5 border-t border-gray-100 text-sm animate-in slide-in-from-top-2 duration-200">
                                    {(() => {
                                        const processed = item.question.question_text.replace("다음 ( )에 알맞은 것을 고르십시오.", "").trim();
                                        const splitIdx = processed.indexOf('\n');
                                        let instruction = null;
                                        let body = processed;
                                        if (splitIdx !== -1) {
                                            instruction = processed.substring(0, splitIdx);
                                            body = processed.substring(splitIdx + 1);
                                        }

                                        return (
                                            <div className="flex flex-col gap-4 mb-4">
                                                {/* 1. Instruction */}
                                                {instruction && (
                                                    <p className="text-gray-900 border-b pb-2">
                                                        {instruction}
                                                    </p>
                                                )}

                                                {/* 2. Passage */}
                                                {item.question.passage && (
                                                    <div className="bg-white p-3 rounded border border-gray-200 whitespace-pre-wrap leading-relaxed text-gray-900">
                                                        {item.question.passage}
                                                    </div>
                                                )}

                                                {/* 3. Body */}
                                                <div className="text-gray-900 font-bold whitespace-pre-wrap leading-relaxed">
                                                    <span dangerouslySetInnerHTML={{ __html: body }} />
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* 복습용 문제 재도전 UI */}
                                    {(!questionStatus[item.question_id] || questionStatus[item.question_id] === "IDLE") ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-2">
                                                {item.question.choices.map((choice, idx) => {
                                                    const isSelected = selectedAnswers[item.question_id] === idx;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleSelect(item.question_id, idx)}
                                                            className={`p-3 rounded border cursor-pointer transition-colors ${isSelected
                                                                ? "border-blue-500 bg-blue-50 text-blue-700 font-bold"
                                                                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                                                        >
                                                            {idx + 1}. {choice}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => handleCheckAnswer(item.question_id, item.question.correct_answer)}
                                                className="mt-2 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                            >
                                                Check Answer
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* 정답/오답 표시 */}
                                            <div className="flex flex-col gap-2 mb-4">
                                                {item.question.choices.map((choice, idx) => {
                                                    const isSelected = selectedAnswers[item.question_id] === idx;
                                                    const status = questionStatus[item.question_id];
                                                    const isAnswer = idx === item.question.correct_answer;

                                                    // WRONG 상태일 때는 정답(녹색)을 보여주지 않고, 선택한 오답(빨강)만 표시
                                                    // REVEALED 상태일 때는 둘 다 표시
                                                    let className = "p-3 rounded border bg-white border-gray-200 text-gray-500";

                                                    if (status === "REVEALED") {
                                                        if (isAnswer) className = "p-3 rounded border bg-green-100 border-green-300 text-green-900 font-bold";
                                                        else if (isSelected) className = "p-3 rounded border bg-red-50 border-red-300 text-red-900 font-bold";
                                                    } else if (status === "WRONG") {
                                                        if (isSelected) className = "p-3 rounded border bg-red-50 border-red-300 text-red-900 font-bold";
                                                    }

                                                    return (
                                                        <div key={idx} className={className}>
                                                            {idx + 1}. {choice}
                                                            {status === "REVEALED" && isAnswer && <span className="ml-2 text-lg text-green-600 font-bold" aria-label="Correct">O</span>}
                                                            {isSelected && !isAnswer && <span className="ml-2 text-lg text-red-600 font-bold" aria-label="Incorrect">X</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {questionStatus[item.question_id] === "REVEALED" && (
                                                <div className="bg-blue-50 p-4 rounded-lg text-blue-900 leading-relaxed border border-blue-100 mb-4">
                                                    <span className="font-bold block mb-1">💡 해설</span>
                                                    {item.question.explanation}
                                                </div>
                                            )}

                                            {/* 액션 버튼들 */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => handleTryAgain(item.question_id)}
                                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                                >
                                                    Try Again
                                                </button>
                                                {questionStatus[item.question_id] === "WRONG" && (
                                                    <button
                                                        onClick={() => handleRevealAnswer(item.question_id)}
                                                        className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition-colors cursor-pointer"
                                                    >
                                                        Show Answer
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
