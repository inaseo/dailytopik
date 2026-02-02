"use client";

import { Question, UserHistory } from "../types";
import { questions } from "../data/questions";
import { generateQuestions } from "./generator";

// 로컬 스토리지 키 관리
const STORAGE_KEY_WRONG = "topik_wrong_history"; // 영구 저장될 오답 노트
const STORAGE_KEY_GENERATED = "topik_generated_questions"; // 생성된 문제들
const STORAGE_KEY_SERVED = "servedQuestionIds"; // 이미 출제된 문제들 (세션 간 유지)

export class TopikStore {
    // 생성된 문제 로드 (기존 로직 유지)
    private static getGeneratedQuestions(): Question[] {
        if (typeof window === "undefined") return [];
        const stored = localStorage.getItem(STORAGE_KEY_GENERATED);
        return stored ? JSON.parse(stored) : [];
    }

    // 1. 새로운 문제 10개를 가져오는 함수 (Deterministic Selection)
    static getNewSet(): Question[] {
        // 1) 전체 문제 풀 구성 (정적 데이터 + 생성된 데이터)
        const staticQuestions = questions;
        const generatedQuestions = this.getGeneratedQuestions();
        const allQuestions = [...staticQuestions, ...generatedQuestions];

        // 2) 이미 출제된 문제 로드
        let servedIds = this.getServedIds();

        // 3) 가용 문제 필터링
        let available = allQuestions.filter(q => !servedIds.has(q.id));

        // 4) 풀 고갈 체크 및 리셋 (Silent Reset)
        // 만약 가용 문제가 10개 미만이면 기록을 초기화하고 전체 풀에서 다시 시작
        if (available.length < 10) {
            this.clearServedIds();
            servedIds = new Set(); // 메모리 상에서도 초기화
            available = [...allQuestions];
        }

        // 5) 타입별 목표 개수 설정
        const targets: Record<string, number> = {
            blank: 2,
            passage: 1,
            connector: 1,
            underline: 1,
            title: 1,
            ordering: 1,
            sentence: 1,
            mainIdea: 1,
            purpose: 1
        };

        const selected: Question[] = [];
        const selectedIds = new Set<number>();

        // 6) 타입별 문제 선택
        // 헬퍼: 랜덤 셔플 후 n개 선택
        const pickRandom = (pool: Question[], count: number) => {
            const shuffled = [...pool].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        };

        for (const [type, count] of Object.entries(targets)) {
            // 해당 타입이면서 아직 선택되지 않은 가용 문제
            const typePool = available.filter(q => q.type === type && !selectedIds.has(q.id));
            const picked = pickRandom(typePool, count);

            picked.forEach(q => {
                selected.push(q);
                selectedIds.add(q.id);
            });
        }

        // 7) Fallback: 10개가 안 채워졌을 경우 (특정 타입 부족 시)
        // 남은 자리는 타입 무관하게 가용 문제 중에서 채움
        if (selected.length < 10) {
            const remainingCount = 10 - selected.length;
            const leftoverPool = available.filter(q => !selectedIds.has(q.id));
            const filled = pickRandom(leftoverPool, remainingCount);

            filled.forEach(q => {
                selected.push(q);
                selectedIds.add(q.id);
            });
        }

        // 8) 순서 섞기 (인접 중복 타입 방지)
        const finalSet = this.optimizeOrder(selected);

        // 9) 출제된 문제들을 served 목록에 저장 (영구 보존)
        finalSet.forEach(q => servedIds.add(q.id));
        this.saveServedIds(servedIds);

        return finalSet;
    }

    // --- Adjacency Optimization (Retry Shuffle) ---
    private static optimizeOrder(items: Question[]): Question[] {
        let bestOrder = [...items];
        let minConflicts = 100;

        // 최대 30번 시도하여 인접한 동일 타입을 최소화
        for (let i = 0; i < 30; i++) {
            const shuffled = [...items].sort(() => Math.random() - 0.5);
            let conflicts = 0;

            for (let j = 0; j < shuffled.length - 1; j++) {
                if (shuffled[j].type === shuffled[j + 1].type) {
                    conflicts++;
                }
            }

            if (conflicts === 0) return shuffled; // 충돌 없음, 바로 반환

            if (conflicts < minConflicts) {
                minConflicts = conflicts;
                bestOrder = shuffled;
            }
        }
        return bestOrder; // 최선책 반환
    }

    // --- Served IDs Management (localStorage) ---
    private static getServedIds(): Set<number> {
        if (typeof window === "undefined") return new Set();
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SERVED);
            if (!raw) return new Set();
            const parsed = JSON.parse(raw);
            return new Set(Array.isArray(parsed) ? parsed : []);
        } catch {
            return new Set();
        }
    }

    private static saveServedIds(ids: Set<number>) {
        if (typeof window === "undefined") return;
        localStorage.setItem(STORAGE_KEY_SERVED, JSON.stringify(Array.from(ids)));
    }

    private static clearServedIds() {
        if (typeof window === "undefined") return;
        localStorage.removeItem(STORAGE_KEY_SERVED);
    }

    // 2. 결과 제출 및 저장
    static submitResults(results: { questionId: number; isCorrect: boolean }[]) {
        const wrongHistory = this.getWrongHistory();
        const now = new Date().toISOString();

        results.forEach((r) => {
            // 틀린 문제는 오답노트에 영구 저장
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
            localStorage.setItem(STORAGE_KEY_WRONG, JSON.stringify(wrongHistory));
        }
    }

    // 오답노트 가져오기 (Question 정보까지 합쳐서 리턴)
    static getWrongNotes(): (UserHistory & { question: Question })[] {
        const history = this.getWrongHistory();
        // 전체 문제 풀 (static + generated)에서 찾기
        const allQuestions = [...questions, ...this.getGeneratedQuestions()];

        return history
            .map((h) => {
                const q = allQuestions.find((q) => q.id === h.question_id);
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

    private static getWrongHistory(): UserHistory[] {
        if (typeof window === "undefined") return [];
        const data = localStorage.getItem(STORAGE_KEY_WRONG);
        return data ? JSON.parse(data) : [];
    }
}
