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

    // 1. 새로운 문제 10개를 가져오는 함수
    static getNewSet(): Question[] {
        // 저장된 풀이 기록 가져오기
        let solvedIds = this.getSolvedIds();

        // 생성된 문제 병합 (Static + Generated)
        let currentGeneratedQuestions = this.getGeneratedQuestions();
        let allQuestions = [...questions, ...currentGeneratedQuestions];

        // 각 유형별 필요 개수
        const REQUIRED_COUNTS = {
            vocab_grammar: 4,
            short_reading: 3,
            long_reading: 3,
        };

        // 현재 풀지 않은 문제들로 후보군을 분류
        let availableQuestions = allQuestions.filter((q) => !solvedIds.includes(q.id) && parseInt(q.level) >= 3);
        let byType = this.groupQuestionsByType(availableQuestions);

        // 만약 한 유형이라도 부족하다면? -> 사이클 리셋 (사용자 몰래)
        // 주의: 생성된 문제가 Vocab뿐이므로, Reading이 부족하면 리셋됨.
        if (
            byType.vocab_grammar.length < REQUIRED_COUNTS.vocab_grammar ||
            byType.short_reading.length < REQUIRED_COUNTS.short_reading ||
            byType.long_reading.length < REQUIRED_COUNTS.long_reading
        ) {
            console.log("Internal Reset Triggered: Not enough questions for a full set.");
            // 사이클 초기화: 푼 문제 목록을 비움
            this.clearSolvedIds();
            solvedIds = [];

            // 생성된 문제도 리셋(재생성)
            if (typeof window !== "undefined") {
                const refreshedQuestions = generateQuestions(10);
                localStorage.setItem(STORAGE_KEY_GENERATED, JSON.stringify(refreshedQuestions));
                currentGeneratedQuestions = refreshedQuestions; // Update the reference
            }

            // 전체 문제에서 다시 선택 (정적 + 새로 생성된 문제)
            allQuestions = [...questions, ...currentGeneratedQuestions];
            availableQuestions = allQuestions.filter((q) => !solvedIds.includes(q.id));
            byType = this.groupQuestionsByType(availableQuestions);
        }

        // 각 유형별로 랜덤하게 뽑기
        const setQuestions = [
            ...this.pickRandom(byType.vocab_grammar, REQUIRED_COUNTS.vocab_grammar),
            ...this.pickRandom(byType.short_reading, REQUIRED_COUNTS.short_reading),
            ...this.pickRandom(byType.long_reading, REQUIRED_COUNTS.long_reading),
        ];

        // 결과 섞어서 리턴 (순서를 섞음)
        return this.shuffleArray(setQuestions);
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
            vocab_grammar: qs.filter((q) => q.type === "vocab_grammar"),
            short_reading: qs.filter((q) => q.type === "short_reading"),
            long_reading: qs.filter((q) => q.type === "long_reading"),
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
