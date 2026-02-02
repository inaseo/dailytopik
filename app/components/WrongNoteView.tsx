"use client";

import { useState, useEffect } from "react";
import { TopikStore } from "../lib/store";
import { Question, UserHistory } from "../types";
import GradientText from "./GradientText";

interface WrongNoteViewProps {
    onBack: () => void;
    onStartNew: () => void;
}

type WrongNoteItem = UserHistory & { question: Question };

export default function WrongNoteView({ onBack, onStartNew }: WrongNoteViewProps) {
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
            <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto pb-20 max-w-lg w-full mx-auto">
                {notes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">All caught up!</h2>
                        <p className="text-gray-500 mb-10">No mistakes to review.</p>

                        <div className="w-full max-w-xs flex flex-col gap-3">
                            <button
                                onClick={onStartNew}
                                className="w-full h-[56px] rounded-[16px] font-semibold bg-blue-600 text-white shadow-[0_6px_18px_rgba(0,0,0,0.12)] hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center text-lg cursor-pointer"
                            >
                                New Questions
                            </button>
                            <button
                                onClick={onBack}
                                className="w-full h-[56px] rounded-[16px] font-semibold border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center text-lg cursor-pointer"
                            >
                                Back to Home
                            </button>
                        </div>
                    </div>
                ) : (
                    notes.map((item, index) => (
                        <div
                            key={item.question_id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4"
                        >
                            {/* 요약 카드 (클릭 시 펼침) */}
                            <div
                                onClick={() => toggleExpand(item.question_id)}
                                className="p-5 cursor-pointer flex justify-between items-center transition-colors hover:bg-gray-50/50"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-500">
                                        Question {index + 1}
                                    </span>
                                    <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase border border-rose-100">
                                        Incorrect
                                    </span>
                                    <span className="text-xs text-gray-400 border-l border-gray-300 pl-3">
                                        {new Date(item.solved_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="ml-4 text-gray-300">
                                    {expandedId === item.question_id ? '▲' : '▼'}
                                </div>
                            </div>

                            {/* 상세 내용 (펼쳐졌을 때만 보임) */}
                            {expandedId === item.question_id && (
                                <div className="bg-white px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                                    <div className="flex flex-col mb-4">
                                        {(() => {
                                            const isDuplicate = item.question.instruction?.trim() === item.question.question?.trim();
                                            return (
                                                <>
                                                    {/* 1. Instruction - Reduced emphasis */}
                                                    <div className="px-0 py-1 mb-2">
                                                        <p className="text-xs text-gray-400 leading-relaxed">
                                                            {item.question.instruction}
                                                        </p>
                                                    </div>

                                                    {/* 2. Passage */}
                                                    {item.question.passage && (
                                                        <div className="bg-gray-100 p-6 rounded-2xl border border-gray-200 text-gray-700 leading-relaxed mb-6 whitespace-pre-line text-base">
                                                            {item.question.passage}
                                                        </div>
                                                    )}

                                                    {/* 3. Question Body - Primary Emphasis */}
                                                    {!isDuplicate && (
                                                        <div className="text-xl font-bold text-gray-900 mb-6 leading-snug whitespace-pre-wrap">
                                                            {(() => {
                                                                if (item.question.type === "underline") {
                                                                    const parts = item.question.question.split(/__(.+?)__/);
                                                                    if (parts.length >= 3) {
                                                                        return (
                                                                            <span>
                                                                                {parts[0]}
                                                                                <span className="underline underline-offset-4 decoration-2">{parts[1]}</span>
                                                                                {parts.slice(2).join("")}
                                                                            </span>
                                                                        );
                                                                    }
                                                                }
                                                                return item.question.question;
                                                            })()}
                                                        </div>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* 복습용 문제 UI */}
                                    {(!questionStatus[item.question_id] || questionStatus[item.question_id] === "IDLE") ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex flex-col gap-3">
                                                {item.question.choices.map((choice, idx) => {
                                                    const isSelected = selectedAnswers[item.question_id] === idx;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            onClick={() => handleSelect(item.question_id, idx)}
                                                            className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected
                                                                ? "border-blue-200 bg-blue-50 text-blue-700 font-medium"
                                                                : "border-gray-100 bg-gray-50 text-gray-600"}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${isSelected ? "border-current" : "border-gray-200 bg-white text-gray-400"}`}>
                                                                    {idx + 1}
                                                                </div>
                                                                {choice}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => handleCheckAnswer(item.question_id, item.question.answer)}
                                                className="mt-4 w-full h-[56px] bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                                            >
                                                Check Answer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-3 mb-2">
                                                {item.question.choices.map((choice, idx) => {
                                                    const isSelected = selectedAnswers[item.question_id] === idx;
                                                    const status = questionStatus[item.question_id];
                                                    const isAnswer = idx === item.question.answer;

                                                    let containerClass = "p-4 rounded-xl border border-transparent bg-gray-50 text-gray-400";
                                                    let feedbackIcon = null;

                                                    if (status === "REVEALED") {
                                                        if (isAnswer) {
                                                            containerClass = "p-4 rounded-xl border border-green-200 bg-green-50 text-green-700 font-bold";
                                                            feedbackIcon = <span className="text-xl">⭕</span>;
                                                        }
                                                        else if (isSelected) {
                                                            containerClass = "p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold";
                                                            feedbackIcon = <span className="text-xl">❌</span>;
                                                        }
                                                    } else if (status === "WRONG") {
                                                        if (isSelected) {
                                                            containerClass = "p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold";
                                                            feedbackIcon = <span className="text-xl">❌</span>;
                                                        }
                                                    }

                                                    return (
                                                        <div key={idx} className={containerClass}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${isSelected || isAnswer ? "border-current" : "border-gray-200 bg-white text-gray-400"}`}>
                                                                    {idx + 1}
                                                                </div>
                                                                <span>{choice}</span>
                                                                {feedbackIcon && (
                                                                    <div className="ml-auto">
                                                                        {feedbackIcon}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation Removed (Not in schema) */}

                                            <div style={{ marginTop: "16px" }}>
                                                {questionStatus[item.question_id] === "WRONG" && (
                                                    <div style={{ display: "flex", gap: "12px" }}>
                                                        <button
                                                            onClick={() => handleTryAgain(item.question_id)}
                                                            className="flex-1 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                                                        >
                                                            Try Again
                                                        </button>

                                                        <button
                                                            onClick={() => handleRevealAnswer(item.question_id)}
                                                            className="flex-1 px-6 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors cursor-pointer"
                                                        >
                                                            Show Answer
                                                        </button>
                                                    </div>
                                                )}

                                                {questionStatus[item.question_id] === "REVEALED" && (
                                                    <button
                                                        onClick={() => {
                                                            if (index < notes.length - 1) {
                                                                toggleExpand(notes[index + 1].question_id);
                                                            } else {
                                                                toggleExpand(item.question_id);
                                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                                            }
                                                        }}
                                                        className="w-full px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                                                    >
                                                        Next Question
                                                    </button>
                                                )}
                                            </div>
                                        </div>
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
