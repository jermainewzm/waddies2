<script setup>

</script>


<!-- template will store all the reusable SVG symbols-->
<template>
     <svg aria-hidden="true" width="0" height="0" style="position:absolute">
    <!-- ===== reusable parts (patterns + characters), drawn once and reused with <use> ===== -->
            <defs>
                <symbol id="av-milo" viewBox="0 0 100 110">
                <path d="M22 34 L78 34 L72 104 L28 104 Z" fill="#EAF6FF" stroke="#1D1A1A" stroke-width="4" stroke-linejoin="round"/>
                <path d="M25 52 L75 52 L71 101 L29 101 Z" fill="#8A5230"/>
                <path d="M16 38 C14 20 30 16 34 22 C36 8 58 8 60 20 C66 12 86 18 84 38 Z" fill="#A86A3D" stroke="#1D1A1A" stroke-width="4" stroke-linejoin="round"/>
                <path d="M64 30 L76 2" stroke="#FF5A4E" stroke-width="6" stroke-linecap="round"/>
                <ellipse cx="40" cy="69" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="41.5" cy="71" rx="4.4" ry="6.2" fill="#1D1A1A"/><ellipse cx="60" cy="69" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="61.5" cy="71" rx="4.4" ry="6.2" fill="#1D1A1A"/>
                <circle cx="43.3" cy="67" r="2" fill="#FFFFFF"/><circle cx="63.3" cy="67" r="2" fill="#FFFFFF"/>
                <ellipse cx="33" cy="80" rx="5" ry="3" fill="#FF8FC7"/><ellipse cx="67" cy="80" rx="5" ry="3" fill="#FF8FC7"/>
                <path d="M43 80 Q50 93 57 80 Z" fill="#7A1E1E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="88.0" rx="3.2" ry="1.8" fill="#FF8FC7"/>
                </symbol>
                <symbol id="av-tissue" viewBox="0 0 100 100">
                <path d="M36 22 C38 6 60 6 62 22" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="4" stroke-linejoin="round"/>
                <rect x="12" y="20" width="76" height="72" rx="12" fill="#4CC9F0" stroke="#1D1A1A" stroke-width="4"/>
                <rect x="34" y="18" width="32" height="10" rx="5" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/>
                <text x="50" y="84" text-anchor="middle" font-family="Gochi Hand, cursive" font-size="15" fill="#1D1A1A">chope</text>
                <ellipse cx="38" cy="51" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="39.5" cy="53" rx="4.4" ry="6.2" fill="#1D1A1A"/><ellipse cx="62" cy="51" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="63.5" cy="53" rx="4.4" ry="6.2" fill="#1D1A1A"/>
                <circle cx="41.3" cy="49" r="2" fill="#FFFFFF"/><circle cx="65.3" cy="49" r="2" fill="#FFFFFF"/>
                <ellipse cx="29" cy="61" rx="5" ry="3" fill="#FF8FC7"/><ellipse cx="71" cy="61" rx="5" ry="3" fill="#FF8FC7"/>
                <path d="M43 60 Q50 73 57 60 Z" fill="#7A1E1E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="68.0" rx="3.2" ry="1.8" fill="#FF8FC7"/>
                </symbol>
                <symbol id="av-toast" viewBox="0 0 100 100">
                <path d="M14 34 C10 12 42 8 50 20 C58 8 90 12 86 34 L86 94 L14 94 Z" fill="#E08A3A" stroke="#1D1A1A" stroke-width="4" stroke-linejoin="round"/>
                <path d="M22 38 C20 22 42 20 50 30 C58 20 80 22 78 38 L78 88 L22 88 Z" fill="#F8DCA4"/>
                <rect x="22" y="48" width="56" height="10" fill="#7CC36A"/>
                <rect x="40" y="40" width="20" height="10" rx="3" fill="#FFE36E" stroke="#1D1A1A" stroke-width="2.5"/>
                <ellipse cx="38" cy="69" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="39.5" cy="71" rx="4.4" ry="6.2" fill="#1D1A1A"/><ellipse cx="62" cy="69" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="63.5" cy="71" rx="4.4" ry="6.2" fill="#1D1A1A"/>
                <circle cx="41.3" cy="67" r="2" fill="#FFFFFF"/><circle cx="65.3" cy="67" r="2" fill="#FFFFFF"/>
                <ellipse cx="30" cy="79" rx="5" ry="3" fill="#FF8FC7"/><ellipse cx="70" cy="79" rx="5" ry="3" fill="#FF8FC7"/>
                <path d="M43 78 Q50 91 57 78 Z" fill="#7A1E1E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="86.0" rx="3.2" ry="1.8" fill="#FF8FC7"/>
                </symbol>
                <symbol id="av-waffle" viewBox="0 0 100 100">
                <path d="M8 76 C8 30 92 30 92 76 Z" fill="#6ED46B" stroke="#1D1A1A" stroke-width="4" stroke-linejoin="round"/>
                <g stroke="#3E9E3B" stroke-width="3"><path d="M30 42 L30 56 M50 36 L50 56 M70 42 L70 56 M20 50 L80 50"/></g>
                <path d="M8 76 L92 76" stroke="#1D1A1A" stroke-width="4" stroke-linecap="round"/>
                <ellipse cx="38" cy="63" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="39.5" cy="65" rx="4.4" ry="6.2" fill="#1D1A1A"/><ellipse cx="62" cy="63" rx="8.5" ry="11" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><ellipse cx="63.5" cy="65" rx="4.4" ry="6.2" fill="#1D1A1A"/>
                <circle cx="41.3" cy="61" r="2" fill="#FFFFFF"/><circle cx="65.3" cy="61" r="2" fill="#FFFFFF"/>
                <ellipse cx="29" cy="71" rx="5" ry="3" fill="#FF8FC7"/><ellipse cx="71" cy="71" rx="5" ry="3" fill="#FF8FC7"/>
                <path d="M44 70 Q50 81 56 70 Z" fill="#7A1E1E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="77.0" rx="3.2" ry="1.8" fill="#FF8FC7"/>
                </symbol>
                <symbol id="ch-milo" viewBox="0 0 160 170"><path d="M68 112 C66 130 58 128 62 150" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M92 112 C94 130 102 128 98 150" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M66 152 C66 144 54 144 50 150 L42 154 C36 156 36 165 44 165 L68 165 C72 165 72 156 66 152 Z" fill="#FF5A4E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><path d="M70 161 L40 161" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M94 152 C94 144 106 144 110 150 L118 154 C124 156 124 165 116 165 L92 165 C88 165 88 156 94 152 Z" fill="#FF5A4E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><path d="M90 161 L120 161" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><use href="#av-milo" x="30" y="8" width="100" height="110"/><g class="a-wave"><path d="M55 80 C41 76 35 62 31 46" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="30" cy="40" r="9.5" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><circle cx="24" cy="34" r="4" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="2.5"/><path d="M27 42 L34 41" stroke="#1D1A1A" stroke-width="2" stroke-linecap="round"/></g><path d="M105 80 C119 86 123 96 127 108" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="128" cy="114" r="9.5" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><circle cx="122" cy="108" r="4" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="2.5"/><path d="M125 116 L132 115" stroke="#1D1A1A" stroke-width="2" stroke-linecap="round"/></symbol>
                <symbol id="ch-toast" viewBox="0 0 160 170"><path d="M62 106 C60 124 52 128 56 150" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M98 106 C100 124 108 128 104 150" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M60 152 C60 144 48 144 44 150 L36 154 C30 156 30 165 38 165 L62 165 C66 165 66 156 60 152 Z" fill="#4CC9F0" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><path d="M64 161 L34 161" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M100 152 C100 144 112 144 116 150 L124 154 C130 156 130 165 122 165 L98 165 C94 165 94 156 100 152 Z" fill="#4CC9F0" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><path d="M96 161 L126 161" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><use href="#av-toast" x="30" y="8" width="100" height="110"/><g class="a-wave"><path d="M45 76 C31 72 25 58 21 42" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="20" cy="36" r="9.5" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><circle cx="14" cy="30" r="4" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="2.5"/><path d="M17 38 L24 37" stroke="#1D1A1A" stroke-width="2" stroke-linecap="round"/></g><path d="M115 76 C129 82 133 92 137 104" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="138" cy="110" r="9.5" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><circle cx="132" cy="104" r="4" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="2.5"/><path d="M135 112 L142 111" stroke="#1D1A1A" stroke-width="2" stroke-linecap="round"/></symbol>
                <symbol id="ch-waffle" viewBox="0 0 160 170"><path d="M64 88 C62 106 54 128 58 150" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M96 88 C98 106 106 128 102 150" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M62 152 C62 144 50 144 46 150 L38 154 C32 156 32 165 40 165 L64 165 C68 165 68 156 62 152 Z" fill="#FF5A4E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><path d="M66 161 L36 161" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><path d="M98 152 C98 144 110 144 114 150 L122 154 C128 156 128 165 120 165 L96 165 C92 165 92 156 98 152 Z" fill="#FF5A4E" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/><path d="M94 161 L124 161" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round"/><use href="#av-waffle" x="30" y="8" width="100" height="110"/><g class="a-wave"><path d="M40 78 C26 74 20 60 16 44" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="15" cy="38" r="9.5" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><circle cx="9" cy="32" r="4" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="2.5"/><path d="M12 40 L19 39" stroke="#1D1A1A" stroke-width="2" stroke-linecap="round"/></g><path d="M120 78 C134 84 138 94 142 106" stroke="#1D1A1A" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="143" cy="112" r="9.5" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><circle cx="137" cy="106" r="4" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="2.5"/><path d="M140 114 L147 113" stroke="#1D1A1A" stroke-width="2" stroke-linecap="round"/></symbol>
                <pattern id="p-dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="2.4" fill="#FFD23F" opacity=".55"/></pattern>
                <pattern id="p-floor" width="70" height="70" patternUnits="userSpaceOnUse"><rect width="70" height="70" fill="#F6E2BE"/><rect width="35" height="35" fill="#EFD3A0"/><rect x="35" y="35" width="35" height="35" fill="#EFD3A0"/><circle cx="12" cy="50" r="2" fill="#D8B77E"/><circle cx="55" cy="16" r="2" fill="#D8B77E"/></pattern>
                <pattern id="p-small-tiles" width="20" height="20" patternUnits="userSpaceOnUse"><rect width="20" height="20" fill="#FFFFFF"/><rect width="10" height="10" fill="#4CC9F0"/><rect x="10" y="10" width="10" height="10" fill="#4CC9F0"/></pattern>
                <pattern id="p-tiles" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="#FFFFFF"/><rect width="14" height="14" fill="#3CC47C"/><rect x="14" y="14" width="14" height="14" fill="#3CC47C"/></pattern>
                <symbol id="sym-fan" viewBox="0 0 160 40">
                <g class="a-spin"><ellipse cx="80" cy="20" rx="76" ry="9" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/></g>
                <g class="a-spin" style="animation-delay:-.65s"><ellipse cx="80" cy="20" rx="76" ry="9" fill="#F4EDE2" stroke="#1D1A1A" stroke-width="3"/></g>
                <circle cx="80" cy="20" r="9" fill="#FF5A4E" stroke="#1D1A1A" stroke-width="3"/>
                </symbol>
                <symbol id="sym-mynah" viewBox="0 0 100 60">
                <path d="M8 36 L0 26 L2 44 Z" fill="#1D1A1A"/>
                <ellipse cx="42" cy="36" rx="30" ry="17" fill="#2B2626" stroke="#1D1A1A" stroke-width="3"/>
                <circle cx="72" cy="24" r="15" fill="#2B2626" stroke="#1D1A1A" stroke-width="3"/>
                <path d="M85 21 L99 26 L85 31 Z" fill="#FFC21A" stroke="#1D1A1A" stroke-width="2.5" stroke-linejoin="round"/>
                <circle cx="76" cy="21" r="5.5" fill="#FFC21A"/><circle cx="77" cy="21" r="2.2" fill="#1D1A1A"/>
                <path class="a-wing" d="M30 32 C34 6 56 4 58 30 Z" fill="#3B3434" stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"/>
                <path d="M38 27 L50 27" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
                </symbol>
            </defs>
     </svg>
</template>

<style>


/* ceiling fans: squash left-right so they look like they're spinning */
.a-spin { animation: art-spin 1.3s linear infinite; transform-box: fill-box; transform-origin: center; }
@keyframes art-spin { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.12); } }

/* characters waving */
.a-wave { animation: art-wave 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 100% 100%; }
@keyframes art-wave { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-14deg); } }

/* people who turn off animations in their settings: everything stays still */
@media (prefers-reduced-motion: reduce) {
    .a-spin, .a-wave { animation: none; }
}
</style>