
# Agentation Zero Verification Plan

## 1. Zero Config Start (Local)
- [ ] Run `npm run dev` in `agentation-zero`.
- [ ] Verify console output shows local URL.
- [ ] Verify `annotations.json` is created in root if missing.
- [ ] Open localhost in browser.
- [ ] Verify Toolbar appears in Chinese.
- [ ] Click "添加标注", select an element.
- [ ] Verify blocking interaction works (links don't navigate).
- [ ] Save annotation.
- [ ] Verify `annotations.json` has new entry.

## 2. Ngrok Tunneling
- [ ] Set `NGROK_AUTHTOKEN` env var or configure plugin.
- [ ] Run `npm run dev`.
- [ ] Verify console output: `🚀 Public URL: ...ngrok...`.
- [ ] Copy Ngrok URL, open in Incognito/Simulated Mobile.
- [ ] Verify existing annotations load.
- [ ] Add new annotation from remote.
- [ ] Verify local browser sees update (after refresh/poll).

## 3. Locator Plugin
- [ ] Inspect Element in DevTools.
- [ ] Verify `data-agentation-location` attribute is NOT present (since we haven't implemented babel transform yet, just placeholder).
- [ ] *Future*: Implement Babel plugin and verify attribute shows `file:line`.

## 4. Click Interception Robustness
- [ ] Find a link (`<a>`).
- [ ] Enable "添加标注".
- [ ] Click the link.
- [ ] Verify:
    - Navigation blocked.
    - Annotation popup opens.
    - Popup positioned correctly.
