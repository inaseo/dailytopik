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
                <h1 className="text-3xl font-extrabold text-gray-900">학습 완료!</h1>
                <p className="text-gray-500">오늘의 학습을 성공적으로 마쳤습니다.</p>
            </div>

            <div className="w-full max-w-xs bg-white rounded-3xl p-8 shadow-xl border border-gray-100 mb-10">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">맞은 문제</span>
                    <span className="text-2xl font-bold text-blue-600">{correct}개</span>
                </div>
                <div className="flex justify-between items-center pb-6 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">틀린 문제</span>
                    <span className="text-2xl font-bold text-red-500">{incorrect}개</span>
                </div>
                <div className="pt-6 text-center">
                    <div className="text-5xl font-black text-gray-800">{score}<span className="text-2xl font-normal text-gray-400">점</span></div>
                </div>
            </div>

            <button
                onClick={onHome}
                className="w-full max-w-xs py-4 rounded-2xl bg-gray-900 text-white font-bold text-lg hover:bg-black transition-colors shadow-lg cursor-pointer"
            >
                홈으로 돌아가기
            </button>
            <p className="mt-4 text-sm text-gray-400">
                * 틀린 문제는 오답노트에서 확인할 수 있습니다.
            </p>
        </div>
    );
}
