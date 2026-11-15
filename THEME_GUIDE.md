# Watchlify Theme & Design System Guide (थीम गाइड)

यह डॉक्यूमेंट Watchlify के पूरे डिज़ाइन सिस्टम, CSS आर्किटेक्चर, और कलर टोकन्स का कम्प्लीट रेफरेंस है। 
अगर आपको भविष्य में कभी भी **पूरी थीम एक साथ बदलनी हो** (जैसे Emerald से Indigo, Violet, Rose, Minimalist Monochrome, आदि), तो आप इस गाइड को रेफर करके या एजेंट को यह फाइल देकर एक कमांड में पूरी थीम बदलवा सकते हैं।

---

## 1. आर्किटेक्चर और कोर रूल्स (Core Theme Architecture)

Watchlify में दोहरी थीमिंग (Dual Theming) चलती है:
1. **Dark Theme (Obsidian Forest Slate)**: डिफॉल्ट थीम `:root` वेरिएबल्स पर बेस्ड है।
2. **Light Theme (Clean CourseIt-Style Mint/White)**: `html.light` क्लास के जरिए एक्टिवेट होती है।
3. **Tailwind v4 Integration**:
   - `app/globals.css` के टॉप पर `@custom-variant dark (&:where(.dark, .dark *));` डिक्लेयर्ड है।
   - इससे यूजर के कंप्यूटर का OS Dark Mode कभी भी Light Mode के ऊपर ओवरराइड नहीं करता।

---

## 2. कोर कलर टोकन्स (Design Tokens Dictionary)

जब भी आपको पूरी थीम का कलर बदलना हो, सिर्फ इन वेरिएबल्स और हेक्स कोड्स को चेंज करना है:

### A. Dark Mode (`:root` in `app/globals.css`)
```css
:root {
  /* Surfaces */
  --background: #0d1210;       /* Base app canvas */
  --paper: #0d1210;
  --surface: #141b18;          /* 22px Cards background */
  --surface-raised: #18221e;
  --surface-hover: #1e2823;
  --surface-muted: #19211d;

  /* Typography / Ink */
  --ink: #f2f5f3;              /* Main headings and titles */
  --ink-soft: #9eaba3;         /* Paragraphs and secondary text */
  --muted: #74837a;            /* Captions and timestamps */
  --subtle: #526058;

  /* Borders / Lines */
  --line: rgba(242, 245, 243, 0.08);
  --line-strong: rgba(242, 245, 243, 0.16);

  /* Brand / Primary Accent */
  --primary: #8fc73a;          /* Luminous Lime / Emerald */
  --lime: #8fc73a;
  --primary-foreground: #0d1210;
  --secondary: #38bdf8;
}
```

### B. Light Mode (`html.light` in `app/globals.css`)
```css
html.light {
  /* Surfaces */
  --background: #f7faf8;       /* Ambient soft-mint mesh */
  --paper: #ffffff;            /* Pure white clean cards */
  --surface: #ffffff;          /* 22px Cards background */
  --surface-raised: #ffffff;
  --surface-hover: #f3f7f4;
  --surface-muted: #eaf1ed;

  /* Typography / Ink */
  --ink: #121815;              /* Deep charcoal/black bold ink */
  --ink-soft: #4a5850;         /* Clear readable dark slate copy */
  --muted: #74837a;            /* Clean captions */
  --subtle: #87968d;

  /* Borders / Lines */
  --line: rgba(18, 24, 21, 0.08);
  --line-strong: rgba(18, 24, 21, 0.16);

  /* Brand / Primary Accent */
  --primary: #1e3f2d;          /* Deep Forest Jade */
  --lime: #2e7d47;             /* Emerald Accent */
  --primary-foreground: #ffffff;
}
```

---

## 3. कार्ड्स और स्टेडियम पिल्स का डिज़ाइन सिस्टम (Geometry Rules)

1. **Card Radius (22px)**:
   - सभी मुख्य कार्ड्स (`.usecase-card`, `.hub-card`, `.subject-card`, `.profile-settings-card`, `.watch-study-panel`, `.course-detail-hero-compact`) पर `border-radius: 22px !important;` या `rounded-2xl` है।
   - बॉर्डर: `1px solid rgba(18, 24, 21, 0.08)`।
   - शैडो: `0 1px 4px rgba(18, 24, 21, 0.05)`.
2. **Stadium Pills (9999px)**:
   - सभी बटन्स, टैग्स, फ़िल्टर चिप्स, सर्च बार और इनपुट कंटेनर्स पर `border-radius: 9999px !important;` या `rounded-full` है।

---

## 4. कहाँ-कहाँ क्या-क्या चेंज हुआ है (Complete Component Inventory)

