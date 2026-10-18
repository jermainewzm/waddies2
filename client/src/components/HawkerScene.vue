<script setup>
// NEW: animated kopitiam scene for the landing page (HomeView.vue)
// display only: no props, no data, no API calls
//
// DECLARATION: the cartoon artwork (the SVG shapes / paths below) was drawn with help from AI (Claude).
// The animations are our own CSS @keyframes (see <style> at the bottom).
</script>

<template>
    <div class="scene">
        <!-- role="img" + aria-label = screen readers read a description instead of hundreds of shapes -->
        <svg
            viewBox="0 0 1200 660"
            role="img"
            aria-label="A busy cartoon kopitiam. Ceiling fans spin over three stalls: a chicken rice stall where a cleaver chops, a wok hei stall where an uncle tosses fried rice over leaping flames, and a kopi stall where an auntie pulls teh tarik. In front, food friends share a marble table while a mynah pecks at the table edge."
        >
            <!-- ===== the scene (each class="a-..." is animated by the CSS below) ===== -->

            <!-- wall, ceiling -->
            <rect width="1200" height="660" fill="#FFF1D0"/>
            <rect width="1200" height="400" fill="url(#p-dots)"/>
            <rect width="1200" height="56" fill="#FFE08A"/>
            <path d="M0 56 H1200" stroke="#1D1A1A" stroke-width="4"/>
            <rect x="520" y="18" width="160" height="16" rx="8" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/>
            <path d="M240 0 V36 M960 0 V36" stroke="#1D1A1A" stroke-width="4"/>
            <use href="#sym-fan" x="160" y="22" width="160" height="40"/>
            <use href="#sym-fan" x="880" y="22" width="160" height="40"/>

            <!-- stall boards -->
            <g stroke="#1D1A1A" stroke-width="4" stroke-linejoin="round">
            <rect x="40" y="80" width="350" height="64" rx="14" fill="#FF5A4E"/>
            <rect x="425" y="80" width="350" height="64" rx="14" fill="#4CC9F0"/>
            <rect x="810" y="80" width="350" height="64" rx="14" fill="#3CC47C"/>
            <rect x="50" y="144" width="330" height="246" fill="#FFFFFF"/>
            <rect x="435" y="144" width="330" height="246" fill="#FFFFFF"/>
            <rect x="820" y="144" width="330" height="246" fill="#FFFFFF"/>
            </g>
            <g font-family="Sour Gummy, sans-serif" font-weight="800" text-anchor="middle">
            <text x="190" y="123" font-size="30" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="5" paint-order="stroke">CHICKEN RICE</text>
            <text x="575" y="123" font-size="30" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="5" paint-order="stroke">WOK HEI</text>
            <text x="960" y="123" font-size="30" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="5" paint-order="stroke">KOPI · TEH</text>
            </g>
            <g font-family="Sour Gummy, sans-serif" font-weight="800" font-size="16" text-anchor="middle">
            <rect x="320" y="96" width="56" height="30" rx="8" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><text x="348" y="117" fill="#1D1A1A">01-15</text>
            <rect x="705" y="96" width="56" height="30" rx="8" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><text x="733" y="117" fill="#1D1A1A">01-08</text>
            <rect x="1090" y="96" width="56" height="30" rx="8" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3"/><text x="1118" y="117" fill="#1D1A1A">01-02</text>
            </g>

            <!-- STALL 1: chicken rice -->
            <path d="M70 176 H262" stroke="#1D1A1A" stroke-width="4"/>
            <g class="a-sway">
            <g fill="#E08A3A" stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round">
            <path d="M96 178 C76 220 84 250 106 254 C128 250 136 220 116 178 Z"/>
            <path d="M160 178 C140 220 148 250 170 254 C192 250 200 220 180 178 Z"/>
            <path d="M224 178 C204 220 212 250 234 254 C256 250 264 220 244 178 Z"/>
            </g>
            <path d="M92 214 C100 222 112 222 120 214 M156 214 C164 222 176 222 184 214 M220 214 C228 222 240 222 248 214" stroke="#B9661F" stroke-width="3" fill="none"/>
            </g>
            <rect x="278" y="168" width="88" height="96" rx="8" fill="#2F3B35" stroke="#1D1A1A" stroke-width="3.5"/>
            <g font-family="Gochi Hand, cursive" font-size="15" fill="#F3EEDF"><text x="286" y="190">steamed $5</text><text x="286" y="210">roasted $5.5</text><text x="286" y="230">drumstick</text><text x="286" y="248">$6.5</text></g>
            <rect x="40" y="300" width="350" height="26" rx="6" fill="#E9E4DA" stroke="#1D1A1A" stroke-width="4"/>
            <rect x="50" y="326" width="330" height="64" fill="url(#p-small-tiles)" stroke="#1D1A1A" stroke-width="4"/>
            <rect x="120" y="284" width="130" height="18" rx="9" fill="#E8B97A" stroke="#1D1A1A" stroke-width="3"/>
            <path d="M140 284 C140 268 186 264 194 284 Z" fill="#F4D6A4" stroke="#1D1A1A" stroke-width="3"/>
            <g class="a-chop"><rect x="200" y="236" width="44" height="30" rx="4" fill="#C9D3D8" stroke="#1D1A1A" stroke-width="3"/><rect x="238" y="258" width="34" height="10" rx="5" fill="#6B3A1E" stroke="#1D1A1A" stroke-width="3"/></g>
            <g stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"><ellipse cx="80" cy="292" rx="22" ry="7" fill="#FFFFFF"/><ellipse cx="80" cy="289" rx="14" ry="4" fill="#FFF3D6"/></g>

            <!-- STALL 2: wok hei uncle -->
            <path d="M455 150 H745 L720 184 H480 Z" fill="#CFD6DA" stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round"/>
            <g stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round">
            <path d="M500 302 C500 252 530 236 560 236 C590 236 620 252 620 302 Z" fill="#FFFFFF"/>
            <path d="M524 244 C520 270 524 290 528 302 M596 244 C600 270 596 290 592 302" fill="none" stroke-width="3"/>
            <path d="M590 238 C610 236 624 252 620 290 L604 290 C606 268 600 254 586 250 Z" fill="#F2F2F2"/>
            <path d="M596 246 L616 280" stroke="#4CC9F0" stroke-width="3"/>
            <circle cx="560" cy="204" r="34" fill="#F2C29B"/>
            <circle cx="526" cy="206" r="8" fill="#F2C29B"/><circle cx="594" cy="206" r="8" fill="#F2C29B"/>
            </g>
            <path d="M534 182 C540 174 552 176 556 172 M560 172 C566 176 578 174 586 182" stroke="#1D1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M542 196 L554 194 M566 194 L578 196" stroke="#1D1A1A" stroke-width="3.5" stroke-linecap="round"/>
            <path d="M544 206 Q548 202 552 206 M568 206 Q572 202 576 206" stroke="#1D1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M548 222 Q560 232 572 222" stroke="#1D1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <ellipse cx="538" cy="218" rx="6" ry="3.5" fill="#FF8FC7"/><ellipse cx="582" cy="218" rx="6" ry="3.5" fill="#FF8FC7"/>
            <rect x="425" y="300" width="350" height="26" rx="6" fill="#E9E4DA" stroke="#1D1A1A" stroke-width="4"/>
            <rect x="435" y="326" width="330" height="64" fill="url(#p-small-tiles)" stroke="#1D1A1A" stroke-width="4"/>
            <g class="a-flame"><path d="M650 304 C634 280 652 266 656 250 C664 270 676 266 680 252 C688 270 702 282 690 304 Z" fill="#FF5A4E" stroke="#1D1A1A" stroke-width="3"/><path d="M660 304 C654 290 664 282 668 272 C672 284 682 290 678 304 Z" fill="#FFD23F"/></g>
            <g class="a-wok">
            <path d="M612 286 C618 270 600 262 590 262" stroke="#F2C29B" stroke-width="16" fill="none" stroke-linecap="round"/>
            <path d="M612 286 C618 270 600 262 590 262" stroke="#1D1A1A" stroke-width="3" fill="none" stroke-linecap="round" opacity=".0"/>
            <path d="M622 278 Q672 318 726 278 Z" fill="#2B2626" stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round"/>
            <path d="M604 284 L626 280" stroke="#1D1A1A" stroke-width="9" stroke-linecap="round"/>
            <path d="M634 280 Q672 296 714 280" stroke="#F7C948" stroke-width="7" fill="none" stroke-linecap="round"/>
            </g>
            <g class="a-rice">
            <circle cx="650" cy="250" r="6" fill="#FFE07A" stroke="#1D1A1A" stroke-width="2"/><circle cx="668" cy="236" r="5" fill="#FF8A3C" stroke="#1D1A1A" stroke-width="2"/>
            <circle cx="686" cy="248" r="6" fill="#FFE07A" stroke="#1D1A1A" stroke-width="2"/><circle cx="702" cy="232" r="4" fill="#3CC47C" stroke="#1D1A1A" stroke-width="2"/>
            <circle cx="676" cy="222" r="4" fill="#FFE07A" stroke="#1D1A1A" stroke-width="2"/><circle cx="658" cy="226" r="3.5" fill="#FF5A4E" stroke="#1D1A1A" stroke-width="2"/>
            </g>
            <g stroke="#1D1A1A" stroke-width="3"><ellipse cx="470" cy="294" rx="26" ry="8" fill="#FFFFFF"/><path d="M452 290 C456 276 486 276 490 290 Z" fill="#F7C948"/></g>
            <g class="a-steam"><path d="M470 270 C462 258 478 250 470 238" stroke="#B9C2C8" stroke-width="5" fill="none" stroke-linecap="round"/></g>

            <!-- STALL 3: teh tarik auntie -->
            <g stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round">
            <path d="M902 302 C902 254 930 240 960 240 C990 240 1018 254 1018 302 Z" fill="#FF8FC7"/>
            <path d="M932 250 L932 302 M988 250 L988 302" fill="none" stroke-width="3"/>
            <rect x="936" y="262" width="48" height="40" rx="6" fill="#FFFFFF"/>
            <circle cx="960" cy="208" r="32" fill="#E9B48A"/>
            <g fill="#2B2626"><circle cx="932" cy="186" r="14"/><circle cx="948" cy="174" r="14"/><circle cx="968" cy="172" r="14"/><circle cx="986" cy="184" r="14"/><circle cx="992" cy="202" r="10"/><circle cx="928" cy="202" r="10"/></g>
            </g>
            <path d="M944 210 Q948 206 952 210 M968 210 Q972 206 976 210" stroke="#1D1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <path d="M950 224 Q960 232 970 224" stroke="#1D1A1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>
            <ellipse cx="940" cy="220" rx="6" ry="3.5" fill="#FF5A4E" opacity=".5"/><ellipse cx="980" cy="220" rx="6" ry="3.5" fill="#FF5A4E" opacity=".5"/>
            <path d="M918 256 C900 236 890 214 892 196" stroke="#E9B48A" stroke-width="13" fill="none" stroke-linecap="round"/>
            <path d="M1004 256 C1024 264 1040 270 1052 270" stroke="#E9B48A" stroke-width="13" fill="none" stroke-linecap="round"/>
            <g stroke="#1D1A1A" stroke-width="3" stroke-linejoin="round"><path d="M878 176 L904 176 L901 200 L881 200 Z" fill="#E9E6E2"/><path d="M1044 262 L1072 262 L1069 290 L1047 290 Z" fill="#E9E6E2"/></g>
            <path class="a-pour" d="M898 200 C930 214 1030 222 1056 262" stroke="#C68A4E" stroke-width="5" fill="none" stroke-linecap="round"/>
            <rect x="810" y="300" width="350" height="26" rx="6" fill="#E9E4DA" stroke="#1D1A1A" stroke-width="4"/>
            <rect x="820" y="326" width="330" height="64" fill="url(#p-small-tiles)" stroke="#1D1A1A" stroke-width="4"/>
            <g stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round">
            <rect x="834" y="250" width="36" height="50" rx="8" fill="#FF8FC7"/><rect x="834" y="244" width="36" height="10" rx="4" fill="#FF5A4E"/>
            <rect x="1090" y="250" width="36" height="50" rx="8" fill="#FFD23F"/><rect x="1090" y="244" width="36" height="10" rx="4" fill="#FF5A4E"/>
            </g>
            <g font-family="Sour Gummy, sans-serif" font-weight="800" font-size="13" fill="#1D1A1A" text-anchor="middle">
            <rect x="1078" y="168" width="60" height="30" rx="5" fill="#FFD23F" stroke="#1D1A1A" stroke-width="3"/><text x="1108" y="188">KOPI</text>
            <rect x="1078" y="204" width="60" height="30" rx="5" fill="#A78BFA" stroke="#1D1A1A" stroke-width="3"/><text x="1108" y="224">TEH</text>
            </g>

            <!-- tile wainscot + floor -->
            <rect x="0" y="390" width="1200" height="40" fill="url(#p-tiles)"/>
            <path d="M0 390 H1200 M0 430 H1200" stroke="#1D1A1A" stroke-width="4"/>
            <rect x="0" y="430" width="1200" height="230" fill="url(#p-floor)"/>

            <!-- plant + tray rack -->
            <g stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round">
            <path d="M58 470 C30 430 40 400 70 420 C70 380 100 380 100 420 C120 392 150 410 128 470 Z" fill="#3CC47C"/>
            <path d="M48 470 L138 470 L126 560 L60 560 Z" fill="#FF5A4E"/>
            </g>
            <g stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round">
            <rect x="1050" y="452" width="120" height="160" rx="6" fill="#FFFFFF"/>
            <path d="M1050 494 H1170 M1050 534 H1170 M1050 574 H1170" stroke-width="3"/>
            <rect x="1062" y="480" width="96" height="12" rx="4" fill="#FF8FC7"/><rect x="1062" y="520" width="96" height="12" rx="4" fill="#4CC9F0"/><rect x="1062" y="560" width="96" height="12" rx="4" fill="#FFD23F"/>
            <rect x="1040" y="404" width="140" height="40" rx="8" fill="#3CC47C"/>
            </g>
            <text x="1110" y="430" text-anchor="middle" font-family="Sour Gummy, sans-serif" font-weight="800" font-size="17" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="4" paint-order="stroke">RETURN TRAY</text>

            <!-- friends at the table -->
            <g class="a-bob"><use href="#ch-milo" x="384" y="362" width="192" height="204"/></g>
            <g class="a-bob2"><use href="#ch-waffle" x="598" y="366" width="210" height="223"/></g>
            <g class="a-chopstick"><path d="M760 446 L708 526 M772 452 L716 528" stroke="#B9661F" stroke-width="5" stroke-linecap="round"/></g>
            <g stroke="#1D1A1A" stroke-width="4" stroke-linejoin="round">
            <path d="M586 590 L614 590 L626 650 L574 650 Z" fill="#2B2626"/>
            <ellipse cx="600" cy="560" rx="250" ry="58" fill="#FBFBF6"/>
            </g>
            <path d="M380 560 C430 572 470 550 530 566 M640 578 C690 562 740 580 800 566" stroke="#D9D9CF" stroke-width="3" fill="none"/>
            <!-- plates -->
            <g stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round">
            <ellipse cx="500" cy="548" rx="46" ry="14" fill="#FFFFFF"/>
            <path d="M472 546 C474 528 504 524 510 546 Z" fill="#FFF3D6"/><path d="M506 546 C508 532 530 532 530 546 Z" fill="#F4D6A4"/>
            <ellipse cx="700" cy="548" rx="46" ry="14" fill="#FFFFFF"/>
            <path d="M672 546 C676 528 724 528 728 546 Z" fill="#B76A2B"/>
            <path d="M574 574 C574 600 626 600 626 574 Z" fill="#FFFFFF"/>
            <ellipse cx="600" cy="574" rx="26" ry="8" fill="#F28B30"/>
            </g>
            <path d="M680 538 L688 532 M700 540 L706 534 M716 540 L722 535" stroke="#3CC47C" stroke-width="3" stroke-linecap="round"/>
            <g class="a-steam"><path d="M500 526 C492 512 508 504 500 490" stroke="#B9C2C8" stroke-width="5" fill="none" stroke-linecap="round"/></g>
            <g class="a-steam2"><path d="M600 560 C592 546 608 538 600 524" stroke="#B9C2C8" stroke-width="5" fill="none" stroke-linecap="round"/></g>
            <g class="a-steam"><path d="M700 526 C692 512 708 504 700 490" stroke="#B9C2C8" stroke-width="5" fill="none" stroke-linecap="round"/></g>
            <!-- kaya toast on a stool, tissue choping a stool -->
            <g stroke="#1D1A1A" stroke-width="3.5"><ellipse cx="290" cy="600" rx="46" ry="14" fill="#FF5A4E"/><path d="M256 606 L262 652 M324 606 L318 652 M290 612 V654"/></g>
            <g class="a-bob3"><use href="#ch-toast" x="200" y="478" width="168" height="178"/></g>
            <g stroke="#1D1A1A" stroke-width="3.5"><ellipse cx="912" cy="606" rx="46" ry="14" fill="#4CC9F0"/><path d="M878 612 L884 652 M946 612 L940 652 M912 618 V654"/></g>
            <use href="#av-tissue" x="868" y="516" width="88" height="88"/>
            <text x="980" y="520" font-family="Gochi Hand, cursive" font-size="24" fill="#1D1A1A" transform="rotate(8 980 520)">chope!</text>
            <path d="M974 528 C960 540 952 544 944 552" stroke="#1D1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- perched mynah -->
            <g class="a-peck"><use href="#sym-mynah" x="782" y="488" width="76" height="46"/></g>
            <!-- speech bubbles -->
            <g class="a-bubble1">
            <path d="M226 392 L394 392 Q408 392 408 406 L408 432 Q408 446 394 446 L430 470 L366 446 L240 446 Q226 446 226 432 L226 406 Q226 392 240 392 Z" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round"/>
            <text x="317" y="427" text-anchor="middle" font-family="Gochi Hand, cursive" font-size="25" fill="#1D1A1A">Makan here can?</text>
            </g>
            <g class="a-bubble2">
            <path d="M806 436 L930 436 Q944 436 944 450 L944 472 Q944 486 930 486 L826 486 L790 506 L808 486 L806 486 Q792 486 792 472 L792 450 Q792 436 806 436 Z" fill="#FFFFFF" stroke="#1D1A1A" stroke-width="3.5" stroke-linejoin="round"/>
            <text x="868" y="469" text-anchor="middle" font-family="Gochi Hand, cursive" font-size="25" fill="#1D1A1A">Can lah! Shiok!</text>
            </g>

            <!-- NEW: mynah flying across the top every 10 seconds (starts off-screen on the left) -->
            <g class="a-fly">
                <use href="#sym-mynah" x="-130" y="150" width="100" height="60"/>
            </g>
        </svg>
    </div>
