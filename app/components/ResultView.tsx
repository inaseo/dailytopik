"use client";

interface ResultViewProps {
    total: number;
    correct: number;
    onRestart: () => void;
    onReview: () => void;
}

export default function ResultView({ total, correct, onRestart, onReview }: ResultViewProps) {
    const incorrect = total - correct;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center gap-7 bg-[#F8FAFC]">
            {/* Title */}
            <h1 className="text-[28px] font-bold text-gray-900">
                Session Complete!
            </h1>

            {/* Score Hero */}
            <div className="text-[64px] font-extrabold text-[#4F46E5] leading-none">
                {correct} / {total}
            </div>

            {/* Sub-info */}
            <div className="text-base text-[#94A3B8] font-medium">
                Correct {correct} · Wrong {incorrect}
            </div>

            {/* Actions */}
            <div className="w-full max-w-sm flex flex-col gap-4 mt-6">
                <button
                    onClick={onRestart}
                    className="w-full h-[56px] rounded-[16px] font-semibold bg-blue-600 text-white shadow-[0_6px_18px_rgba(0,0,0,0.12)] hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center text-lg cursor-pointer"
                >
                    New Questions
                </button>

                <button
                    onClick={onReview}
                    className="w-full h-[56px] rounded-[16px] font-semibold border-2 border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98] flex items-center justify-center text-lg cursor-pointer"
                >
                    Review Mistakes
                </button>
            </div>
        </div>
    );
}
