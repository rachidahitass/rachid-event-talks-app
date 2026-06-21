# BigQuery Release Explorer

A modern, high-fidelity web application built with **Python Flask** and **Vanilla JS/CSS/HTML** that retrieves, organizes, and parses Google BigQuery release notes. The application enables users to search, filter by category, and easily customize and share specific updates directly to X (formerly Twitter).

---

## ✨ Features

*   **Granular Update Extraction**: Parses Google's daily Atom XML entries and uses `BeautifulSoup` to split grouped updates into individual cards (categorized under *Feature*, *Announcement*, *Changed*, *Deprecated*, *Fix*, etc.).
*   **Memory Caching**: Implements a 10-minute server-side memory cache with network failure recovery (falls back to cached data if Google's feed is temporarily unreachable).
*   **Live Search & Filter**: Instantly filter updates by category pills or search through content text client-side.
*   **Interactive Tweet Composer**: Automatically translates HTML to clean text, truncates description content to fit X's post limit, and launches X's web intent with pre-populated hashtags (`#BigQuery #GoogleCloud`).
*   **Premium Visuals**: Styled with a responsive space-dark theme using glassmorphism, Google Fonts (`Outfit` & `Inter`), custom gradient accents, and skeleton loaders.

---

## 📁 Repository Structure

```text
bq-releases-notes/
├── app.py                  # Flask server, Atom XML parser & BeautifulSoup splitter
├── requirements.txt        # Backend dependencies
├── .gitignore              # Ignored compilation files, venv, and IDE files
├── templates/
│   └── index.html          # Semantic HTML dashboard template & Composer Modal
└── static/
    ├── css/
    │   └── style.css       # Custom design system, skeleton screens, responsive styling
    └── js/
        └── app.js          # Client state engine, search filter, and X sharing logic
```

---

## 🛠️ Getting Started

### Prerequisites
*   Python 3.8+
*   Pip (Python Package Installer)

### Installation

1.  Clone or navigate to the repository directory:
    ```bash
    cd bq-releases-notes
    ```

2.  Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

### Running the Application

1.  Start the local Flask development server:
    ```bash
    python app.py
    ```

2.  Open your browser and navigate to:
    👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## ⚙️ Key Technical Files

*   **Backend Server**: [app.py](file:///O:/dev_projects/agy-cli-projects/bq-releases-notes/app.py)
*   **UI Layout**: [templates/index.html](file:///O:/dev_projects/agy-cli-projects/bq-releases-notes/templates/index.html)
*   **Design Tokens**: [static/css/style.css](file:///O:/dev_projects/agy-cli-projects/bq-releases-notes/static/css/style.css)
*   **Client State**: [static/js/app.js](file:///O:/dev_projects/agy-cli-projects/bq-releases-notes/static/js/app.js)