</template>


<!-- Notes -->

<!-- SVG = shapes drawn with code, so it stays sharp at any screen size (viewBox scales it) -->
<!-- <symbol> + <use> = draw a character once, reuse it many times (like a component, but in SVG) -->
<!-- every moving part has a class like "a-wok"; the CSS @keyframes below moves it in a loop -->
<!-- NEW: a-fly = the mynah that flies across every 10 seconds -->


<style scoped>
/* the frame around the picture */
.scene {
    max-width: 1000px;
    margin: 32px auto 0;
    border: 4px solid var(--ink);
    border-radius: 32px;
    overflow: hidden;              /* cuts off anything outside the rounded corners */
    background: #FFF1D0;
    box-shadow: 8px 8px 0 var(--ink);
}

/* the picture shrinks/grows with the screen (phone to laptop) */
.scene svg {
    display: block;
    width: 100%;
    height: auto;
}

/* ---------- ANIMATIONS ----------
   transform-box: fill-box  = rotate/scale around the shape itself (not the whole picture)
   transform-origin          = the point it turns around
   infinite                  = loop forever                                      */

/* ceiling fans: squash left-right so they look like they're spinning */
.a-spin { animation: spin 1.3s linear infinite; transform-box: fill-box; transform-origin: center; }
@keyframes spin { 0%, 100% { transform: scaleX(1); } 50% { transform: scaleX(.12); } }

