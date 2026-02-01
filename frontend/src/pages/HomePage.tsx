
import { useNavigate } from 'react-router-dom';

export const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-background-light dark:bg-background-dark text-text-main-light dark:text-text-main-dark font-mono antialiased min-h-screen flex flex-col transition-colors duration-200">
            <header className="border-b border-border-light dark:border-border-dark bg-background-light dark:bg-surface-dark px-6 py-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <span className="material-icons text-primary text-2xl font-black">terminal</span>
                    <span className="font-bold text-xl tracking-tight uppercase text-black dark:text-white">BEPRODUCTIVE_</span>
                </div>
                <div className="hidden md:flex items-center gap-8 font-bold text-sm">
                    <a className="hover:text-primary transition-colors uppercase" href="#">[FEATURES]</a>
                    <a className="hover:text-primary transition-colors uppercase" href="#">[PRICING]</a>
                    <a className="hover:text-primary transition-colors uppercase" href="#">[DOCS]</a>
                    <a className="hover:text-primary transition-colors uppercase" href="#">[LOGIN]</a>
                </div>
                <div className="md:hidden">
                    <span className="material-icons">menu</span>
                </div>
                <div className="hidden md:block">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="bg-black text-white px-6 py-2 text-xs font-bold uppercase hover:bg-gray-800 transition-all shadow-none"
                    >
                        INIT_SYSTEM
                    </button>
                </div>
            </header>
            <main className="flex-grow w-full">
                <section className="w-full bg-background-light px-6 py-20 md:py-32 flex flex-col items-start text-left max-w-7xl mx-auto">
                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white border border-border-light mb-12">
                        <span className="w-2.5 h-2.5 bg-primary"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-black">System Status: Online</span>
                    </div>
                    <div className="w-full mb-10">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold uppercase leading-[0.9] tracking-tighter text-black">
                            Execute Your Day<br />
                            With <span className="bg-primary px-2 text-black inline-block">Precision.</span>
                        </h1>
                    </div>
                    <div className="max-w-3xl mb-12">
                        <p className="text-lg md:text-xl text-text-muted-light font-medium leading-relaxed mb-2">
                            &gt; BEproductive Command Center is a high-performance productivity system for people who think in structure, metrics, and execution.
                        </p>
                        <p className="text-lg md:text-xl text-text-muted-light font-medium leading-relaxed">
                            &gt; Eliminate noise. Focus on execution. Compile your goals.
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6 w-full md:w-auto">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="bg-primary hover:bg-primary-dark text-black font-bold text-lg uppercase px-8 py-4 border-2 border-border-light shadow-tech hover:shadow-tech-hover hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
                        >
                            Initialize System
                        </button>
                        <button className="bg-transparent hover:bg-black hover:text-white text-black font-bold text-lg uppercase px-8 py-4 border-2 border-border-light transition-all flex items-center justify-center gap-2">
                            <span className="material-icons text-sm">description</span> View Documentation
                        </button>
                    </div>
                </section>
                <section className="border-y border-border-light bg-white py-16">
                    <div className="max-w-6xl mx-auto px-6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted-light mb-12 flex items-center gap-2">
                            <span className="material-icons text-sm">schema</span> System Logic
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                            <div className="w-full border border-border-light p-6 bg-background-light relative hover:bg-white transition-colors group h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-primary"><span className="material-icons text-4xl">input</span></div>
                                        <span className="text-xs font-bold text-text-muted-light opacity-50">01</span>
                                    </div>
                                    <h4 className="font-bold uppercase text-xl mb-3">Input</h4>
                                    <p className="text-sm text-text-muted-light leading-snug">Capture tasks and ideas into a raw buffer.</p>
                                </div>
                            </div>
                            <div className="w-full border border-border-light p-6 bg-background-light relative hover:bg-white transition-colors group h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-primary"><span className="material-icons text-4xl">bolt</span></div>
                                        <span className="text-xs font-bold text-text-muted-light opacity-50">02</span>
                                    </div>
                                    <h4 className="font-bold uppercase text-xl mb-3">Actions</h4>
                                    <p className="text-sm text-text-muted-light leading-snug">Execute clearly defined Next Actions.</p>
                                </div>
                            </div>
                            <div className="w-full border border-border-light p-6 bg-background-light relative hover:bg-white transition-colors group h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-primary"><span className="material-icons text-4xl">analytics</span></div>
                                        <span className="text-xs font-bold text-text-muted-light opacity-50">03</span>
                                    </div>
                                    <h4 className="font-bold uppercase text-xl mb-3">Data</h4>
                                    <p className="text-sm text-text-muted-light leading-snug">Track velocity, completion rates, and focus.</p>
                                </div>
                            </div>
                            <div className="w-full border border-border-light p-6 bg-background-light relative hover:bg-white transition-colors group h-full flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="text-primary"><span className="material-icons text-4xl">trending_up</span></div>
                                        <span className="text-xs font-bold text-text-muted-light opacity-50">04</span>
                                    </div>
                                    <h4 className="font-bold uppercase text-xl mb-3">Improvement</h4>
                                    <p className="text-sm text-text-muted-light leading-snug">Optimize workflow based on metrics.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="max-w-6xl mx-auto px-6 py-24">
                    <div className="flex items-end justify-between mb-12 border-b border-border-light pb-4">
                        <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-tight">System Architecture</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white border border-border-light p-8 relative group hover:shadow-tech transition-all">
                            <div className="absolute -top-3 -left-1 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">Mod_01</div>
                            <div className="flex items-start justify-between mt-2 mb-6">
                                <h3 className="text-2xl font-bold uppercase">Dashboard</h3>
                                <span className="material-icons text-primary text-4xl">dashboard</span>
                            </div>
                            <p className="text-base text-gray-600 leading-relaxed font-mono">
                                Your command center. Get immediate situational awareness of today's targets, system status, and pending inputs.
                            </p>
                        </div>
                        <div className="bg-white border border-border-light p-8 relative group hover:shadow-tech transition-all">
                            <div className="absolute -top-3 -left-1 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">Mod_02</div>
                            <div className="flex items-start justify-between mt-2 mb-6">
                                <h3 className="text-2xl font-bold uppercase">Focus Mode</h3>
                                <span className="material-icons text-primary text-4xl">timer</span>
                            </div>
                            <p className="text-base text-gray-600 leading-relaxed font-mono">
                                Single-task execution environment. Block distractions, track deep work sessions, and maintain flow state.
                            </p>
                        </div>
                        <div className="bg-white border border-border-light p-8 relative group hover:shadow-tech transition-all">
                            <div className="absolute -top-3 -left-1 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">Mod_03</div>
                            <div className="flex items-start justify-between mt-2 mb-6">
                                <h3 className="text-2xl font-bold uppercase">Goal Tracking</h3>
                                <span className="material-icons text-primary text-4xl">track_changes</span>
                            </div>
                            <p className="text-base text-gray-600 leading-relaxed font-mono">
                                Align daily operations with strategic objectives. Connect low-level tasks to high-level OKRs.
                            </p>
                        </div>
                        <div className="bg-white border border-border-light p-8 relative group hover:shadow-tech transition-all">
                            <div className="absolute -top-3 -left-1 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">Mod_04</div>
                            <div className="flex items-start justify-between mt-2 mb-6">
                                <h3 className="text-2xl font-bold uppercase">Weekly Review</h3>
                                <span className="material-icons text-primary text-4xl">rate_review</span>
                            </div>
                            <p className="text-base text-gray-600 leading-relaxed font-mono">
                                Analyze performance data. Retro your week. Calibrate the system for the next cycle.
                            </p>
                        </div>
                    </div>
                </section>
                <section className="bg-background-light border-y border-border-light py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <h2 className="text-3xl font-bold uppercase tracking-tight mb-16 text-center">User Compatibility</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-16">
                            <div className="border-l-4 border-primary pl-8 py-2">
                                <h3 className="font-bold uppercase text-xl mb-8 flex items-center gap-3">
                                    <span className="material-icons text-primary bg-black rounded-full p-1 text-xs">check</span> This is for you if...
                                </h3>
                                <ul className="space-y-6 text-base text-black font-medium">
                                    <li className="flex items-start gap-4">
                                        <span className="text-primary font-bold text-lg">&gt;</span>
                                        <span>You think in systems, not just lists.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="text-primary font-bold text-lg">&gt;</span>
                                        <span>You want objective metrics on your personal performance.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="text-primary font-bold text-lg">&gt;</span>
                                        <span>You appreciate raw efficiency over decoration.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="text-primary font-bold text-lg">&gt;</span>
                                        <span>You are an engineer, PM, or operator.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="border-l-4 border-gray-300 pl-8 py-2 mt-12 md:mt-0 opacity-60">
                                <h3 className="font-bold uppercase text-xl mb-8 flex items-center gap-3 text-gray-500">
                                    <span className="material-icons text-gray-100 bg-gray-500 rounded-full p-1 text-xs">close</span> Not for you if...
                                </h3>
                                <ul className="space-y-6 text-base text-gray-500">
                                    <li className="flex items-start gap-4">
                                        <span className="font-bold text-sm pt-1">X</span>
                                        <span>You want a "cute" aesthetic with stickers.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="font-bold text-sm pt-1">X</span>
                                        <span>You spend more time customizing colors than working.</span>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <span className="font-bold text-sm pt-1">X</span>
                                        <span>You find data and charts stressful.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="max-w-6xl mx-auto px-6 py-24">
                    <div className="flex items-center justify-center mb-12">
                        <div className="h-px bg-border-light w-12 mr-4"></div>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">User Logs</h2>
                        <div className="h-px bg-border-light w-12 ml-4"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white border border-border-light p-8 shadow-tech">
                            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm">FE</div>
                                <div>
                                    <div className="text-sm font-bold uppercase">Senior Frontend Engineer</div>
                                    <div className="text-[10px] text-primary bg-black px-1 inline-block uppercase tracking-wider mt-1">Verified User</div>
                                </div>
                            </div>
                            <p className="text-base font-mono leading-relaxed italic">
                                "Finally, a productivity tool that works like I code. No fluff, just pure efficiency. The keyboard shortcuts alone saved me hours this week."
                            </p>
                        </div>
                        <div className="bg-white border border-border-light p-8 shadow-tech">
                            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
                                <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm">PM</div>
                                <div>
                                    <div className="text-sm font-bold uppercase">Product Manager</div>
                                    <div className="text-[10px] text-primary bg-black px-1 inline-block uppercase tracking-wider mt-1">Verified User</div>
                                </div>
                            </div>
                            <p className="text-base font-mono leading-relaxed italic">
                                "I used to drown in Jira tickets. BeProductive's dashboard gives me the high-level view I need to actually prioritize. The weekly review is a game changer."
                            </p>
                        </div>
                    </div>
                </section>
                <section className="border-t border-border-light bg-white py-32 text-center">
                    <div className="max-w-4xl mx-auto px-6">
                        <h2 className="text-5xl md:text-7xl font-bold uppercase mb-12 tracking-tighter leading-none">
                            Stop Managing Tasks.<br />
                            <span className="bg-black text-white px-4">Start Executing.</span>
                        </h2>
                        <div className="flex flex-col items-center gap-6">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="bg-primary hover:bg-primary-dark text-black font-bold text-2xl uppercase px-16 py-6 border-2 border-border-light shadow-tech hover:shadow-tech-hover transition-all flex items-center justify-center gap-3 group w-full md:w-auto"
                            >
                                <span className="material-icons group-hover:rotate-90 transition-transform text-3xl">power_settings_new</span> Initialize System
                            </button>
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                // 14-Day Free Trial // No Credit Card Required //
                            </p>
                        </div>
                    </div>
                </section>
            </main>
            <footer className="border-t border-border-light bg-background-light px-6 py-10 text-xs uppercase text-gray-500">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex gap-8 font-bold text-black">
                        <span>© 2026 BeProductive</span>
                        <a className="hover:text-primary transition-colors cursor-pointer" href="#">Terms</a>
                        <a className="hover:text-primary transition-colors cursor-pointer" href="#">Privacy</a>
                        <a className="hover:text-primary transition-colors cursor-pointer" href="#">System Status</a>
                    </div>
                    <div className="flex gap-4 font-mono text-[10px]">
                        <span className="flex items-center gap-2 px-2 py-1 bg-white border border-border-light text-black font-bold"><span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> ALL SYSTEMS OPERATIONAL</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};
