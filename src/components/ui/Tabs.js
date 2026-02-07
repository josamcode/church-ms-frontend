import { useState } from 'react';

export default function Tabs({ tabs = [], defaultIndex = 0 }) {
  const [active, setActive] = useState(defaultIndex);

  return (
    <div>
      <div className="flex border-b border-border mb-4 overflow-x-auto" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`
              px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px
              ${i === active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-base hover:border-border'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="animate-fade-in">
        {tabs[active]?.content}
      </div>
    </div>
  );
}
