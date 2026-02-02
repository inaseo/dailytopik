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
    const [showAnswerFor, setShowAnswerFor] = useState<{ [key: number]: boolean }>({});
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
        if (showAnswerFor[questionId]) return; // 이미 정답 확인했으면 변경 불가
        setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceIndex }));
    };

    const handleShowAnswer = (id: number, correctChoice: number) => {
        // 선택하지 않았으면 경고? (요구가 없으므로 생략하고 그냥 보여줄 수도 있지만, "Re-solving"이라고 했으므로 선택이 필요함)
        // 만약 선택이 없으면 동작 X
        if (selectedAnswers[id] === undefined) {
            alert("Select an answer.");
            return;
        }

        const isCorrect = selectedAnswers[id] === correctChoice;
        if (isCorrect) {
            // 정답을 맞춘 경우 -> 즉시 삭제
            TopikStore.removeWrongNote(id);
            loadNotes(); // 리스트 갱신
            // 상태 초기화
            setSelectedAnswers(prev => { const n = { ...prev }; delete n[id]; return n; });
            setShowAnswerFor(prev => { const n = { ...prev }; delete n[id]; return n; });
        } else {
            // 틀린 경우 -> 정답 및 해설 표시 (표시만 함)
            setShowAnswerFor(prev => ({ ...prev, [id]: true }));
        }
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
                                    {!showAnswerFor[item.question_id] ? (
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
                                                onClick={() => handleShowAnswer(item.question_id, item.question.correct_answer)}
                                                className="mt-2 w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                                            >
                                                Check Answer
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* 정답 표시 */}
                                            <div className="flex flex-col gap-2 mb-4">
                                                {item.question.choices.map((choice, idx) => {
                                                    const isSelected = selectedAnswers[item.question_id] === idx;
                                                    return (
                                                        <div key={idx} className={`p-3 rounded border ${idx === item.question.correct_answer
                                                            ? "bg-green-100 border-green-300 text-green-900 font-bold" // 정답
                                                            : (isSelected ? "bg-red-50 border-red-300 text-red-900 font-bold" : "bg-white border-gray-200 text-gray-500")
                                                            }`}>
                                                            {idx + 1}. {choice}
                                                            {idx === item.question.correct_answer && <span className="ml-2 text-lg text-green-600 font-bold" aria-label="Correct">O</span>}
                                                            {isSelected && idx !== item.question.correct_answer && <span className="ml-2 text-lg text-red-600 font-bold" aria-label="Incorrect">X</span>}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <div className="bg-blue-50 p-4 rounded-lg text-blue-900 leading-relaxed border border-blue-100">
                                                <span className="font-bold block mb-1">💡 해설</span>
                                                {item.question.explanation}
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
