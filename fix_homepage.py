import re

with open("src/pages/index.astro", "r") as f:
    content = f.read()

replacements = [
    (r"text-\[var\(--muted\)\] text-\[var\(--muted\)\]", "text-[var(--muted)]"),
    (r"bg-\[var\(--paper\)\] bg-\[var\(--paper2\)\]", "bg-[var(--paper2)]"),
    (r"border border-\[var\(--line\)\] border-\[var\(--line\)\]", "border border-[var(--line)]"),
    (r"border-\[var\(--line\)\] border-\[var\(--line\)\]", "border-[var(--line)]"),
    (r"bg-\[var\(--paper\)\] bg-\[var\(--ink\)\]", "bg-[var(--paper)]"),
    (r"bg-\[rgba\(27,75,90,0\.15\)\] bg-\[rgba\(27,75,90,0\.15\)\]", "bg-[rgba(27,75,90,0.15)]"),
    (r"bg-\[rgba\(27,75,90,0\.2\)\] bg-\[rgba\(27,75,90,0\.15\)\]", "bg-[rgba(27,75,90,0.15)]"),
    (r"bg-\[rgba\(5,150,105,0\.1\)\] bg-\[rgba\(5,150,105,0\.15\)\]", "bg-[rgba(5,150,105,0.15)]"),
    (r"text-emerald-700 text-\[#059669\]", "text-[#059669]"),
    (r"text-red-500 text-\[#DC2626\]", "text-[#DC2626]"),
    (r"text-emerald-500 text-\[#059669\]", "text-[#059669]"),
    (r"text-cyan-500 text-\[#2E7A8F\]", "text-[#2E7A8F]"),
    (r"text-amber-700 text-\[#D97706\]", "text-[#D97706]"),
    (r"hover:bg-\[#334155\] hover:bg-\[var\(--paper2\)\]", "hover:bg-[var(--paper2)]"),
    (r"border-emerald-100 border-\[rgba\(5,150,105,0\.2\)\]", "border-[rgba(5,150,105,0.2)]"),
    (r"bg-emerald-50 bg-\[rgba\(5,150,105,0\.15\)\]", "bg-[rgba(5,150,105,0.15)]"),
    (r"text-emerald-600 text-\[#059669\]", "text-[#059669]"),
    (r"border-\[rgba\(27,75,90,0\.15\)\] border-\[rgba\(27,75,90,0\.2\)\]", "border-[rgba(27,75,90,0.2)]"),
    (r"bg-\[rgba\(27,75,90,0\.08\)\]/50 bg-\[rgba\(27,75,90,0\.15\)\]/20", "bg-[rgba(27,75,90,0.08)]"),
    (r"text-amber-600 text-\[#D97706\]", "text-[#D97706]"),
    (r"text-cyan-700 text-\[#2E7A8F\]", "text-[#2E7A8F]"),
    (r"text-\[#1B4B5A\] text-\[rgba\(27,75,90,0\.3\)\]", "text-[rgba(27,75,90,0.3)]"),
    (r"bg-\[var\(--paper\)\] hover:bg-\[#334155\]", "bg-[var(--paper)] hover:bg-[var(--paper2)]"),
    (r"border border-\[#1B4B5A\]/30 border-\[var\(--line\)\]", "border border-[var(--line)]"),
    (r"bg-\[var\(--paper\)\] hover:bg-\[rgba\(27,75,90,0\.08\)\]", "bg-[var(--paper)] hover:bg-[rgba(27,75,90,0.08)]"),
    (r"bg-gradient-to-br from-\[rgba\(27,75,90,0\.08\)\] to-\[rgba\(27,75,90,0\.15\)\] from-\[rgba\(27,75,90,0\.08\)\] to-\[#1B4B5A\]", "bg-gradient-to-br from-[rgba(27,75,90,0.08)] to-[#1B4B5A]"),
    (r"bg-gradient-to-br from-cyan-100 to-cyan-200 from-cyan-100 to-\[#2E7A8F\]", "bg-gradient-to-br from-cyan-100 to-[#2E7A8F]"),
    (r"bg-gradient-to-br from-amber-100 to-amber-200 from-amber-100 to-\[#D97706\]", "bg-gradient-to-br from-amber-100 to-[#D97706]"),
    (r"bg-gradient-to-br from-\[rgba\(27,75,90,0\.08\)\] to-slate-50 from-\[var\(--paper2\)\] to-\[var\(--ink2\)\]", "bg-[var(--paper2)]"),
    (r"bg-gradient-to-br from-emerald-50 to-slate-50 from-\[var\(--paper2\)\] to-\[var\(--ink2\)\]", "bg-[var(--paper2)]"),
    (r"tracking-tight text-\[var\(--ink\)\] tracking-tight", "tracking-tight text-[var(--ink)]"),
    (r"tracking-tight text-white mb-6 tracking-tight", "tracking-tight text-white mb-6"),
    
    # Leftover dark mode classes to convert to light mode
    (r"bg-\[#0a0512\]", "bg-[var(--paper2)]"),
    (r"bg-\[#050a14\]", "bg-[var(--paper)]"),
    (r"bg-\[#0f172a\]", "bg-[var(--paper)]"),
    (r"bg-\[#111827\]", "bg-[var(--paper2)]"),
    (r"bg-\[#1c2438\]", "bg-[var(--paper)]"),
    (r"text-slate-200", "text-[var(--ink)]"),
    
    # White text in dark sections should become ink text
    (r"text-white mb-6", "text-[var(--ink)] mb-6"),
    (r"text-white mb-2", "text-[var(--ink)] mb-2"),
    (r"text-white text-lg", "text-[var(--ink)] text-lg"),
    (r"text-white/80", "text-[var(--muted)]"),
    (r"group-hover:text-white/80", "group-hover:text-[var(--ink)]/80"),
    (r"border-white border-\[var\(--line\)\]", "border-[var(--line)]"),
    (r"border-\[var\(--line\)\] border-\[var\(--line\)\]", "border-[var(--line)]"),
    (r"text-\[var\(--ink2\)\] text-\[var\(--muted\)\]", "text-[var(--muted)]"),
    (r"bg-\[var\(--paper2\)\]/80 bg-\[var\(--paper\)\]", "bg-[var(--paper)]")
]

for pattern, repl in replacements:
    content = re.sub(pattern, repl, content)

with open("src/pages/index.astro", "w") as f:
    f.write(content)