/* wok hei uncle: wok tilts back and forth */
.a-wok { animation: wok 1.3s ease-in-out infinite; transform-box: view-box; transform-origin: 700px 300px; }
@keyframes wok { 0%, 100% { transform: rotate(0); } 45% { transform: rotate(-9deg); } }

/* fried rice flying up out of the wok */
.a-rice { animation: rice 1.3s ease-in-out infinite; transform-box: fill-box; }
@keyframes rice { 0%, 100% { transform: translateY(14px); opacity: .2; } 45% { transform: translateY(-22px); opacity: 1; } }

/* flames flicker taller and shorter */
.a-flame { animation: flame .4s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes flame { to { transform: scaleY(1.35) scaleX(.9); } }

/* chicken rice cleaver chopping */
.a-chop { animation: chop 1.1s ease-in-out infinite; transform-box: fill-box; transform-origin: 90% 90%; }
@keyframes chop { 0%, 60%, 100% { transform: rotate(0); } 30% { transform: rotate(-32deg); } }

/* teh tarik stream: dashed line that moves = tea pouring */
.a-pour { stroke-dasharray: 10 8; animation: pour .6s linear infinite; }
@keyframes pour { to { stroke-dashoffset: -36; } }

/* steam rising and fading */
.a-steam  { animation: steam 3s ease-in-out infinite; transform-box: fill-box; }
.a-steam2 { animation: steam 3s ease-in-out 1.4s infinite; transform-box: fill-box; }
@keyframes steam { 0% { transform: translateY(0); opacity: 0; } 30% { opacity: .9; } 100% { transform: translateY(-34px); opacity: 0; } }

/* food friends bobbing (different delays so they don't move together) */
.a-bob  { animation: bob 2.6s ease-in-out infinite; transform-box: fill-box; }
.a-bob2 { animation: bob 2.6s ease-in-out .7s infinite; transform-box: fill-box; }
.a-bob3 { animation: bob 2.6s ease-in-out 1.4s infinite; transform-box: fill-box; }
@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }

