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
            <div className="flex-1 p-4 flex flex-col gap-6 overflow-y-auto pb-20 max-w-lg w-full mx-auto">
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
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                            {item.question.level}급
                                        </span>
                                        <h3 className="text-[15px] font-bold text-gray-900">
                                            Question {index + 1} · <span className="text-[#94A3B8] font-medium">Previously Incorrect</span>
                                        </h3>
                                    </div>
                                    <div className="mt-1">
                                        <span className="text-xs text-gray-400">
                                            {new Date(item.solved_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="ml-4 text-gray-300">
                                    {expandedId === item.question_id ? '▲' : '▼'}
                                </div>
                            </div>

                            {/* 상세 내용 (펼쳐졌을 때만 보임) */}
                            {expandedId === item.question_id && (
                                <div className="bg-white px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
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
                                            <div className="flex flex-col gap-4 mb-6">
                                                {instruction && (
                                                    <p className="text-gray-900 border-b border-gray-100 pb-3 font-medium">
                                                        {instruction}
                                                    </p>
                                                )}
                                                {item.question.passage && (
                                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap leading-relaxed text-gray-800 text-sm">
                                                        {item.question.passage}
                                                    </div>
                                                )}
                                                <div className="text-gray-900 font-bold whitespace-pre-wrap leading-relaxed">
                                                    <span dangerouslySetInnerHTML={{ __html: body }} />
                                                </div>
                                            </div>
                                        );
                                    })()}

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
                                                onClick={() => handleCheckAnswer(item.question_id, item.question.correct_answer)}
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
                                                    const isAnswer = idx === item.question.correct_answer;

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

                                            {questionStatus[item.question_id] === "REVEALED" && (
                                                <div className="bg-[#EEF2FF] p-5 rounded-xl text-blue-900 leading-relaxed">
                                                    <span className="font-bold block mb-2 text-blue-700 text-sm uppercase tracking-wide">Explanation</span>
                                                    <p className="text-sm">{item.question.explanation}</p>
                                                </div>
                                            )}

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