### 1. होमपेज (`app/page.tsx`, `app/globals.css`)
- **Hero Stadium URL Form**: सिंगल रो हॉरिजॉन्टल स्टेडियम पिल (`border-radius: 9999px`) + रेस्पॉन्सिव "Open in Workspace →" बटन।
- **Target Audience / Use Cases (`.usecase-card`)**: 3 कार्ड्स (GATE, Developers, College) — Clean White 22px cards, bold `#121815` headings, `#4a5850` readable text।
- **FAQ Accordion (`.faq-item`, `.faq-question`, `.faq-answer`)**: Clean white accordions, `#121815` questions, `#4a5850` answers।
- **Closing CTA (`.closing-cta`)**: Clean white banner with deep jade CTA।

### 2. नेवबार (`components/SiteHeader.tsx`, `app/globals.css`)
- **Floating Stadium Pill Navbar**: White background with soft border and backdrop blur।
- **Daily Focus Ring Button (`.header-goal-ring-btn`)**: Soft white container with subtle border (`border: 1px solid rgba(18, 24, 21, 0.12)`), `#121815` percentage text (0%)।
- **Streak Flame Icon**: Realistic orange/amber gradient without dark container।

### 3. डैशबोर्ड (`app/dashboard/page.tsx`, `components/AddCourseForm.tsx`, `components/CourseLibrary.tsx`)
- **Compact Add Course Bar (`.add-course-compact-row`)**: Pure white stadium bar (`border-radius: 9999px`), `#121815` text, emerald focus ring।
- **Quick Select Presets ("Or pick curated:")**: Pure white stadium pills with subtle borders (`border-neutral-200`) and `#121815` text।
- **"Pick from Curated" Button**: Clean white rounded-lg button with emerald sparkle icon।
- **Grid / List View Mode Toggle (`.view-mode-toggle`)**: Clean white capsule, active button highlighted with soft emerald tint (`rgba(46, 125, 71, 0.12)`)।
- **Achievements Container (`.achievements-compact-container`)**: Clean white 14px card।

### 4. कोर्स डिटेल पेज (`app/courses/[id]/page.tsx`, `components/CourseLessonList.tsx`)
- **Course Detail Hero (`.course-detail-hero-compact`)**: Clean white 22px card with bold `#121815` title, channel byline, and progress track।
- **Lessons Search & Filter Bar (`.course-lesson-search-bar`)**: Clean white 2xl bar, search input with `#f8faf9` background, and high-contrast filter pills (`All`, `Pending`, `Completed`)।
- **Lesson Rows (`.video-row`)**: Clean white rows (`border-radius: 14px`), `#121815` video titles, `#526058` duration metadata, light gray status badges।

### 5. वॉच पेज (`app/watch/[courseId]/[videoId]/page.tsx`, `components/WatchStudyPanel.tsx`)
- **Top Header Bar (`.watch-top-compact`)**: Clean white 14px bar, `#121815` title, emerald `Lesson XX / YY` pill, and white Pomodoro button।
- **Player Action Bar (`.player-action-bar`)**: Clean white 14px bar, forest green "Mark as complete" button (`#1e3f2d`), soft light "Next video →" & "Schedule" pills, emerald speed options, and autoplay toggle।
- **Bottom Pagination (`.watch-prev`, `.watch-next`)**: Clean white 14px cards with soft shadow and green directional arrows।

### 6. स्टडी डेस्क के तीनों टैब्स (`components/WatchStudyPanel.tsx`)
- **Tab Bar (`.watch-tabs-bar`)**: Stadium pill buttons for `📝 Notes`, `🤖 AI Tutor`, `ℹ️ Description`।
- **AI Tutor Tab (`components/AiStudyAssist.tsx`)**:
  - Clean header with glowing emerald spark icon and bold title।
  - High-contrast stadium sub-tabs (`💡 Key Takeaways`, `📝 Practice Quiz`, `💬 Ask AI Tutor`)।
  - **Key Takeaways**: Clean white cards with green number badges (`1`, `2`, `3`) instead of dark gray boxes।
  - **Practice Quiz**: Clean interactive MCQ tiles with radio selection, green/red check indicators, and explanations।
  - **Ask AI Tutor**: Clean question input, prompt chips, and styled chat bubbles with 1-click note saving।
- **Description Tab (`components/VideoDescription.tsx`)**:
  - Purana solid black box replace hokar **Clean White 16px Card** ban gaya hai with `#121815` body text, deep jade channel title, clickable blue links, and emerald timestamp chips।
- **Notes Tab (`components/VideoNotes.tsx`)**:
  - Clean white textarea, soft neutral "Current time" pill, and high-contrast markdown export।

### 7. स्टडी हब्स (`app/study-hubs/page.tsx`, `components/StudyHubWorkspace.tsx`)
- **Study Hub Card (`/study-hubs`)**:
  - Hub Title (`7th Semester - B.Tech CSE`): Bold `#121815` (invisible white text fixed!)।
  - Target Date (`📅 1 Dec 2026`): Soft light neutral badge (`background: #f1f5f9; border: 1px solid #cbd5e1; color: #334155`)।
