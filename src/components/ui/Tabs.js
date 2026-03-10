import { useEffect, useId, useState } from 'react';

export default function Tabs({ tabs = [], defaultIndex = 0 }) {
  const [active, setActive] = useState(defaultIndex);
  const baseId = useId();

  useEffect(() => {
    if (active >= tabs.length) {
      setActive(Math.max(tabs.length - 1, 0));
    }
  }, [active, tabs.length]);

  if (!tabs.length) return null;

  const activeTab = tabs[active] || tabs[0];
  const panelId = `${baseId}-panel`;
  const tabId = `${baseId}-tab-${active}`;

  const handleKeyDown = (event, index) => {
    if (!tabs.length) return;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive((index + 1) % tabs.length);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive((index - 1 + tabs.length) % tabs.length);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActive(0);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActive(tabs.length - 1);
    }
  };

  return (
    <div className="w-full min-w-0 max-w-full space-y-4">
      <div className="overflow-hidden rounded-lg border border-border/70 bg-gradient-to-b from-surface to-surface-alt/35 p-2 shadow-sm">
        <div
          className="scrollbar-none max-w-full overflow-x-auto overscroll-x-contain pb-1"
          role="tablist"
          aria-orientation="horizontal"
        >
          <div className="inline-flex min-w-max items-center gap-2">
            {tabs.map((tab, i) => (
              <button
                key={i}
                type="button"
                id={`${baseId}-tab-${i}`}
                role="tab"
                aria-controls={panelId}
                aria-selected={i === active}
                tabIndex={i === active ? 0 : -1}
                onClick={() => setActive(i)}
                onKeyDown={(event) => handleKeyDown(event, i)}
                className={`
                  group relative overflow-hidden rounded-xl px-4 py-0 text-sm font-semibold whitespace-nowrap
                  transition-all duration-200 focus:outline-none
                `}
              >
                <span className="relative flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full transition-all duration-200 ${i === active
                        ? 'bg-primary shadow-[0_0_0_4px_rgba(59,130,246,0.12)]'
                        : 'bg-border group-hover:bg-primary/35'
                      }`}
                    aria-hidden="true"
                  />
                  <span>{tab.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="scrollbar-none w-full max-w-full overflow-x-auto">
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={tabId}
          className="w-full min-w-0 animate-fade-in"
        >
          {activeTab?.content}
        </div>
      </div>
    </div>
  );
}
