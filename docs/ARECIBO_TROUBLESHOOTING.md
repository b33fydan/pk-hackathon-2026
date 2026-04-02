# Arecibo Troubleshooting Guide

**For:** QA, developers, and support  
**Status:** Quick reference for common issues  
**Last Updated:** March 23, 2026

---

## Performance Issues

### Problem: Modal Opens Slowly

**Symptoms:** >1 second delay when opening recap

**Diagnostics:**
```javascript
// In console
const start = performance.now();
// Open modal
const end = performance.now();
console.log('Modal open time:', end - start, 'ms');
```

**Likely Causes:**
1. **Large archive (50+ weeks)** → Archive loading is slow
2. **LLM call blocked** → Waiting for response (should timeout at 8s)
3. **Canvas rendering** → Large grid unoptimized

**Fixes:**

1. **Check archive load time:**
   ```javascript
   const start = performance.now();
   const archive = JSON.parse(localStorage.getItem('arecibo_archive'));
   console.log('Archive parse:', performance.now() - start, 'ms');
   ```
   - If >100ms: Archive too large, consider cleanup
   - Solution: Delete archives >1 year old

2. **Check LLM timeout:**
   ```javascript
   // In expressionEngine.js
   // Verify timeout is set to 8000ms (not higher)
   setTimeout(() => reject(...), 8000)
   ```

3. **Profile canvas rendering:**
   ```javascript
   performance.mark('grid-start');
   // Render grid
   performance.mark('grid-end');
   performance.measure('grid', 'grid-start', 'grid-end');
   ```
   - If >500ms: Reduce scale factor or optimize canvas code

---

### Problem: PNG Export Hangs

**Symptoms:** Clicking "Download PNG" shows spinner forever

**Diagnostics:**
```javascript
// In console
window.requestIdleCallback(() => {
  console.log('Browser is idle - export should be possible');
});
```

**Likely Causes:**
1. **Canvas too large** → Memory pressure
2. **Toastify blocker** → UI state stuck
3. **Browser out of memory** → Garbage collection
4. **Image encoding timeout** → libpng slow

**Fixes:**

1. **Reduce canvas size:**
   - Current: 1200×630 (standard social media)
   - If slow: try 600×315 (half) and scale up CSS

2. **Check for UI thread blocking:**
   ```javascript
   // In AreciboShareCard.jsx
   const exportImage = async () => {
     // Break into chunks with await
     await new Promise(r => setTimeout(r, 0));
     // Continue...
   };
   ```

3. **Add progress feedback:**
   ```javascript
   toast.loading('Exporting... (should take <1s)');
   setTimeout(() => {
     // If still loading, something is wrong
     toast.error('Export timeout - try again');
   }, 5000);
   ```

---

### Problem: Archive Loads Very Slowly

**Symptoms:** "View Archive" button sluggish, list render takes forever

**Diagnostics:**
```javascript
// Check archive size
const archive = JSON.parse(localStorage.getItem('arecibo_archive'));
const bytes = JSON.stringify(archive).length;
console.log('Archive size:', bytes, 'bytes', (bytes/1024/1024).toFixed(2), 'MB');

// Expected: <5MB for 52 weeks
```

**Likely Causes:**
1. **Too many old weeks** (>52 weeks stored)
2. **Large pixelData per week** (73×23 grid = 1.7KB each)
3. **No pagination in archive UI**

**Fixes:**

1. **Cleanup old archives (>1 year):**
   ```javascript
   const archive = JSON.parse(localStorage.getItem('arecibo_archive') || '[]');
   const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
   const cleaned = archive.filter(week => {
     const savedAt = new Date(week.savedAt).getTime();
     return savedAt > oneYearAgo;
   });
   localStorage.setItem('arecibo_archive', JSON.stringify(cleaned));
   console.log('Removed', archive.length - cleaned.length, 'old weeks');
   ```

2. **Add pagination to AreciboArchive:**
   ```javascript
   // Show 10 weeks at a time, lazy load more
   const [page, setPage] = useState(0);
   const perPage = 10;
   const visible = archive.slice(page * perPage, (page + 1) * perPage);
   ```

3. **Compress pixelData:**
   - Current: `number[][]` (verbose in JSON)
   - Alternative: `Uint8Array` (more compact)

---

## LLM Issues

### Problem: "Arecibo LLM timeout"

**Symptoms:** Console warning, falls back to templates

