"use client";

import { Question, UserHistory } from "../types";
import { questions } from "../data/questions";
import { generateQuestions } from "./generator";

// 로컬 스토리지 키 관리
const STORAGE_KEY_SOLVED = "topik_solved_ids"; // 이번 사이클에서 푼 문제들
const STORAGE_KEY_WRONG = "topik_wrong_history"; // 영구 저장될 오답 노트
const STORAGE_KEY_GENERATED = "topik_generated_questions"; // 생성된 문제들

export class TopikStore {
    // 생성된 문제 로드 및 초기화
    private static getGeneratedQuestions(): Question[] {
        if (typeof window === "undefined") return [];

        const stored = localStorage.getItem(STORAGE_KEY_GENERATED);
        if (stored) {
            return JSON.parse(stored);
        }

        // 없으면 10개 생성 (1회성)
        const newQuestions = generateQuestions(10);
        localStorage.setItem(STORAGE_KEY_GENERATED, JSON.stringify(newQuestions));
        return newQuestions;
    }

    // 1. 새로운 문제 10개를 가져오는 함수 (Greedy Selection)
    static getNewSet(): Question[] {
        let solvedIds = this.getSolvedIds();
        let currentGeneratedQuestions = this.getGeneratedQuestions();
        let allQuestions = [...questions, ...currentGeneratedQuestions];

        let available = allQuestions.filter(q => !solvedIds.includes(q.id));

        if (available.length < 10) {
            console.log("Resetting question history...");
            this.clearSolvedIds();
            solvedIds = [];
            if (typeof window !== "undefined") {
                const newGen = generateQuestions(10);
                localStorage.setItem(STORAGE_KEY_GENERATED, JSON.stringify(newGen));
                currentGeneratedQuestions = newGen;
            }
            allQuestions = [...questions, ...currentGeneratedQuestions];
            available = allQuestions;
        }

        // Shuffle candidates first for randomness
        let candidates = this.shuffleArray([...available]);
        const selected: Question[] = [];

        for (let i = 0; i < 10; i++) {
            if (candidates.length === 0) break;

            const prev = selected.length > 0 ? selected[selected.length - 1] : null;
            let bestIndex = 0;

            if (prev) {
                const prevGroup = this.getQuestionGroup(prev.type);

                // 1. Prefer Different Group
                const idxDiffGroup = candidates.findIndex(c => this.getQuestionGroup(c.type) !== prevGroup);

                if (idxDiffGroup !== -1) {
                    bestIndex = idxDiffGroup;
                } else {
                    // 2. Prefer Different Type (Same Group)
                    const idxDiffType = candidates.findIndex(c => c.type !== prev.type);
                    if (idxDiffType !== -1) {
                        bestIndex = idxDiffType;
                    }
                    // 3. Fallback: Same Group & Type (bestIndex = 0)
                }
            }

            selected.push(candidates[bestIndex]);
            candidates.splice(bestIndex, 1);
        }

        return selected;
    }

    private static getQuestionGroup(type: string): string {
        if (["passage", "title", "ordering"].includes(type)) return "reading";
        if (["blank", "connector", "underline"].includes(type)) return "grammar";
        return "other";
    }

    // 2. 결과 제출 및 저장
    static submitResults(results: { questionId: number; isCorrect: boolean }[]) {
        const solvedIds = this.getSolvedIds();
        const wrongHistory = this.getWrongHistory();
        const now = new Date().toISOString();

        results.forEach((r) => {
            // 1) 이번 사이클 푼 문제 목록에 추가
            if (!solvedIds.includes(r.questionId)) {
                solvedIds.push(r.questionId);
            }

            // 2) 틀린 문제는 오답노트에 영구 저장
            // (이미 오답노트에 있는 문제는 중복해서 넣지 않거나, 최신 날짜로 업데이트)
            if (!r.isCorrect) {
                const existingIndex = wrongHistory.findIndex((h) => h.question_id === r.questionId);
                if (existingIndex === -1) {
                    wrongHistory.push({
                        question_id: r.questionId,
                        is_correct: false,
                        solved_at: now
                    });
                } else {
                    // 이미 있으면 날짜만 갱신
                    wrongHistory[existingIndex].solved_at = now;
                }
            }
        });

        // 저장
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_SOLVED, JSON.stringify(solvedIds));
            localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(wrongHistory));
        }
    }

    // 오답노트 가져오기 (Question 정보까지 합쳐서 리턴)
    static getWrongNotes(): (UserHistory & { question: Question })[] {
        const history = this.getWrongHistory();
        return history
            .map((h) => {
                const q = questions.find((q) => q.id === h.question_id);
                if (!q) return null;
                return { ...h, question: q };
            })
            .filter((item) => item !== null) as (UserHistory & { question: Question })[];
    }

    // 오답노트에서 문제 삭제 (정답 맞췄을 때)
    static removeWrongNote(questionId: number) {
        let history = this.getWrongHistory();
        history = history.filter((h) => h.question_id !== questionId);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(history));
        }
    }

    // --- 내부 유틸리티 함수들 ---

    private static getSolvedIds(): number[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(STORAGE_KEY_SOLVED);
        return data ? JSON.parse(data) : [];
    }

    private static clearSolvedIds() {
        if (typeof window === "undefined") return;
        localStorage.removeItem(STORAGE_KEY_SOLVED);
    }

    private static getWrongHistory(): UserHistory[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(STORAGE_KEY_WRONG);
        return data ? JSON.parse(data) : [];
    }

    private static groupQuestionsByType(qs: Question[]) {
        return {
            blank: qs.filter((q) => q.type === "blank"),
            passage: qs.filter((q) => q.type === "passage"),
            // Add other types if we start generating/using them
        };
    }

    private static pickRandom<T>(array: T[], count: number): T[] {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    private static shuffleArray<T>(array: T[]): T[] {
        return array.sort(() => 0.5 - Math.random());
    }
}
