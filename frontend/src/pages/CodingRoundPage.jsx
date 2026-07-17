import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, Check, ArrowRight, Loader2 } from 'lucide-react';
import * as codingService from '../services/codingService';
import { useInterview } from '../context/InterviewContext';

const CodingRoundPage = () => {
    const navigate = useNavigate();
    const { sessionId, setSessionId, setCurrentRound } = useInterview();
    
    const [problems, setProblems] = useState([]);
    const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
    const [code, setCode] = useState('// Write your code here');
    const [language, setLanguage] = useState('java');
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [output, setOutput] = useState(null);

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const res = await codingService.startCodingRound();
                const probs = res.data.data;
                setProblems(probs);
                setCurrentRound('CODING');
                if (probs.length > 0) {
                    setCode('// Write your code here');
                }
            } catch (err) {
                console.error('Failed to start coding round', err);
            }
        };
        fetchProblems();
    }, []);

    const problem = problems[currentProblemIndex];

    const handleRunCode = async () => {
        setIsRunning(true);
        setOutput(null);
        try {
            const res = await codingService.runCode({
                sessionId,
                problemId: problem.id,
                language: language.toUpperCase(),
                code,
                submissionType: 'RUN'
            });
            setOutput(res.data.data);
        } catch (err) {
            setOutput({ status: 'ERROR', error: 'Failed to run code on server.' });
        } finally {
            setIsRunning(false);
        }
    };

    const handleSubmitCode = async () => {
        setIsSubmitting(true);
        try {
            const res = await codingService.submitCode({
                sessionId,
                problemId: problem.id,
                language: language.toUpperCase(),
                code,
                submissionType: 'SUBMIT'
            });
            
            // Go to next problem or next round
            if (currentProblemIndex < problems.length - 1) {
                setCurrentProblemIndex(prev => prev + 1);
                setCode('// Write your code here');
                setOutput(null);
            } else {
                alert("Coding Round Complete! Moving to HR Round...");
                navigate('/interview/hr');
            }
        } catch (err) {
            alert('Submission failed.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!problem) {
        return (
            <div className="min-h-screen bg-techwing-dark flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-techwing-gold animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen bg-techwing-dark flex flex-col text-white">
            <header className="p-4 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]">
                <h1 className="text-xl font-bold text-techwing-gold">Live Coding Round</h1>
                <div className="flex gap-4 items-center">
                    <span className="text-sm text-gray-400">Problem {currentProblemIndex + 1} of {problems.length}</span>
                    <button onClick={() => navigate('/interview/hr')} className="btn-secondary text-sm px-4 py-2">
                        Skip to Next Round
                    </button>
                </div>
            </header>

            <main className="flex-grow flex flex-col lg:flex-row overflow-hidden">
                {/* Left Panel: Description */}
                <div className="w-full lg:w-1/3 border-r border-white/10 p-6 overflow-y-auto custom-scrollbar">
                    <h2 className="text-2xl font-bold mb-4">{problem.title}</h2>
                    <div className="flex gap-2 mb-6">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${problem.difficulty === 'EASY' ? 'bg-green-500/20 text-green-400' : problem.difficulty === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                            {problem.difficulty}
                        </span>
                    </div>
                    
                    <div className="prose prose-invert mb-8 whitespace-pre-wrap text-gray-300">
                        {problem.description}
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-techwing-orange">Sample Constraints</h3>
                        <div className="bg-[#1e1e1e] p-4 rounded-lg font-mono text-sm space-y-2 text-gray-400">
                            {problem.constraints || "None provided"}
                        </div>

                        <h3 className="font-bold text-techwing-orange">Example Test Case</h3>
                        <div className="bg-[#1e1e1e] p-4 rounded-lg font-mono text-sm space-y-2">
                            <p><span className="text-gray-400">Input:</span> {problem.sampleInput}</p>
                            <p><span className="text-gray-400">Output:</span> {problem.sampleOutput}</p>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor & Console */}
                <div className="w-full lg:w-2/3 flex flex-col">
                    <div className="h-12 bg-[#1e1e1e] border-b border-black flex items-center px-4 justify-between">
                        <select 
                            className="bg-[#2d2d2d] text-white border-none rounded px-3 py-1 text-sm outline-none"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="java">Java</option>
                            <option value="python">Python</option>
                        </select>
                        
                        <div className="flex gap-3">
                            <button 
                                onClick={handleRunCode}
                                disabled={isRunning}
                                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                Run Code
                            </button>
                            <button 
                                onClick={handleSubmitCode}
                                disabled={isSubmitting}
                                className="flex items-center gap-2 bg-techwing-orange hover:bg-[#c45816] px-4 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Submit
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-grow relative">
                        <Editor
                            height="100%"
                            theme="vs-dark"
                            language={language}
                            value={code}
                            onChange={(val) => setCode(val)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                padding: { top: 16 }
                            }}
                        />
                    </div>

                    {/* Console Output */}
                    <div className={`h-48 bg-[#1e1e1e] border-t border-black p-4 overflow-y-auto ${!output ? 'hidden' : ''}`}>
                        <h3 className="text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Console Output</h3>
                        {output && (
                            <div className="font-mono text-sm space-y-2">
                                <p className={`font-bold ${output.status === 'PASSED' ? 'text-green-400' : 'text-red-400'}`}>
                                    Status: {output.status}
                                </p>
                                {output.aiFeedback && (
                                    <div className="bg-techwing-orange/10 p-2 rounded mb-2">
                                        <span className="text-techwing-orange font-bold text-xs">AI Feedback:</span>
                                        <p className="text-gray-300 mt-1">{output.aiFeedback}</p>
                                    </div>
                                )}
                                {output.stdout && (
                                    <div>
                                        <span className="text-gray-500">Stdout:</span>
                                        <pre className="text-gray-300 mt-1 whitespace-pre-wrap">{output.stdout}</pre>
                                    </div>
                                )}
                                {output.stderr && (
                                    <div>
                                        <span className="text-gray-500">Stderr:</span>
                                        <pre className="text-red-400 mt-1 whitespace-pre-wrap">{output.stderr}</pre>
                                    </div>
                                )}
                                {output.error && (
                                    <pre className="text-red-400 whitespace-pre-wrap">{output.error}</pre>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CodingRoundPage;