/* chopsticks picking up food */
.a-chopstick { animation: chs 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: 100% 0; }
@keyframes chs { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(10deg) translateY(-6px); } }

/* mynah bird pecking twice, then resting */
.a-peck { animation: peck 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 30% 90%; }
@keyframes peck { 0%, 70%, 100% { transform: rotate(0); } 76% { transform: rotate(22deg); } 82% { transform: rotate(0); } 88% { transform: rotate(22deg); } }

/* NEW: mynah flies left to right across the scene, then waits off-screen.
   The whole loop is 10s: flying takes the first 30% (3s), the other 7s it is hidden off the right edge */
.a-fly {
    animation: fly 10s linear infinite;
    animation-delay: 2s;          /* first flight 2s after the page opens */
}
@keyframes fly {
    0%   { transform: translate(0, 0); }
    10%  { transform: translate(480px, -40px); }    /* swoops up... */
    20%  { transform: translate(960px, 10px); }     /* ...and down */
    30%  { transform: translate(1460px, -20px); }   /* off the right edge */
    100% { transform: translate(1460px, -20px); }   /* waits there until the next loop */
}

/* mynah wing flapping (also used by the flying mynah) */
.a-wing { animation: flap .18s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes flap { to { transform: scaleY(-.5); } }

/* speech bubbles taking turns */
.a-bubble1 { animation: bub 6s ease-in-out infinite; }
.a-bubble2 { animation: bub 6s ease-in-out 3s infinite; opacity: 0; }
@keyframes bub { 0%, 45% { opacity: 1; } 50%, 95% { opacity: 0; } 100% { opacity: 1; } }

/* hanging roast chickens swaying */
.a-sway { animation: sway 4s ease-in-out infinite; transform-box: fill-box; transform-origin: 50% 0; }
@keyframes sway { 0%, 100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }

/* characters waving */
.a-wave { animation: wave 2.2s ease-in-out infinite; transform-box: fill-box; transform-origin: 100% 100%; }
@keyframes wave { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-14deg); } }

/* people who turn off animations in their phone/computer settings: everything stays still */
@media (prefers-reduced-motion: reduce) {
    .scene * {
        animation: none !important;
    }
}
</style>