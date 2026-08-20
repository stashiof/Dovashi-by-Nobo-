import React from 'react';
import { COURSES } from '../data/courses';

interface Props {
  onJoinCourse: (courseId: string) => void;
}

export function CourseSelectionScreen({ onJoinCourse }: Props) {
  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex items-center justify-center p-6 font-['Hind_Siliguri',sans-serif] relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-20 right-20 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-5xl w-full mx-auto relative z-10 space-y-16">
        
        {/* Header section */}
        <div className="text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight font-['Plus_Jakarta_Sans',sans-serif]">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Dovashi</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 font-medium max-w-2xl mx-auto">
            আপনার মাতৃভাষার উপর ভিত্তি করে নিজের পছন্দের কোর্সটি বেছে নিন এবং এআই কোচের সাথে স্পিকিং প্র্যাকটিস শুরু করুন।
          </p>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
          {COURSES.map(course => (
            <div 
              key={course.id} 
              onClick={() => course.status === 'active' && onJoinCourse(course.id)}
              className={`group relative bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-8 border ${course.status === 'active' ? 'border-emerald-500/30 hover:border-emerald-400/60 cursor-pointer shadow-[0_0_40px_rgba(16,185,129,0.1)] hover:shadow-[0_0_60px_rgba(16,185,129,0.2)]' : 'border-slate-800 opacity-70'} flex flex-col transition-all duration-500`}
            >
              <div className="text-6xl mb-6">{course.icon}</div>
              
              <h3 className="text-2xl font-bold text-white mb-3 font-['Plus_Jakarta_Sans',sans-serif]">{course.title}</h3>
              
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full tracking-wide">
                  {course.sourceLanguage}
                </span>
                <span className="text-slate-500">➔</span>
                <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full tracking-wide">
                  {course.targetLanguage}
                </span>
              </div>
              
              <p className="text-slate-400 font-medium mb-8 leading-relaxed flex-grow">
                {course.description}
              </p>
              
              <div className="mt-auto">
                {course.status === 'active' ? (
                  <button className="w-full bg-emerald-500 text-slate-950 px-6 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/20 group-hover:bg-emerald-400 transition-colors">
                    Start Learning
                  </button>
                ) : (
                  <button disabled className="w-full bg-slate-800 text-slate-500 px-6 py-4 rounded-2xl font-bold text-lg cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
