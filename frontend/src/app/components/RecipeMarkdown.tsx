import React from 'react';

interface RecipeMarkdownProps {
  markdown: string;
}

export function RecipeMarkdown({ markdown }: RecipeMarkdownProps) {
  const lines = markdown.split('\n');

  return (
    <div className="space-y-2 text-sm text-foreground">
      {lines.map((line, i) => {
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="text-xl font-black text-primary uppercase tracking-tighter mt-2 mb-3">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={i} className="text-base font-black text-primary uppercase tracking-widest mt-4 mb-2">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h4 key={i} className="text-sm font-black text-primary/80 uppercase tracking-wider mt-3 mb-1">
              {line.slice(4)}
            </h4>
          );
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-primary font-black mt-0.5">•</span>
              <span className="text-foreground/80 leading-relaxed">{renderInline(line.slice(2))}</span>
            </div>
          );
        }
        const numberedMatch = line.match(/^(\d+)\.\s(.+)/);
        if (numberedMatch) {
          return (
            <div key={i} className="flex gap-3 items-start">
              <span className="size-5 min-w-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-black mt-0.5">
                {numberedMatch[1]}
              </span>
              <span className="text-foreground/80 leading-relaxed">{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }
        if (line.trim() === '') return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-foreground/80 leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-black text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