**Diagnostics:**
```javascript
// Check if LLM service is configured
console.log('LLM Service:', window.llmService);
// If undefined, API key not set

// Check network latency
fetch('https://api.anthropic.com/v1/messages', {
  method: 'OPTIONS',
}).then(r => console.log('Network OK')).catch(e => console.error('Network error'));
```

**Likely Causes:**
1. **Network latency >8s** (API call slow)
2. **API key invalid** (auth fails)
3. **API overloaded** (Anthropic servers busy)
4. **Timeout value too low** (8s okay? try 10s)

**Fixes:**

1. **Extend timeout (if necessary):**
   ```javascript
   // In expressionEngine.js
   const timeoutMs = 10000; // 10 seconds
   setTimeout(() => reject(...), timeoutMs);
   ```

2. **Verify API key:**
   ```javascript
   const apiKey = process.env.ANTHROPIC_API_KEY;
   console.assert(apiKey, 'Missing ANTHROPIC_API_KEY');
   ```

3. **Check API status:**
   - Visit: https://status.anthropic.com
   - If incident: wait for resolution

4. **Implement retry logic:**
   ```javascript
   const maxRetries = 2;
   for (let i = 0; i < maxRetries; i++) {
     try {
       return await callAreciboLLM(...);
     } catch (e) {
       if (i < maxRetries - 1) await sleep(1000); // Wait 1s, retry
     }
   }
   return generateFromTemplates(...); // Give up, use templates
   ```

---

### Problem: LLM Response Invalid JSON

**Symptoms:** Console error "Failed to parse Arecibo JSON"

