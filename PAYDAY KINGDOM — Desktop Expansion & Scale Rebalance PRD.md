PAYDAY KINGDOM — Desktop Expansion & Scale Rebalance PRD  
Document Purpose  
This PRD defines a focused polish pass for the current Payday Kingdom build.  
The goal is not to add new game systems. The goal is to improve desktop composition, scene breathing room, and visual balance so the app feels less phone-first and more like a proper landscape experience while preserving the cozy, screenshot-worthy identity of the project.  
\---  
Why This Exists  
Payday Kingdom began as a cozy, browser-only budgeting game where bills become monsters, payday summons a hero, and the island grows month by month into a shareable world. The original concept and MVP plan centered on a manual-entry, no-bank-sync, screenshot-first experience with a strong emotional hook: make budgeting feel rewarding instead of sterile. The original layout target was a 40% budget panel / 60% scene split with an 8x8 voxel island. The current repo now contains the full routed app, landing page, island scene, separate stores, screenshot capture, achievements, and the live kingdom page assembled from \`KingdomPage\`, \`KingdomPanel\`, and \`SceneViewport\`.  
That means the game already has its core loop. What it needs now is a composition pass. On desktop, the UI reads a little too narrow and a little too phone-shaped. The island also feels slightly crowded, which makes the structures look oversized relative to the available land.  
This pass fixes that.  
\---  
Product Goal  
Make Payday Kingdom feel better on desktop by doing three things together:  
Widen the application shell and give the scene more horizontal dominance  
Increase island real estate by at least 15%  
Reduce the scale of visible scene objects by 10%  
These three changes should work as one composition system, not as disconnected tweaks.  
\---  
Design Principle  
The vibe must remain:  
cozy  
readable  
screenshot-worthy  
playful  
manual and private  
not overloaded  
This is a rebalancing pass, not a content explosion. No feature sludge. No mechanic goblin uprising.  
\---  
Current Architecture Context  
Codex should work inside the existing repo structure, not rebuild the app from scratch.  
Known project structure  
\`src/App.jsx\`  
\`src/pages/KingdomPage.jsx\`  
\`src/pages/LandingPage.jsx\`  
\`src/components/scene/IslandScene.jsx\`  
\`src/components/scene/SceneViewport.jsx\`  
\`src/components/ui/KingdomPanel.jsx\`  
\`src/components/ui/OnboardingFlow.jsx\`  
\`src/store/achievementStore.js\`  
\`src/store/audioStore.js\`  
\`src/store/budgetStore.js\`  
\`src/store/gameStore.js\`  
\`src/store/kingdomStore.js\`  
\`src/store/sceneStore.js\`  
\`src/utils/constants.js\`  
\`src/utils/progression.js\`  
\`src/utils/voxelBuilder.js\`  
\`src/index.css\`  
Known page composition  
The kingdom experience is assembled from:  
\`OnboardingFlow\`  
\`SceneViewport\`  
\`KingdomPanel\`  
The scene viewport already handles HUD/capture/achievement behavior, and the panel already owns income, bills, surplus, settings, and payday trigger interactions.  
\---  
Scope  
In Scope  
desktop layout widening  
desktop scene-to-panel ratio rebalance  
island footprint expansion  
camera reframing for the larger island  
10% visual scale reduction across island objects  
repositioning of monsters, hero, props, and growth-stage structures  
screenshot framing adjustments if needed  
regression checks for tablet and mobile  
Out of Scope  
new gameplay systems  
new progression stages  
new monster types  
new economy mechanics  
backend changes  
bank sync  
auth  
multiplayer  
redesign of onboarding copy  
redesign of landing page copy  
\---  
Success Criteria  
This pass succeeds when the following are all true:  
On desktop, the app looks intentionally landscape-oriented instead of compressed or phone-derived.  
The island has visibly more room for props, buildings, hero, and monsters.  
Buildings, trees, monsters, and hero read as more naturally proportioned relative to the island.  
The scene feels more believable and less crowded.  
Mobile still works without regressions.  
Screenshot output still looks centered, clean, and shareable.  
\---  
Functional Requirements  
FR-1: Widen the Desktop Shell  
Goal  
The playable kingdom view should feel materially wider on desktop.  
Requirements  
Increase the maximum width of the kingdom page shell on desktop.  
Preserve comfortable outer gutters so the app does not smear to the browser edges.  
Keep the panel readable, but let the scene breathe more.  
Maintain the current stacked mobile behavior.  
Target layout behavior  
Desktop targets  
At 1280px and above, the kingdom page should feel wider than the current build.  
At 1440px and above, the scene should clearly dominate the horizontal space.  
At 1720px and above, the layout should still look intentional rather than stretched.  
Recommended ratio targets  
Laptop / standard desktop: about 35 / 65 panel-to-scene  
Wide desktop: about 32 / 68 panel-to-scene  
Implementation notes  
Codex should inspect the container and layout logic in:  
\`src/pages/KingdomPage.jsx\`  
\`src/components/ui/KingdomPanel.jsx\`  
\`src/components/scene/SceneViewport.jsx\`  
\`src/index.css\`  
Possible implementation patterns:  
widen the top-level max width  
change the desktop grid or flex basis  
add a desktop-only breakpoint that reduces panel width growth  
keep the panel capped with a max width so it stops eating runway  
Acceptance criteria  
No horizontal scroll at common desktop widths  
The panel no longer feels oversized relative to the scene  
The scene looks substantially wider than the current build  
Text remains readable and controls remain comfortable  
\---  
FR-2: Increase Island Real Estate by At Least 15%  
Goal  
The island should feel roomier and less cramped.  
Requirement  
Increase the usable footprint of the island by at least 15%.  
Recommended implementation  
The original prototype target used an 8x8 voxel island grid. The cleanest implementation for the current build is to move to a 9x9 top-surface footprint or another equivalent footprint increase that yields at least a 15% increase in usable land.  
A 9x9 grid overshoots the target slightly, but in voxel-land that is fine. Half-tiles are cursed little goblins.  
Additional requirements  
Preserve the floating-island silhouette  
Preserve water margin around the island  
Keep the island centered in the camera frame  
Ensure added land does not make the island feel too flat or too empty  
Growth-stage props should make use of the extra footprint rather than clustering in the old center band  
Files likely involved  
\`src/components/scene/IslandScene.jsx\`  
\`src/utils/voxelBuilder.js\`  
\`src/utils/constants.js\`  
\`src/utils/progression.js\`  
Acceptance criteria  
The top-surface island footprint is visibly larger  
Props and structures have more spacing between them  
There is less crowding at mid and late kingdom stages  
The island still looks balanced from the isometric camera angle  
\---  
FR-3: Reduce Scene Object Scale by 10%  
Goal  
Make everything feel slightly more proportional to the world.  
Requirement  
All major visual scene objects should render at 90% of their previous scale unless a specific exception is necessary.  
Objects included  
hero  
monsters  
buildings  
towers  
roofs  
trees  
rocks  
wells  
fences  
decorative props  
flowers  
growth-stage structures  
Objects not necessarily included  
the island base itself  
HUD text  
panel controls  
screenshot banner text  
Implementation strategy  
Introduce or consolidate a reusable scene scaling constant, for example:  
\`WORLD\_SCALE \= 0.9\`  
or individual constants such as \`CHARACTER\_SCALE\`, \`BUILDING\_SCALE\`, \`PROP\_SCALE\`  
Codex should prefer a centralized scale system over one-off magic-number edits scattered across the scene.  
Additional requirements  
Re-anchor objects so they still sit flush on the ground  
Prevent floating or sinking after scale changes  
Keep hero and monsters readable from the current camera distance  
Rebalance building heights if the roof volumes still feel chunky after a uniform scale drop  
Acceptance criteria  
Visual objects read as approximately 10% smaller overall  
Grounding looks correct  
Nothing clips badly into neighboring props  
The world feels less toy-block crowded and more composed  
\---  
FR-4: Reframe the Camera for the New Composition  
Goal  
After the layout widens and the island grows, the camera must be recalibrated.  
Requirements  
Keep the island centered and legible  
Ensure the larger island still fits comfortably in the viewport  
Preserve the isometric identity  
Avoid over-zooming out so far that hero and monsters become tiny crumbs  
Preserve capture/screenshot composition  
Recommended camera adjustments  
Slightly widen the shot on desktop  
Keep the current isometric rotation feel  
Re-tune orbit limits if the larger island creates awkward edge framing  
Revisit default camera distance or framing offset  
Files likely involved  
\`src/components/scene/IslandScene.jsx\`  
\`src/components/scene/SceneViewport.jsx\`  
\`src/store/sceneStore.js\` if capture framing or renderer sizing is handled there  
Acceptance criteria  
The larger island remains fully readable on desktop  
The scene feels more cinematic and less cramped  
Screenshot capture still produces a centered beauty shot  
\---  
FR-5: Rebalance Spawn and Placement Logic  
Goal  
When the island gets larger and everything gets smaller, placement logic must be updated so the extra space is actually used.  
Requirements  
Monster semicircle or spawn arc should expand outward to match the larger island  
Hero landing point should remain compositionally central  
Growth-stage props should be redistributed so they do not cluster as if the old island size still existed  
Income pile, banner flag, decorative props, and buildings should use the new space  
Acceptance criteria  
The scene reads as deliberately laid out, not merely scaled  
Empty space feels intentional, not accidental  
No stage looks like everything is huddling in the center for warmth  
\---  
FR-6: Preserve Mobile and Tablet Usability  
Goal  
Desktop improves without breaking the existing responsive behavior.  
Requirements  
Keep the mobile stacked layout  
Keep the kingdom panel usable on touch devices  
Ensure the larger island still fits mobile framing  
Ensure the 10% scale reduction does not make gameplay unreadable on smaller screens  
Acceptance criteria  
375px width still works  
tablet widths still work  
no new clipping or overlap issues  
payday button and panel controls remain usable  
\---  
FR-7: Preserve Screenshot-First Identity  
Goal  
The app is still meant to be shared. That cannot regress.  
Requirements  
Capture flow must still work after scene resize and camera changes  
Captured images should benefit from the new roomier composition  
Banner and stats should still look balanced relative to the captured scene  
If necessary, update capture framing to match the new island footprint  
Acceptance criteria  
PNG capture still works  
Composition looks cleaner than before  
Island does not appear cropped or awkwardly distant in captures  
\---  
UX Notes  
This pass should create the following feeling shifts:  
Before  
nice but slightly cramped  
scene feels a little boxed in  
structures look slightly oversized for the island  
desktop still smells faintly of mobile-first constraints  
After  
broader, calmer, more premium  
island has room to breathe  
props feel more believable  
screenshots look cleaner and more flex-worthy  
\---  
Technical Guidance for Codex  
Preferred approach  
Make the changes in this order:  
widen the page shell and rebalance the layout split  
increase island footprint  
introduce global or semi-global scene scaling constants  
reframe camera and placement logic  
verify screenshot capture  
run regression checks for mobile/tablet  
Do not do this  
do not rebuild the app  
do not replace working architecture  
do not convert the layout into a brand new design system  
do not invent unrelated features while touching these files  
do not silently remove responsive behavior  
Codex should leave behind  
clean constants for layout sizing and scene scale  
comments only where genuinely helpful  
no duplicated magic numbers if avoidable  
\---  
Implementation Tickets  
PK-RB-001 — Desktop Shell Widening  
Goal: Make the app materially wider on desktop.  
Tasks:  
increase max-width of the kingdom page container  
rebalance panel vs scene widths  
add breakpoint logic for laptop vs wide desktop  
ensure no horizontal overflow  
Acceptance:  
desktop feels wider  
panel no longer dominates  
scene gets visibly more runway  
\---  
PK-RB-002 — Kingdom Panel Width Cap and Spacing Pass  
Goal: Prevent the left panel from visually overeating the layout.  
Tasks:  
cap panel width  
tune internal spacing only if needed for the new desktop shell  
keep all controls readable  
Acceptance:  
panel remains comfortable and readable  
panel no longer feels like the main attraction on large screens  
\---  
PK-RB-003 — Island Footprint Expansion  
Goal: Add at least 15% more island real estate.  
Tasks:  
expand top-surface island footprint  
preserve floating island silhouette and water framing  
re-center island in scene  
Acceptance:  
island visibly has more room  
late-stage growth has more spacing  
\---  
PK-RB-004 — Global Scene Scale Pass  
Goal: Reduce scene object sizes by 10%.  
Tasks:  
introduce scene scale constants  
apply to hero, monsters, props, and structures  
re-anchor objects to ground plane  
Acceptance:  
objects look smaller and better proportioned  
no floating or sinking  
\---  
PK-RB-005 — Placement and Camera Rebalance  
Goal: Make the larger island and smaller assets feel intentional.  
Tasks:  
widen monster placement arc  
rebalance hero spawn position and center staging  
redistribute kingdom-stage props where needed  
retune camera distance and/or framing offset  
Acceptance:  
scene composition feels cleaner and less cramped  
camera captures the larger world gracefully  
\---  
PK-RB-006 — Screenshot and Responsive Regression Pass  
Goal: Ensure the new composition survives capture and responsive breakpoints.  
Tasks:  
validate capture framing  
validate desktop at 1280, 1440, 1720+  
validate tablet and mobile  
fix any clipping or scale regressions  
Acceptance:  
screenshots still look good  
no mobile regressions  
no broken HUD or panel interactions  
\---  
Test Matrix  
Codex should verify at minimum:  
Desktop  
1280 x 800  
1440 x 900  
1720+ width  
ultrawide sanity check if practical  
Tablet  
1024 x 1366  
820 x 1180  
Mobile  
390 x 844  
375 x 812  
Functional checks  
add/remove bills  
trigger payday  
scene still animates correctly  
achievements dialog still opens  
sound toggle still works  
screenshot capture still works  
onboarding still overlays correctly  
\---  
Final Acceptance Criteria  
The work is done when:  
the app is clearly wider on desktop  
the island has at least 15% more real estate  
major scene objects render about 10% smaller  
the scene looks less crowded and more believable  
the screenshot capture still looks clean  
no critical regressions appear in mobile/tablet flows  
\---  
Codex Handoff Prompt  
Use this prompt directly with Codex:  
\`\`\`text  
You are modifying the existing Payday Kingdom repo. Do not scaffold a new project. Work inside the current architecture.

Goal:  
Perform a desktop composition and scene rebalance pass with three primary outcomes:  
1\. Make the UI wider on desktop  
2\. Increase the island footprint by at least 15%  
3\. Make all major scene objects approximately 10% smaller

Current repo structure to inspect and modify as needed:  
\- src/pages/KingdomPage.jsx  
\- src/components/ui/KingdomPanel.jsx  
\- src/components/scene/SceneViewport.jsx  
\- src/components/scene/IslandScene.jsx  
\- src/store/\*.js where relevant  
\- src/utils/constants.js  
\- src/utils/progression.js  
\- src/utils/voxelBuilder.js  
\- src/index.css

Requirements:  
\- Preserve current gameplay and store architecture  
\- Preserve mobile stacked layout  
\- Widen the desktop shell and rebalance the panel/scene ratio toward roughly 35/65 on standard desktop and 32/68 on wide desktop  
\- Cap the visual growth of the left panel so it stays readable but does not dominate  
\- Increase island footprint by at least 15%; preferred implementation is expanding the top-surface grid from 8x8 to 9x9 or an equivalent solution  
\- Reduce hero, monsters, buildings, trees, rocks, and decorative props to 90% of previous size using centralized constants where possible  
\- Re-anchor all scaled objects so they sit correctly on the ground  
\- Reposition monster arcs, hero staging, and growth-stage props so the added island space is actually used  
\- Reframe the default camera so the larger island still looks centered, readable, and screenshot-worthy  
\- Ensure screenshot capture still frames the island well after the changes  
\- Do not add unrelated features

Deliverables:  
1\. Implement the changes  
2\. Keep code clean and avoid scattered magic numbers  
3\. Run a quick regression pass for desktop, tablet, and mobile  
4\. Summarize exactly what changed and note any tradeoffs

Acceptance checks:  
\- desktop feels materially wider  
\- scene has more horizontal dominance  
\- island visibly has more room  
\- objects visibly look smaller and less crowded  
\- mobile still works  
\- screenshot capture still looks good  
\`\`\`  
\---  
Bottom Line  
This is a world-balance pass.  
Not more systems.  
Not more gimmicks.  
Just better proportions.  
The kingdom already has charm. Now it needs breathing room.  
