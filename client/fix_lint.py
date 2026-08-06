from pathlib import Path
import re
root = Path('client/src')
changes = []
for path in root.rglob('*.jsx'):
    text = path.read_text(encoding='utf-8')
    orig = text
    # remove unused React default imports
    text = re.sub(r"^import\s+React\s+from\s+['\"]react['\"]\s*;?\s*\n?", '', text, flags=re.MULTILINE)
    text = re.sub(r"^import\s+React\s*,\s*\{\s*([^}]+?)\s*\}\s*from\s+['\"]react['\"]\s*;?\s*\n?", lambda m: f"import {{ {m.group(1).strip()} }} from 'react'\n", text, flags=re.MULTILINE)
    # remove useNavigate import if unused
    if path.name == 'FeaturedDestination.jsx':
        text = re.sub(r"^import\s+\{\s*useNavigate\s*\}\s+from\s+['\"]react-router-dom['\"]\s*;?\s*\n?", '', text, flags=re.MULTILINE)
    # fix broken navigate line breaks in Navbar.jsx
    if path.name == 'Navbar.jsx':
        text = text.replace("onClick={()=> isOwner ? navigate\n                        ('/owner') : setShowHotelReg(true)}",
                            "onClick={() => isOwner ? navigate('/owner') : setShowHotelReg(true)}")
        text = text.replace("onClick={()=> isOwner ? navigate\n                    ('/owner') : setShowHotelReg(true)}",
                            "onClick={() => isOwner ? navigate('/owner') : setShowHotelReg(true)}")
    # fix duplicated className issue in MyBookings.jsx
    if path.name == 'MyBookings.jsx':
        text = text.replace("className='className=\"text-gray-500 text-sm\"'", 'className="text-gray-500 text-sm"')
        text = text.replace('className="className="text-gray-500 text-sm""', 'className="text-gray-500 text-sm"')
    # add StrictMode wrapper if missing in main.jsx
    if path.name == 'main.jsx' and '<StrictMode>' not in text:
        text = text.replace("createRoot(document.getElementById('root')).render(\n  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl=\"/\">\n  <BrowserRouter>\n  <AppProvider>\n    <App />\n    </AppProvider>\n  </BrowserRouter>\n   </ClerkProvider>,\n)",
                            "createRoot(document.getElementById('root')).render(\n  <StrictMode>\n    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl=\"/\">\n      <BrowserRouter>\n        <AppProvider>\n          <App />\n        </AppProvider>\n      </BrowserRouter>\n    </ClerkProvider>\n  </StrictMode>,\n)")
    if text != orig:
        path.write_text(text, encoding='utf-8')
        changes.append(str(path))
print('changed files:')
for c in changes:
    print(c)