**Diagnostics:**
```javascript
// In expressionEngine.js callAreciboLLM()
const response = '...'; // LLM response
const jsonStr = response
  .replace(/^```json\n?/, '')
  .replace(/\n?```$/, '')
  .trim();
console.log('Trying to parse:', jsonStr.substring(0, 100));
try {
  const intent = JSON.parse(jsonStr);
} catch (e) {
  console.error('Parse error:', e.message);
  console.error('JSON string:', jsonStr);
}
```

**Likely Causes:**
1. **LLM hallucinated invalid JSON** (rare but happens)
2. **Markdown not stripped** (``json``` still present)
3. **LLM returned non-JSON** (text instead of JSON)

**Fixes:**

1. **Improve markdown stripping:**
   ```javascript
   let jsonStr = response.trim();
   // Remove markdown code fences
   jsonStr = jsonStr.replace(/^```(?:json)?\s*\n?/, '');
   jsonStr = jsonStr.replace(/\n?```\s*$/, '');
   // Remove common artifacts
   jsonStr = jsonStr.replace(/^\/\/.*\n/gm, ''); // Remove comments
   return JSON.parse(jsonStr);
   ```

2. **Add JSON validation before parsing:**
   ```javascript
   if (!jsonStr.startsWith('{')) {
     throw new Error('Response does not start with JSON object');
   }
   ```

3. **Log full response for debugging:**
   ```javascript
   if (process.env.DEBUG_ARECIBO) {
     console.log('Full LLM response:', response);
   }
   ```

---

### Problem: LLM Output Fails Validation

**Symptoms:** Console warning "Arecibo LLM validation failed", falls back

**Diagnostics:**
```javascript
const validation = validateAreciboIntent(intent, weekData);
console.log('Validation errors:', validation.errors);
console.log('Validation warnings:', validation.warnings);
```

**Likely Causes:**
1. **Therapy-speak detected** (LLM used forbidden language)
2. **Fake triumph** (reframed hard week)
3. **Patronizing tone** (e.g., "you got this!")
4. **Missing section** (incomplete response)

**Fixes:**

1. **Improve system prompt in areciboPrompts.js:**
   ```javascript
   // Add to system prompt:
   "CRITICAL: Never use therapy-speak, guilt-language, or fake triumph.
    Hard weeks deserve dignity, not reframing."
   ```

2. **Add few-shot examples:**
   ```javascript
   // Show examples of good vs bad tone
   systemPrompt += `
   
   GOOD TONE (hard week):
   "2 of 5 bills paid. 3 of 7 habits completed. This was a hard week. 
    You showed up anyway."
   
   BAD TONE (hard week):
   "You faced challenges this week, which are opportunities for growth! 
    Remember, you're stronger than you think!"
   ```

3. **Retry with different prompt:**
   ```javascript
   if (!validation.valid) {
     console.warn('LLM output invalid, retrying with stricter prompt...');
     return callAreciboLLM({
       ...params,
       strictMode: true,  // Add flag for harsher guardrails
     });
   }
   ```

---

## UI/UX Issues

### Problem: Sections Don't Expand/Collapse

**Symptoms:** Click section header, nothing happens

**Diagnostics:**
```javascript
// In console
document.querySelectorAll('.section').forEach(s => {
  s.addEventListener('click', (e) => {
    console.log('Section clicked:', e.target.textContent);
  });
});
// Click a section and check console
```

**Likely Causes:**
1. **State not connected** (Redux/store issue)
2. **CSS animation stuck** (height doesn't change)
3. **Click handler not attached** (React event delegation broke)
4. **Modal z-index buried** (overlay blocking clicks)

**Fixes:**

1. **Check state management:**
   ```javascript
   // In AreciboRecap.jsx
   const { selectedSectionIndex, setSelectedSection } = useWeeklyStore();
   console.log('Selected section:', selectedSectionIndex);
   ```

2. **Verify CSS transitions:**
   ```javascript
   // In styles.module.css
   .section {
     transition: max-height 0.3s ease-out;
     max-height: 500px;
     overflow: hidden;
   }
   .section.collapsed {
     max-height: 0;
   }
   ```

3. **Check z-index layering:**
   ```javascript
   // Get computed styles
   const modal = document.querySelector('.recapModal');
   console.log('Modal z-index:', getComputedStyle(modal).zIndex);
   // Should be higher than any overlay
   ```

---

### Problem: Share Card Text Overlaps on Mobile

**Symptoms:** 375px width, card text runs off edge

**Diagnostics:**
```javascript
// In browser DevTools
const shareCard = document.querySelector('.shareCard');
console.log('Card width:', shareCard.offsetWidth);
console.log('Card scrollWidth:', shareCard.scrollWidth);
if (shareCard.scrollWidth > shareCard.offsetWidth) {
  console.error('Text overflow detected!');
}
```

**Fixes:**

1. **Use responsive font sizing:**
   ```css
   .shareCard {
     font-size: clamp(12px, 2vw, 16px);
   }
   ```

2. **Add text truncation:**
   ```css
   .shareCardText {
     overflow: hidden;
     text-overflow: ellipsis;
     display: -webkit-box;
     -webkit-line-clamp: 2;
     -webkit-box-orient: vertical;
   }
   ```

3. **Test all breakpoints:**
   ```javascript
   [320, 375, 425, 768, 1024].forEach(width => {
     window.resizeTo(width, 800);
     console.log(`Tested ${width}px`);
   });
   ```

---

### Problem: Dark Mode Contrast Too Low

**Symptoms:** Text hard to read on dark background

**Validation:**
```javascript
// Check WCAG AA compliance
const textColor = '#e2e8f0';
const bgColor = '#0f172a';
// Use online tool: https://webaim.org/resources/contrastchecker/
// Expected: >4.5:1 for normal text (we have 18.5:1 ✓)
```

**If contrast is low:**

1. **Increase text lightness:**
   ```css
   :root {
     --color-text: #f0f0f0; /* was #e2e8f0 */
   }
   ```

2. **Increase background darkness:**
   ```css
   :root {
     --color-bg: #000000; /* was #0f172a */
   }
   ```

3. **Use color contrast checker:**
   - Tool: https://webaim.org/resources/contrastchecker/
   - Verify AA or AAA compliance

---

## Data Issues

### Problem: Archive Not Persisting

**Symptoms:** Close and reopen, archive gone

**Diagnostics:**
```javascript
// Check localStorage directly
console.log(localStorage.getItem('arecibo_archive'));

// Check localStorage quota
navigator.storage.estimate().then(est => {
  console.log('Storage usage:', est.usage, 'of', est.quota);
  console.log('Percent used:', (est.usage / est.quota * 100).toFixed(1) + '%');
});
```

**Likely Causes:**
1. **localStorage quota exceeded** (>5MB on some browsers)
2. **Private browsing mode** (localStorage cleared on close)
3. **localStorage disabled** (user privacy settings)

**Fixes:**

1. **Check quota before saving:**
   ```javascript
   const archiveStr = JSON.stringify(archive);
   navigator.storage.estimate().then(est => {
     if (est.usage + archiveStr.length > est.quota * 0.9) {
       console.warn('Storage quota approaching, cleaning old archives');
       // Delete oldest week
     }
   });
   ```

2. **Use IndexedDB as fallback:**
   ```javascript
   // If localStorage fails
   if (!localStorage) {
     const db = await openDB('arecibo');
     await db.put('archives', archive);
   }
   ```

3. **Inform user in UI:**
   ```javascript
   if (navigator.storage?.persist) {
     navigator.storage.persist().then(persisted => {
       if (!persisted) {
         console.warn('Storage not persistent (private mode?)');
       }
     });
   }
   ```

---

### Problem: Old Archives Corrupt on Update

**Symptoms:** After version update, old archives won't load

**Diagnostics:**
```javascript
const oldArchive = localStorage.getItem('arecibo_archive');
try {
  JSON.parse(oldArchive);
  console.log('Archive format OK');
} catch (e) {
  console.error('Archive corrupted:', e.message);
}
```

**Fixes:**

1. **Add schema versioning:**
   ```javascript
   const archive = {
     version: 2,  // Increment on breaking changes
     data: [...],
   };
   localStorage.setItem('arecibo_archive', JSON.stringify(archive));
   ```

2. **Migrate old schemas:**
   ```javascript
   let archive = JSON.parse(localStorage.getItem('arecibo_archive') || '{}');
   if (!archive.version) {
     // Upgrade from v1 to v2
     archive = {
       version: 2,
       data: archive.sections || [],
     };
     localStorage.setItem('arecibo_archive', JSON.stringify(archive));
   }
   ```

---

## Browser Compatibility

### Problem: Canvas Rendering Breaks on Safari

**Symptoms:** Grid shows as blurry or doesn't render

**Fixes:**

1. **Use image-rendering property:**
   ```css
   canvas {
     image-rendering: crisp-edges;
     image-rendering: pixelated;
     -ms-interpolation-mode: nearest-neighbor;
   }
   ```

2. **Check canvas context:**
   ```javascript
   const ctx = canvas.getContext('2d', {
     willReadFrequently: true,  // For Safari
   });
   ```

---

## Emergency Recovery

### Complete Archive Wipe (if corrupted)

```javascript
// WARNING: This deletes all archived recaps!
localStorage.removeItem('arecibo_archive');
console.log('Archive cleared. Reload page to continue.');
```

### Reset to Fallback Templates

```javascript
// Force use of templates (no LLM)
window.ARECIBO_FORCE_TEMPLATES = true;

// Then regenerate
const intent = generateAreciboIntent({
  weekData: {...},
  llmBudget: 0,  // Skip LLM
  llmService: null,
});
```

### Clear All Arecibo Data

```javascript
localStorage.removeItem('arecibo_archive');
localStorage.removeItem('arecibo_current');
sessionStorage.clear();
console.log('All Arecibo data cleared. Page will reload.');
location.reload();
```

---

## Logging & Debugging

### Enable Debug Mode

```javascript
// In console
window.DEBUG_ARECIBO = true;

// Then any function will log:
if (window.DEBUG_ARECIBO) {
  console.log('[ARECIBO]', message);
}
```

### Performance Timeline

```javascript
performance.mark('arecibo-start');
// Generate recap
performance.mark('arecibo-end');
performance.measure('arecibo', 'arecibo-start', 'arecibo-end');

// View results
performance.getEntriesByType('measure').forEach(m => {
  console.log(`${m.name}: ${m.duration.toFixed(2)}ms`);
});
```

### Full Request/Response Log

```javascript
// In expressionEngine.js, wrap LLM call:
console.log('LLM Request:', {
  model: 'claude-3-5-sonnet-20241022',
  systemPromptLength: systemPrompt.length,
  userPromptLength: userPrompt.length,
  timestamp: new Date().toISOString(),
});

const response = await llmService.call(...);
console.log('LLM Response:', {
  contentLength: response.content.length,
  usage: response.usage,
  timestamp: new Date().toISOString(),
});
```

---

## Support Contact

- **Issue not listed?** Check `ARECIBO_SYSTEM_README.md`
- **Code question?** See `ARECIBO_DEVELOPER_GUIDE.md`
- **How to test?** See `ARECIBO_SCENARIO_TESTS.md`

---

**Last Updated:** March 23, 2026  
**Version:** 1.0  
**Status:** Ready for Support