- **Study Hub Workspace (`/study-hubs/[id]`)**:
  - **Subject Switcher Bar (`.subject-switcher-bar`)**: Clean white stadium bar।
  - **Subject Cards (`.subject-card`)**: Clean white 22px cards with color-coded top bars।
  - **Subject Progress Box (`.subject-progress-box`)**: Pehle solid black box tha, ab clean `#f8faf9` soft-neutral box with dark readable stats (`0 of 2 lectures watched`)।

### 8. सेटिंग्स पेज (`app/settings/page.tsx`, `components/ProfileSettingsForms.tsx`)
- **Page Heading (`.settings-page-heading h1`)**: Bold dark charcoal `#121815` (washed-out white text fixed!)।
- **Form Labels (`.profile-field-label`)**: Bold dark charcoal `#121815`।
- **Daily Study Goal Unit (`.profile-goal-unit`)**: Pehle black box tha, ab soft light neutral badge (`#f1f5f9`) with dark text (`minutes / day`)।
- **Inputs & Textareas**: Pure white background with emerald focus ring।
- **Reminder Toggle**: Clean light card (`#f8faf9`) with high contrast text।

### 9. ऑथ पेजेस (`app/login/page.tsx`, `app/signup/page.tsx`)
- **Google Benefits Box (`.auth-google-benefits`)**: Pure black box ko clean soft light-tint card me badal diya gaya hai with dark readable bullet copy।

---

## 5. भविष्य में पूरी थीम को एक साथ कैसे बदलें (How to Change the Whole Theme in 1 Shot)

अगर आपको पूरी थीम का कलर (जैसे Emerald से Violet, Sapphire Blue, Warm Amber, या Midnight Monochrome) में बदलना हो, तो आप AI एजेंट को सिर्फ यह प्रॉम्प्ट दे सकते हैं:

> **"THEME_GUIDE.md के अनुसार Watchlify की पूरी थीम को [Color Name, e.g. Electric Violet / Sapphire Blue / Minimal Monochrome] में बदल दो। Primary accent, buttons, focus rings, hover states, और badges को एक साथ नए कलर पैलेट से अपडेट कर दो।"**

### मैन्युअल बदलाव के लिए 3 मेन जगहें:
1. **`app/globals.css` के `:root` वेरिएबल्स** (Dark mode primary, surface, line, ink).
2. **`app/globals.css` के `html.light` वेरिएबल्स** (Light mode primary, background, surface, ink).
3. **`app/globals.css` के अंत में "TARGETED LIGHT MODE CARD & WIDGET ENHANCEMENTS" ब्लॉक**:
   - Primary button color: `#1e3f2d` (hover `#142a1e`) ko apne naye primary color se replace karein.
   - Accent green/emerald: `#2e7d47` / `rgba(46, 125, 71, ...)` ko apne naye accent color se replace karein.

---

## 6. समरी टेबल (File-to-Feature Map)

| कंपोनेंट / पेज | फाइल पाथ | मुख्य CSS क्लासेस |
|---|---|---|
| **Global Theme & Variables** | `app/globals.css` | `:root`, `html.light`, `@custom-variant dark` |
| **Navbar & Goal Ring** | `components/SiteHeader.tsx` | `.site-header`, `.header-goal-ring-btn`, `.site-nav-pill` |
| **Dashboard Add Course** | `components/AddCourseForm.tsx` | `.add-course-compact-row`, `.add-course-compact-input`, `.add-course-compact-btn` |
| **Course Library & View Toggle** | `components/CourseLibrary.tsx` | `.view-mode-toggle`, `.view-mode-btn`, `.course-card` |
| **Course Detail Hero** | `app/courses/[id]/page.tsx` | `.course-detail-hero-compact`, `.course-utilities-compact` |
| **Lesson Search & Filter** | `components/CourseLessonList.tsx` | `.course-lesson-search-bar`, `.video-row` |
| **Watch Page Layout** | `app/watch/[courseId]/[videoId]/page.tsx` | `.watch-top-compact`, `.player-action-bar`, `.watch-pagination` |
| **Study Desk 3 Tabs** | `components/WatchStudyPanel.tsx` | `.watch-tabs-bar`, `.watch-tab-btn`, `.watch-tab-content` |
| **AI Study Assistant** | `components/AiStudyAssist.tsx` | `.ai-tutor-container`, Key Takeaways, MCQs, Chat |
| **Video Description Card** | `components/VideoDescription.tsx` | `.video-description-card`, `.video-description-body` |
| **Video Notes** | `components/VideoNotes.tsx` | `.video-notes-panel`, `.video-note-capture-btn` |
| **Study Hub Cards** | `components/StudyHubsList.tsx` | `.hub-card`, `.hub-target-date`, `.hub-title-link` |
| **Study Hub Workspace** | `components/StudyHubWorkspace.tsx` | `.subject-switcher-bar`, `.subject-card`, `.subject-progress-box` |
| **Account Settings** | `components/ProfileSettingsForms.tsx` | `.settings-page-heading`, `.profile-field-label`, `.profile-goal-unit` |
