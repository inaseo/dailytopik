"use client";

interface ResultViewProps {
    total: number;
    correct: number;
    onHome: () => void;
}

export default function ResultView({ total, correct, onHome }: ResultViewProps) {
    const incorrect = total - correct;
    const score = Math.round((correct / total) * 100);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 animate-in zoom-in-95 duration-500 bg-white">
            <div className="text-center space-y-2 mb-10">
                <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Session Complete!</h1>
                <p className="text-gray-500">You’ve successfully finished today’s practice.</p>
            </div>

            <div className="w-full max-w-xs bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-10">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">Correct</span>
                    <span className="text-2xl font-bold text-teal-600">{correct}</span>
                </div>
                <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Incorrect</span>
                    <span className="text-2xl font-bold text-rose-500">{incorrect}</span>
                </div>
                <div className="pt-6 text-center">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-black text-gray-900">{correct}</span>
                        <span className="text-2xl font-bold text-gray-400">/ {total}</span>
                    </div>
                </div>
            </div>

            <button
                onClick={onHome}
                className="w-full max-w-xs py-4 rounded-2xl bg-gray-900 text-white font-bold text-lg hover:bg-black transition-colors shadow-lg cursor-pointer"
            >
                Back to Home
            </button>
            <p className="mt-4 text-sm text-gray-400">
                * You can review incorrect questions in the Review Mistakes page.
            </p>
        </div>
    );
}
